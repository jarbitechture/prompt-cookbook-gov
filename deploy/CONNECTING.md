# Connecting to the County LLM Endpoint

An internal, OpenAI-compatible endpoint backed by **Qwen2.5-7B**.

- **Endpoint:** `https://bcc-ap-llm01.bcc.ad.mymanatee.org:8443/v1`
- **Model:** `qwen2.5-7b`
- **Your API key:** sent to you separately — keep it private.

## 1. Quick test (Windows PowerShell)

Use `curl.exe` (not `curl`, which is an alias in PowerShell):
```powershell
curl.exe https://bcc-ap-llm01.bcc.ad.mymanatee.org:8443/v1/models -H "Authorization: Bearer YOUR_KEY"
```
You'll get back a short JSON list showing `qwen2.5-7b`. No certificate setup is needed on a county Windows PC.

## 2. Python

```
pip install openai truststore
```
```python
import truststore
truststore.inject_into_ssl()

from openai import OpenAI
client = OpenAI(
    base_url="https://bcc-ap-llm01.bcc.ad.mymanatee.org:8443/v1",
    api_key="YOUR_KEY",
)
resp = client.chat.completions.create(
    model="qwen2.5-7b",
    messages=[{"role": "user", "content": "say hello in one word"}],
)
print(resp.choices[0].message.content)
```
`truststore` makes Python use the Windows certificate store. Any OpenAI-compatible tool (Visual Studio, etc.) works too — point it at the base URL above, use your key, model `qwen2.5-7b`.

Your key is yours — don't share it. If it leaks or is lost, tell Elliot and it'll be rotated.
