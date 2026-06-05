# deploy-llm-proxy.ps1
# Stand up the keyed IIS -> SGLang reverse proxy on bcc-ap-llm01.
# Run in an ELEVATED PowerShell:
#   powershell -ExecutionPolicy Bypass -File C:\deploy-llm-proxy.ps1 -ApiKey <hex-key>
# Idempotent: safe to re-run. Forwards /v1/* to SGLang on infer01:30000, gated by the API key you pass in.
# The key is NOT stored in this script -- supply it at runtime via -ApiKey.
param([Parameter(Mandatory=$true)][string]$ApiKey)
$ErrorActionPreference = "Stop"
Import-Module WebAdministration

$siteName = "llm-api-proxy"
$sitePath = "C:\inetpub\llm-api-proxy"
$port     = 8443
$key      = "Bearer $ApiKey"

Write-Host "`n== 1/7  Folder + web.config =="
New-Item -ItemType Directory -Path $sitePath -Force | Out-Null
$webconfig = @'
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rewriteMaps>
        <rewriteMap name="ApiKeys" defaultValue="">
          <add key="Bearer __APIKEY__" value="elliot" />
        </rewriteMap>
      </rewriteMaps>
      <rules>
        <rule name="RequireApiKey" stopProcessing="true">
          <match url=".*" />
          <conditions>
            <add input="{ApiKeys:{HTTP_AUTHORIZATION}}" pattern="^$" />
          </conditions>
          <action type="CustomResponse" statusCode="401" statusReason="Unauthorized" statusDescription="Missing or invalid API key" />
        </rule>
        <rule name="ProxyV1" stopProcessing="true">
          <match url="^(v1/.*)" />
          <action type="Rewrite" url="http://bcc-ap-infer01.bcc.ad.mymanatee.org:30000/{R:1}" />
        </rule>
        <rule name="BlockTheRest" stopProcessing="true">
          <match url=".*" />
          <action type="CustomResponse" statusCode="404" statusReason="Not Found" />
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <requestLimits maxAllowedContentLength="1048576" />
      </requestFiltering>
    </security>
  </system.webServer>
</configuration>
'@
$webconfig = $webconfig.Replace("__APIKEY__", $ApiKey)
[System.IO.File]::WriteAllText("$sitePath\web.config", $webconfig, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "   web.config written ($((Get-Item "$sitePath\web.config").Length) bytes)"

Write-Host "== 2/7  Enable ARR proxy (server level) =="
try {
  Set-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter "system.webServer/proxy" -Name "enabled" -Value $true
  Write-Host "   ARR proxy enabled"
} catch {
  Write-Warning "   Could not enable ARR proxy - is ARR installed? $_"
}

Write-Host "== 3/7  (Re)create site on $port =="
if (Get-Website -Name $siteName -ErrorAction SilentlyContinue) { Remove-Website -Name $siteName }
Remove-Item "IIS:\SslBindings\0.0.0.0!$port" -ErrorAction SilentlyContinue
# New-Website here has no -Protocol param; create the site, then swap its binding to https.
New-Website -Name $siteName -PhysicalPath $sitePath -Port $port -Force | Out-Null
Get-WebBinding -Name $siteName | Remove-WebBinding
New-WebBinding -Name $siteName -Protocol "https" -Port $port -IPAddress "*"

Write-Host "== 4/7  Bind TLS cert (reuse the :443 cert) =="
$thumb = (Get-ChildItem IIS:\SslBindings | Where-Object { $_.Port -eq 443 } | Select-Object -First 1).Thumbprint
if (-not $thumb) {
  $thumb = (Get-ChildItem Cert:\LocalMachine\My | Where-Object { $_.Subject -like "*mymanatee*" } | Select-Object -First 1).Thumbprint
}
if (-not $thumb) { throw "No TLS cert found to bind. Bind one in IIS Manager, then re-run." }
Get-Item "Cert:\LocalMachine\My\$thumb" | New-Item "IIS:\SslBindings\0.0.0.0!$port" | Out-Null
Write-Host "   Bound cert $thumb"

Write-Host "== 5/7  App pool No Managed Code + anonymous auth =="
Set-ItemProperty "IIS:\AppPools\$siteName" -Name "managedRuntimeVersion" -Value ""
try {
  Set-WebConfigurationProperty -PSPath "IIS:\Sites\$siteName" -Filter "system.webServer/security/authentication/anonymousAuthentication" -Name "enabled" -Value $true
  Set-WebConfigurationProperty -PSPath "IIS:\Sites\$siteName" -Filter "system.webServer/security/authentication/windowsAuthentication" -Name "enabled" -Value $false
} catch {
  Write-Warning "   Auth section locked - set Anonymous=on / Windows=off in IIS Manager. $_"
}
Restart-WebItem "IIS:\AppPools\$siteName" -ErrorAction SilentlyContinue
Restart-WebItem "IIS:\Sites\$siteName" -ErrorAction SilentlyContinue

Write-Host "== 6/7  Firewall rule for $port =="
Get-NetFirewallRule -DisplayName "LLM API Proxy $port" -ErrorAction SilentlyContinue | Remove-NetFirewallRule
New-NetFirewallRule -DisplayName "LLM API Proxy $port" -Direction Inbound -Protocol TCP -LocalPort $port -Action Allow | Out-Null
Write-Host "   firewall open on $port (scope to your VPN subnet later)"

Write-Host "== 7/7  Self-test =="
Start-Sleep -Seconds 2
$withKey = curl.exe -s -k -o NUL -w "%{http_code}" "https://localhost:$port/v1/models" -H "Authorization: $key"
$noKey   = curl.exe -s -k -o NUL -w "%{http_code}" "https://localhost:$port/v1/models"
Write-Host "   with key -> HTTP $withKey   (want 200)"
Write-Host "   no key   -> HTTP $noKey   (want 401)"
if ($withKey -eq "200" -and $noKey -eq "401") {
  Write-Host "`nPROXY UP:  https://bcc-ap-llm01.bcc.ad.mymanatee.org:$port/v1   model: qwen2.5-7b" -ForegroundColor Green
} else {
  Write-Host "`nNOT fully working. Check: backend reachable (curl infer01:30000/v1/models) and ARR proxy enabled." -ForegroundColor Yellow
}
