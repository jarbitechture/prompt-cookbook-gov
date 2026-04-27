# Configure IIS reverse proxy for cookbook.
# Run as Administrator from the directory containing dist/ (typically C:\cookbook).
# Auto-detects dist source from script's own directory.
# Preserves any existing <security> block from web.config (auth allowlist set by enable-auth.ps1).
# Requires: URL Rewrite + ARR modules already installed.

$ErrorActionPreference = 'Stop'

# Resolve source dir from the script's own location; fall back to C:\cookbook for legacy callers
$ScriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$IISRoot = 'C:\inetpub\wwwroot\cookbook\public'
$SourceStatic = if (Test-Path (Join-Path $ScriptDir 'dist\public')) { Join-Path $ScriptDir 'dist\public' } else { 'C:\cookbook\dist\public' }
$SiteName = 'Default Web Site'

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
      </rules>
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

Write-Host "=== 6. Start IIS site ===" -ForegroundColor Green
Start-Website -Name $SiteName

Start-Sleep -Seconds 2

Write-Host "=== 7. Smoke test through IIS (using current user creds) ===" -ForegroundColor Green
try {
    $health = Invoke-RestMethod -Uri http://localhost/api/health -TimeoutSec 5 -UseDefaultCredentials
    Write-Host "Health via IIS: $($health | ConvertTo-Json -Compress)" -ForegroundColor Green
}
catch {
    Write-Host "FAIL: /api/health via IIS returned error: $_" -ForegroundColor Red
    Write-Host "If 401: caller is not in the allowlist. Verify enable-auth.ps1 has been run and the calling account is in `$AllowedUsers."
    Write-Host "Check IIS logs: C:\inetpub\logs\LogFiles\W3SVC1\"
    exit 1
}

Write-Host ""
Write-Host "=== IIS reverse proxy live ===" -ForegroundColor Green
Write-Host "Static files: $IISRoot"
Write-Host "API proxied:  http://localhost/api/* -> http://localhost:3000/api/*"
Write-Host "Test in browser: http://bcc-ap-llm01.bcc.ad.mymanatee.org/"
