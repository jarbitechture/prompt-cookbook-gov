# Cookbook foreground starter for bcc-ap-llm01.
# Run from C:\cookbook (where dist/, node_modules/ live).
# Ctrl-C to stop. Keep the window open while testing — use a second PowerShell tab for curl.

$env:COOKBOOK_LLM_API_KEY = 'infer01-poc'
$env:COOKBOOK_LLM_BASE_URL = 'http://bcc-ap-infer01.bcc.ad.mymanatee.org:30000/v1'
$env:COOKBOOK_LLM_DEFAULT_MODEL = 'qwen2.5-7b'
$env:COOKBOOK_LLM_ALLOWED_MODELS = 'qwen2.5-7b'
$env:NODE_ENV = 'production'
$env:PORT = '3000'

Write-Host "=== Cookbook starting on port 3000 ===" -ForegroundColor Green
Write-Host "LLM backend: $env:COOKBOOK_LLM_BASE_URL"
Write-Host "Model: $env:COOKBOOK_LLM_DEFAULT_MODEL"
Write-Host ""

node dist/index.js
