# Enable IIS Windows Authentication and restrict access to a hard-coded allowlist.
# Run as Administrator on bcc-ap-llm01. Requires URL Rewrite + ARR already installed.
#
# After this runs:
#   - Anonymous Authentication: disabled
#   - Windows Authentication:   enabled (NTLM/Kerberos SSO for domain users)
#   - web.config <authorization>: only the listed accounts can reach the site
#
# Non-allowlist domain users get HTTP 401. Non-domain machines get an auth popup.

$ErrorActionPreference = 'Stop'

$IISRoot = 'C:\inetpub\wwwroot\cookbook\public'
$SiteName = 'Default Web Site'
$AllowedUsers = 'BCC\ejarbeadm,BCC\marriagaadm,BCC\csolanadm,BCC\kmonroeadm'

Write-Host "=== 1. Install IIS Windows Auth feature (if missing) ===" -ForegroundColor Green
Install-WindowsFeature Web-Windows-Auth -IncludeAllSubFeature | Out-Null

Write-Host "=== 2. Disable Anonymous Auth on '$SiteName' ===" -ForegroundColor Green
Set-WebConfigurationProperty `
    -PSPath 'MACHINE/WEBROOT/APPHOST' `
    -Filter 'system.webServer/security/authentication/anonymousAuthentication' `
    -Name enabled -Value $false `
    -Location $SiteName

Write-Host "=== 3. Enable Windows Auth on '$SiteName' ===" -ForegroundColor Green
Set-WebConfigurationProperty `
    -PSPath 'MACHINE/WEBROOT/APPHOST' `
    -Filter 'system.webServer/security/authentication/windowsAuthentication' `
    -Name enabled -Value $true `
    -Location $SiteName

Write-Host "=== 4. Write web.config (rewrite + authorization allowlist) ===" -ForegroundColor Green
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
        <rule name="SPA fallback" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/api/" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
    <httpErrors errorMode="DetailedLocalOnly" />
    <staticContent>
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="00:00:00" />
    </staticContent>
    <security>
      <authorization>
        <remove users="*" roles="" verbs="" />
        <add accessType="Allow" users="__ALLOWED_USERS__" />
      </authorization>
    </security>
  </system.webServer>
</configuration>
'@
$webConfig = $webConfig.Replace('__ALLOWED_USERS__', $AllowedUsers)
Set-Content -Path "$IISRoot\web.config" -Value $webConfig -Encoding UTF8

Write-Host "=== 5. iisreset ===" -ForegroundColor Green
& iisreset /noforce | Out-Null

Start-Sleep -Seconds 2

Write-Host "=== 6. Verify auth state ===" -ForegroundColor Green
$anon = Get-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter 'system.webServer/security/authentication/anonymousAuthentication' -Name enabled -Location $SiteName
$winauth = Get-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter 'system.webServer/security/authentication/windowsAuthentication' -Name enabled -Location $SiteName
Write-Host "Anonymous Auth: $($anon.Value)  (expected: False)"
Write-Host "Windows Auth:   $($winauth.Value)  (expected: True)"

Write-Host ""
Write-Host "=== Auth gate live ===" -ForegroundColor Green
Write-Host "Allowed: $AllowedUsers"
Write-Host ""
Write-Host "Test from a domain-joined browser:"
Write-Host "  https://mcgpt.mymanatee.org/"
Write-Host "  -> allowlist member: SSO (no prompt), cookbook loads"
Write-Host "  -> non-member:       HTTP 401"
Write-Host ""
Write-Host "If you ever lock yourself out, undo with:"
Write-Host "  Remove-Item C:\inetpub\wwwroot\cookbook\public\web.config (will need to re-run iis-setup.ps1)"
