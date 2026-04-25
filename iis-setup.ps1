# Configure IIS reverse proxy for cookbook.
# Run as Administrator from C:\cookbook (where today's dist/ lives).
# Requires: URL Rewrite + ARR modules already installed.

$ErrorActionPreference = 'Stop'

$IISRoot = 'C:\inetpub\wwwroot\cookbook\public'
$SourceStatic = 'C:\cookbook\dist\public'
$SiteName = 'Default Web Site'

Write-Host "=== 1. Stop IIS site ===" -ForegroundColor Green
Import-Module WebAdministration
Stop-Website -Name $SiteName

Write-Host "=== 2. Sync static files from $SourceStatic to $IISRoot ===" -ForegroundColor Green
if (-not (Test-Path $IISRoot)) {
    New-Item -ItemType Directory -Path $IISRoot -Force | Out-Null
}
# Mirror: clean target first to avoid stale bundle leftovers
Get-ChildItem -Path $IISRoot -Force | Remove-Item -Recurse -Force
Copy-Item -Path "$SourceStatic\*" -Destination $IISRoot -Recurse -Force

Write-Host "=== 3. Write web.config ===" -ForegroundColor Green
$webConfig = @'
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="ReverseProxyToNode" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://localhost:3000/api/{R:1}" />
        </rule>
      </rules>
    </rewrite>
    <httpErrors errorMode="DetailedLocalOnly" />
    <staticContent>
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="00:00:00" />
    </staticContent>
  </system.webServer>
</configuration>
'@
Set-Content -Path "$IISRoot\web.config" -Value $webConfig -Encoding UTF8

Write-Host "=== 4. Enable ARR proxy at server level ===" -ForegroundColor Green
& "$env:windir\system32\inetsrv\appcmd.exe" set config -section:system.webServer/proxy /enabled:'True' /commit:apphost

Write-Host "=== 5. Disable ARR disk cache (avoid SSE buffering) ===" -ForegroundColor Green
& "$env:windir\system32\inetsrv\appcmd.exe" set config -section:system.webServer/proxy /preserveHostHeader:'True' /commit:apphost

Write-Host "=== 6. Start IIS site ===" -ForegroundColor Green
Start-Website -Name $SiteName

Start-Sleep -Seconds 2

Write-Host "=== 7. Smoke test through IIS ===" -ForegroundColor Green
try {
    $health = Invoke-RestMethod -Uri http://localhost/api/health -TimeoutSec 5
    Write-Host "Health via IIS: $($health | ConvertTo-Json -Compress)" -ForegroundColor Green
}
catch {
    Write-Host "FAIL: /api/health via IIS returned error: $_" -ForegroundColor Red
    Write-Host "Check IIS logs: C:\inetpub\logs\LogFiles\W3SVC1\"
    exit 1
}

Write-Host ""
Write-Host "=== IIS reverse proxy live ===" -ForegroundColor Green
Write-Host "Static files: $IISRoot"
Write-Host "API proxied:  http://localhost/api/* -> http://localhost:3000/api/*"
Write-Host "Test in browser: http://bcc-ap-llm01.bcc.ad.mymanatee.org/"
