# Enable IIS Windows Authentication and restrict access to a hard-coded allowlist.
# Run as Administrator on bcc-ap-llm01. Requires URL Rewrite + ARR already installed.
# Must be run AFTER iis-setup.ps1 (which lays down static files and base web.config).
#
# After this runs:
#   - Anonymous Authentication: disabled
#   - Windows Authentication:   enabled (NTLM/Kerberos SSO for domain users)
#   - web.config <authorization>: only the listed accounts can reach the site
#
# Non-allowlist domain users get HTTP 401. Non-domain machines get an auth popup.
#
# Usage (must mirror iis-setup.ps1 invocation):
#   .\enable-auth.ps1                          # root mount (default) — gating https://mcgpt.mymanatee.org/
#   .\enable-auth.ps1 -BasePath "/cookbook"    # subpath mount — gating https://mcgpt.mymanatee.org/cookbook/
#
# IMPORTANT: always pass the same -BasePath value used for iis-setup.ps1.
# Mismatched BasePath between the two scripts will corrupt the web.config rewrite rules.

param(
    [string]$BasePath = ""
)

$ErrorActionPreference = 'Stop'

$IISRoot = 'C:\inetpub\wwwroot\cookbook\public'
$SiteName = 'Default Web Site'
$AllowedUsers = 'BCC\ejarbeadm,BCC\marriagaadm,BCC\csolanadm,BCC\kmonroeadm'

# Normalise BasePath: must be empty or start with "/" and have no trailing slash
if ($BasePath -ne "") {
    $BasePath = '/' + $BasePath.Trim('/')
}

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

Write-Host "=== 4. Write web.config (rewrite + serverVariables + authorization allowlist) ===" -ForegroundColor Green
$webConfig = @"
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
            <add input="{REQUEST_URI}" pattern="^${BasePath}/api/" negate="true" />
          </conditions>
          <action type="Rewrite" url="${BasePath}/index.html" />
        </rule>
      </rules>
      <serverVariables>
        <!-- Forward IIS Windows Auth identity to the Node backend as iisaf-* headers. -->
        <!-- IIS sets LOGON_USER = "DOMAIN\username" (e.g. "BCC\ejarbeadm").           -->
        <!-- iisaf-dept and iisaf-roleband are NOT populated from IIS Windows Auth;     -->
        <!-- they fall through to defaults ("unknown"/"professional") in roi-emit.ts    -->
        <!-- until a separate AD lookup integration is added.                            -->
        <set name="HTTP_IISAF_USERNAME" value="{LOGON_USER}" />
        <set name="HTTP_IISAF_DEPT" value="" />
        <set name="HTTP_IISAF_ROLEBAND" value="" />
      </serverVariables>
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
"@
$webConfig = $webConfig.Replace('__ALLOWED_USERS__', $AllowedUsers)
Set-Content -Path "$IISRoot\web.config" -Value $webConfig -Encoding UTF8

Write-Host "=== 5. Register iisaf-* server variables in ARR allowlist ===" -ForegroundColor Green
# IIS requires custom server variables to be whitelisted at applicationHost level before
# rewrite rules can set them. These lines are idempotent (no-op if already present).
foreach ($varName in @('HTTP_IISAF_USERNAME', 'HTTP_IISAF_DEPT', 'HTTP_IISAF_ROLEBAND')) {
    $exists = & "$env:windir\system32\inetsrv\appcmd.exe" list config `
        -section:system.webServer/rewrite/allowedServerVariables 2>&1 |
        Select-String $varName
    if (-not $exists) {
        & "$env:windir\system32\inetsrv\appcmd.exe" set config `
            -section:system.webServer/rewrite/allowedServerVariables `
            "/+[name='$varName']" /commit:apphost
    }
}

Write-Host "=== 6. iisreset ===" -ForegroundColor Green
& iisreset /noforce | Out-Null

Start-Sleep -Seconds 2

Write-Host "=== 7. Verify auth state ===" -ForegroundColor Green
$anon = Get-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter 'system.webServer/security/authentication/anonymousAuthentication' -Name enabled -Location $SiteName
$winauth = Get-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter 'system.webServer/security/authentication/windowsAuthentication' -Name enabled -Location $SiteName
Write-Host "Anonymous Auth: $($anon.Value)  (expected: False)"
Write-Host "Windows Auth:   $($winauth.Value)  (expected: True)"

Write-Host ""
Write-Host "=== Auth gate live ===" -ForegroundColor Green
Write-Host "Allowed: $AllowedUsers"
Write-Host ""
if ($BasePath -eq "") {
    Write-Host "Test from a domain-joined browser:"
    Write-Host "  https://mcgpt.mymanatee.org/"
    Write-Host "  -> allowlist member: SSO (no prompt), cookbook loads"
    Write-Host "  -> non-member:       HTTP 401"
} else {
    Write-Host "Test from a domain-joined browser:"
    Write-Host "  https://mcgpt.mymanatee.org${BasePath}/"
    Write-Host "  -> allowlist member: SSO (no prompt), cookbook loads"
    Write-Host "  -> non-member:       HTTP 401"
}
Write-Host ""
Write-Host "If you ever lock yourself out, undo with:"
Write-Host "  Remove-Item C:\inetpub\wwwroot\cookbook\public\web.config (will need to re-run iis-setup.ps1)"
