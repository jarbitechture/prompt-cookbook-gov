# Cookbook foreground starter for bcc-ap-llm01.
# Run from C:\cookbook (where dist/, node_modules/ live).
# Ctrl-C to stop. Keep the window open while testing — use a second PowerShell tab for curl.

# civic-ai governed proxy (bcc-ap-infer01:8100) is the LLM backend.
# CIVIC_AI_API_KEY is optional; leave blank for open-access dev mode.
$env:CIVIC_AI_BASE_URL = 'http://bcc-ap-infer01.bcc.ad.mymanatee.org:8100/v1'
$env:CIVIC_AI_API_KEY = ''
$env:CIVIC_AI_DEFAULT_MODEL = 'phi4'
$env:NODE_ENV = 'production'
$env:PORT = '3000'

Write-Host "=== Cookbook starting on port 3000 ===" -ForegroundColor Green
Write-Host "Civic-AI backend: $env:CIVIC_AI_BASE_URL"
Write-Host "Default model: $env:CIVIC_AI_DEFAULT_MODEL"
Write-Host ""

node dist/index.js
