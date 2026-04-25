# Register the cookbook Node app as a Windows service via NSSM.
# Run from C:\cookbook as Administrator.
# Prereq: nssm installed (winget install NSSM.NSSM), Node installed.

$ErrorActionPreference = 'Stop'

$ServiceName = 'cookbook-node'
$NodeExe = (Get-Command node).Source
$AppDir = 'C:\cookbook'
$AppScript = 'dist\index.js'

Write-Host "=== Installing service '$ServiceName' ===" -ForegroundColor Green
Write-Host "Node:   $NodeExe"
Write-Host "Dir:    $AppDir"
Write-Host "Script: $AppScript"

# Stop and remove if it already exists (idempotent -- ignore errors if absent)
$prevPref = $ErrorActionPreference
$ErrorActionPreference = 'SilentlyContinue'
& nssm stop $ServiceName 2>&1 | Out-Null
& nssm remove $ServiceName confirm 2>&1 | Out-Null
$ErrorActionPreference = $prevPref

# Install
& nssm install $ServiceName $NodeExe $AppScript
& nssm set $ServiceName AppDirectory $AppDir

# Env vars
& nssm set $ServiceName AppEnvironmentExtra `
    "COOKBOOK_LLM_API_KEY=infer01-poc" `
    "COOKBOOK_LLM_BASE_URL=http://bcc-ap-infer01.bcc.ad.mymanatee.org:30000/v1" `
    "COOKBOOK_LLM_DEFAULT_MODEL=qwen2.5-7b" `
    "COOKBOOK_LLM_ALLOWED_MODELS=qwen2.5-7b" `
    "NODE_ENV=production" `
    "PORT=3000"

# Logs
& nssm set $ServiceName AppStdout "$AppDir\service.out.log"
& nssm set $ServiceName AppStderr "$AppDir\service.err.log"
& nssm set $ServiceName AppRotateFiles 1
& nssm set $ServiceName AppRotateBytes 10485760  # 10 MB

# Restart policy
& nssm set $ServiceName AppExit Default Restart
& nssm set $ServiceName AppRestartDelay 5000  # 5s

# Auto-start on boot
& nssm set $ServiceName Start SERVICE_AUTO_START

# Description
& nssm set $ServiceName Description 'Manatee County Prompt Cookbook - Node fronting SGLang on infer01'

# Start
Write-Host "Starting service..."
& nssm start $ServiceName

Start-Sleep -Seconds 3

# Verify
$status = & nssm status $ServiceName
Write-Host ""
Write-Host "=== Status: $status ===" -ForegroundColor Cyan

if ($status -eq 'SERVICE_RUNNING') {
    Write-Host "Testing /api/health..." -ForegroundColor Cyan
    Start-Sleep -Seconds 2
    try {
        $health = Invoke-RestMethod -Uri http://localhost:3000/api/health -TimeoutSec 5
        Write-Host "Health: $($health | ConvertTo-Json -Compress)" -ForegroundColor Green
        Write-Host ""
        Write-Host "=== Service is live and serving ===" -ForegroundColor Green
        Write-Host "Logs:   $AppDir\service.out.log / .err.log"
        Write-Host "Manage: nssm {start|stop|restart|status} $ServiceName"
    }
    catch {
        Write-Host "Service is running but /api/health failed: $_" -ForegroundColor Yellow
        Write-Host "Check $AppDir\service.err.log"
    }
}
else {
    Write-Host "Service failed to start -- check $AppDir\service.err.log" -ForegroundColor Red
}
