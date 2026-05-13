# Configure IIS reverse proxy for cookbook.
# Run as Administrator from the directory containing dist/ (typically C:\cookbook).
# Auto-detects dist source from script's own directory.
# Preserves any existing <security> block from web.config (auth allowlist set by enable-auth.ps1).
# Requires: URL Rewrite + ARR modules already installed.
#
# Usage:
#   .\iis-setup.ps1                          # root mount (default) — serves at https://mcgpt.mymanatee.org/
#   .\iis-setup.ps1 -BasePath "/cookbook"    # subpath mount — serves at https://mcgpt.mymanatee.org/cookbook/
#
# Subpath notes (read before running with -BasePath):
#   - The cookbook is mounted as an IIS Application under the parent site.
#     The parent site's physical path must already be set (e.g. C:\inetpub\wwwroot),
#     NOT C:\inetpub\wwwroot\cookbook\public. Verify Default Web Site's physical path
#     before running. If it's still pointed at the old cookbook dir, reset it first:
#       Set-ItemProperty 'IIS:\Sites\Default Web Site' -Name physicalPath -Value 'C:\inetpub\wwwroot'
#   - The SPA must be built with matching VITE_BASE:
#       VITE_BASE=/cookbook/ pnpm run build
#     A root build deployed to a subpath shows a blank page (asset 404s).
#   - The Node backend stays at localhost:3000/api/* — no change needed there.

param(
    [string]$BasePath = ""
)

$ErrorActionPreference = 'Stop'

# Resolve source dir from the script's own location; fall back to C:\cookbook for legacy callers
$ScriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$IISRoot = 'C:\inetpub\wwwroot\cookbook\public'
$SourceStatic = if (Test-Path (Join-Path $ScriptDir 'dist\public')) { Join-Path $ScriptDir 'dist\public' } else { 'C:\cookbook\dist\public' }
$SiteName = 'Default Web Site'

# Normalise BasePath: must be empty or start with "/" and have no trailing slash
if ($BasePath -ne "") {
    $BasePath = '/' + $BasePath.Trim('/')
}

Write-Host "=== 1. Stop IIS site ===" -ForegroundColor Green
Import-Module WebAdministration
Stop-Website -Name $SiteName

Write-Host "=== 2. Sync static files from $SourceStatic to $IISRoot ===" -ForegroundColor Green
if (-not (Test-Path $SourceStatic)) {
    Write-Host "FAIL: source directory not found: $SourceStatic" -ForegroundColor Red
    Write-Host "Run this script from the directory that contains dist/public/ (e.g. C:\cookbook after extracting the release tarball)."
    exit 1
}
if (-not (Test-Path $IISRoot)) {
    New-Item -ItemType Directory -Path $IISRoot -Force | Out-Null
}

# Preserve existing <security> block (auth allowlist) before wipe
$existingSecurity = ""
$existingWebConfig = Join-Path $IISRoot 'web.config'
if (Test-Path $existingWebConfig) {
    $oldContent = Get-Content $existingWebConfig -Raw
    if ($oldContent -match '(?s)(<security>.*?</security>)') {
        $existingSecurity = "    " + $matches[1]
        Write-Host "Preserving existing <security> block (auth allowlist)" -ForegroundColor Yellow
    }
}

# Mirror: clean target first to avoid stale bundle leftovers
Get-ChildItem -Path $IISRoot -Force | Remove-Item -Recurse -Force
Copy-Item -Path "$SourceStatic\*" -Destination $IISRoot -Recurse -Force

# Under subpath: create (or re-use) an IIS Application alias for the cookbook
if ($BasePath -ne "") {
    $appName = $BasePath.TrimStart('/')
    Write-Host "=== 2b. Create IIS Application alias '/$appName' ===" -ForegroundColor Green
    $existing = Get-WebApplication -Site $SiteName -Name $appName -ErrorAction SilentlyContinue
    if (-not $existing) {
        New-WebApplication -Site $SiteName -Name $appName -PhysicalPath $IISRoot -Force | Out-Null
        Write-Host "Created IIS Application: /$appName -> $IISRoot" -ForegroundColor Green
    } else {
        Write-Host "IIS Application /$appName already exists; skipping creation." -ForegroundColor Yellow
    }
}

Write-Host "=== 3. Write web.config (allowlist preserved if present) ===" -ForegroundColor Green
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
$existingSecurity
  </system.webServer>
</configuration>
"@
Set-Content -Path "$IISRoot\web.config" -Value $webConfig -Encoding UTF8

Write-Host "=== 4. Enable ARR proxy at server level ===" -ForegroundColor Green
& "$env:windir\system32\inetsrv\appcmd.exe" set config -section:system.webServer/proxy /enabled:'True' /commit:apphost

Write-Host "=== 5. Disable ARR disk cache (avoid SSE buffering) ===" -ForegroundColor Green
& "$env:windir\system32\inetsrv\appcmd.exe" set config -section:system.webServer/proxy /preserveHostHeader:'True' /commit:apphost

Write-Host "=== 6. Register iisaf-* server variables in ARR allowlist ===" -ForegroundColor Green
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

Write-Host "=== 7. Start IIS site ===" -ForegroundColor Green
Start-Website -Name $SiteName

Start-Sleep -Seconds 2

Write-Host "=== 8. Smoke test through IIS (using current user creds) ===" -ForegroundColor Green
$smokeUrl = "http://localhost${BasePath}/api/health"
try {
    $health = Invoke-RestMethod -Uri $smokeUrl -TimeoutSec 5 -UseDefaultCredentials
    Write-Host "Health via IIS: $($health | ConvertTo-Json -Compress)" -ForegroundColor Green
}
catch {
    Write-Host "FAIL: $smokeUrl via IIS returned error: $_" -ForegroundColor Red
    Write-Host "If 401: caller is not in the allowlist. Verify enable-auth.ps1 has been run and the calling account is in `$AllowedUsers."
    Write-Host "Check IIS logs: C:\inetpub\logs\LogFiles\W3SVC1\"
    exit 1
}

Write-Host ""
Write-Host "=== IIS reverse proxy live ===" -ForegroundColor Green
Write-Host "Static files: $IISRoot"
if ($BasePath -eq "") {
    Write-Host "API proxied:  http://localhost/api/* -> http://localhost:3000/api/*"
    Write-Host "Test in browser: https://mcgpt.mymanatee.org/"
} else {
    Write-Host "API proxied:  http://localhost${BasePath}/api/* -> http://localhost:3000/api/*"
    Write-Host "Test in browser: https://mcgpt.mymanatee.org${BasePath}/"
}
