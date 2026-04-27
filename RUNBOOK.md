# Prompt Cookbook — Runbook

## What This Is

An interactive AI prompt training app for county staff. 30 chapters covering prompt engineering from basics to advanced, with 4 game modes and a built-in AI coach. Built with React + Express.

## Deployment Roadmap

| Step | Status | What's needed |
|------|--------|---------------|
| 1. Code in Azure DevOps | Done | Repo: `ManateeCounty/AIRollout/Prompt Cookbook` |
| 2. Pipeline YAML | Done | `azure-pipelines.yml` — builds, bundles, publishes artifact |
| 3. Self-hosted agent on RHEL | Pending | Optional once GitHub release deploy is in place |
| 4. Pipeline runs (build validates) | Blocked by #3 | Optional |
| 5. IIS site on Windows App Server | **Done 2026-04-25** | `Default Web Site` → `C:\inetpub\wwwroot\cookbook\public` on bcc-ap-llm01 |
| 6. Deploy artifact to IIS + Node service | **Done 2026-04-25** | NSSM service `cookbook-node` runs `node dist/index.js` on `localhost:3000`; IIS reverse-proxies `/api/*` via ARR |
| 7. LLM backend on RHEL | **Done 2026-04-25** | SGLang systemd unit on bcc-ap-infer01, serving Qwen2.5-7B-Instruct-FP8-dynamic on `0.0.0.0:30000`. Replaced original Ollama plan. |
| 8. Civic-ai governed proxy | Deferred | Direct cookbook → SGLang for POC; civic-ai proxy slots in between for governance once POC accepted. |
| 9. Cookbook → LLM env vars | **Done 2026-04-25** | `COOKBOOK_LLM_BASE_URL=http://bcc-ap-infer01.bcc.ad.mymanatee.org:30000/v1`, `COOKBOOK_LLM_DEFAULT_MODEL=qwen2.5-7b` |
| 10. End-to-end verified | **Done 2026-04-25** | Streamed `Hello! How can I assist you today?` from infer01 → llm01:3000 → IIS → curl |
| 11. DNS `www.mcgpt.mymanatee.org` → llm01 | Pending | County DNS ops (Mon) |
| 12. TLS cert bound to IIS site | Pending | Wildcard cert PFX from ops, IIS HTTPS binding (Mon) |

## Quick Start (Local)

```bash
npm install        # or: pnpm install
npm run build
npm start          # app runs on http://localhost:3000
```

The app works immediately. All 30 chapters, game modes, and training content load without any configuration.

**Note:** This project uses `pnpm` as its package manager. If `npm install` fails, use `pnpm install` instead.

## Verify It Works

After building, run these checks:

```bash
# Start the server
npm start &

# Health check
curl http://localhost:3000/api/health
# Expected: {"status":"ok"}

# Homepage loads
curl -o /dev/null -w "HTTP %{http_code}" http://localhost:3000/
# Expected: HTTP 200

# AI features return helpful message when key not set
curl -X POST http://localhost:3000/api/try-it \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test"}'
# Expected: {"error":"Live AI features are not configured. Set COOKBOOK_LLM_API_KEY..."}

# Stop the server
kill %1
```

All three checks should pass without any environment variables configured.

## CI/CD (Azure DevOps)

### Prerequisites

- Azure DevOps project with Repos and Pipelines enabled

### Steps

1. Push this repo to an Azure DevOps Repo
2. Create a new Pipeline pointing to `azure-pipelines.yml`
3. Push to `main` — the pipeline installs, builds, bundles, and publishes the artifact

The pipeline validates the build on every push. Deployment to IIS is handled separately by IT ops.

**Agent setup:** The pipeline currently targets `vmImage: "ubuntu-latest"` (Microsoft-hosted). This won't run until either a free parallelism grant is approved or a self-hosted agent is configured. When the RHEL self-hosted agent is online, update `azure-pipelines.yml`:

```yaml
# Change:
pool:
  vmImage: "ubuntu-latest"

# To:
pool:
  name: "<your-agent-pool-name>"
```

### Governed LLM Integration

When deployed alongside the [Civic AI](https://github.com/jarbitechture/manatee-civic-ai) governed proxy, point the cookbook at the proxy instead of directly at an LLM. Every staff prompt then goes through PII redaction, safety gates, and audit logging — without changing the cookbook's code.

```
COOKBOOK_LLM_API_KEY=<civic-ai-api-key>
COOKBOOK_LLM_BASE_URL=http://<civic-ai-server>:8100/v1
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `COOKBOOK_LLM_API_KEY` | No | API key for AI features (see below) |
| `COOKBOOK_LLM_BASE_URL` | No | Custom endpoint URL (see below) |
| `PORT` | No | Defaults to 3000 |
| `TRUST_PROXY` | No | Set to `1` if behind reverse proxy / load balancer |
| `SHAREPOINT_ORIGINS` | No | Comma-separated SharePoint origins for iframe embedding |

## AI Features (Optional)

Two features require an LLM API key: **Try It** (test prompts live) and **Chat** (AI prompt coach). Without the key, the app runs normally — these two features return a message saying they need configuration.

### Azure OpenAI

Set both variables:

```
COOKBOOK_LLM_API_KEY=your-azure-openai-key
COOKBOOK_LLM_BASE_URL=https://{resource-name}.openai.azure.com/openai/deployments/{deployment-name}
```

### OpenAI Direct

Set only the key (no base URL needed):

```
COOKBOOK_LLM_API_KEY=sk-...
```

### Local LLM (Ollama)

For air-gapped environments where no data should leave the network:

```
COOKBOOK_LLM_API_KEY=ollama
COOKBOOK_LLM_BASE_URL=http://localhost:11434/v1
```

Requires Ollama running on the server with a model pulled (e.g., `ollama pull phi4`).

## What Works Without the API Key

Everything except Try It and Chat:

- All 30 training chapters with lessons and examples
- 4 game modes (Quiz, Speed Round, Taste Test, Builder)
- Difficulty filtering (Beginner / Intermediate / Advanced)
- Department-specific personas and examples
- Recently viewed tracking
- Full-text search across all chapters
- Responsive layout (desktop and mobile)

## Troubleshooting

| Problem | Fix |
|---------|-----|
| App won't start | Check Node version: `node --version` (needs 20+) |
| Blank page after deploy | Verify `pnpm run build` succeeded in pipeline logs |
| Try It returns 503 | Set `COOKBOOK_LLM_API_KEY` in environment |
| Chat returns 503 | Same as above |
| LLM returns 401 | Verify key and base URL match your LLM provider |
| Pipeline fails at build | Check Node version (needs 20+) and pnpm lockfile |

## Architecture

### Single-host (local dev / simple deploy)

```
Client (React/Vite)  →  Express Server  →  LLM (Azure OpenAI, OpenAI, Ollama, or self-hosted SGLang)
     port 3000              port 3000
```

### County production (live as of 2026-04-25)

```
County user (browser)
    │  HTTP today / HTTPS pending DNS+cert
    ▼
http://bcc-ap-llm01.bcc.ad.mymanatee.org/   (Windows Server 2025, IIS Default Web Site)
    │
    ├── /                → IIS static (C:\inetpub\wwwroot\cookbook\public)
    └── /api/*           → ARR reverse proxy → http://localhost:3000/api/*
                                                       │
                                                       ▼
                          cookbook-node (NSSM service)
                          C:\cookbook\dist\index.js, port 3000
                          env: COOKBOOK_LLM_BASE_URL=http://bcc-ap-infer01...:30000/v1
                                                       │  HTTP
                                                       ▼
                          bcc-ap-infer01 (RHEL 10, NVIDIA L4 24GB)
                          sglang.service systemd unit
                          /opt/sglang/venv → Qwen2.5-7B-Instruct-FP8-dynamic
                          0.0.0.0:30000 (firewalled to llm01 only)
                          OpenAI-compatible /v1/models, /v1/chat/completions
```

### Live service inventory

| Host | Service | Port | Manage |
|---|---|---|---|
| bcc-ap-llm01 | IIS `Default Web Site` | 80 | `iisreset`, IIS Manager |
| bcc-ap-llm01 | `cookbook-node` (NSSM) | 3000 (loopback) | `nssm {start\|stop\|restart\|status} cookbook-node` |
| bcc-ap-infer01 | `sglang.service` (systemd) | 30000 | `sudo systemctl {start\|stop\|restart\|status} sglang` |

### Logs

| What | Where |
|---|---|
| cookbook stdout/stderr (llm01) | `C:\cookbook\service.out.log`, `service.err.log` (rotated 10MB) |
| IIS access logs | `C:\inetpub\logs\LogFiles\W3SVC1\` |
| SGLang (infer01) | `sudo journalctl -u sglang -f` |

### Update workflow (deploy a new build)

On Mac:
```bash
cd ~/Projects/prompt-cookbook-gov
# edit source...
git add ... && git commit -m "..." && git push origin main && git push azdo main
./deploy.sh    # builds, bundles dist + PS scripts, uploads to GitHub release v0.1.0
```

`deploy.sh` bundles `dist/`, `package.json`, `pnpm-lock.yaml`, `patches/`, and the three PS scripts (`start.ps1`, `iis-setup.ps1`, `enable-auth.ps1`) into the tarball. Updates to those scripts ship with the release automatically.

On llm01 (Admin PowerShell, **must run from `C:\cookbook` or any directory containing `dist\public\`**):
```powershell
iwr https://github.com/jarbitechture/prompt-cookbook-gov/releases/download/v0.1.0/cookbook-dist-v0.1.0.tgz -OutFile cookbook.tgz; tar -xzf cookbook.tgz; .\iis-setup.ps1; nssm restart cookbook-node
```

`iis-setup.ps1` auto-detects `dist/public/` from `$PSScriptRoot` and preserves any existing `<security>` block in `web.config`, so the auth allowlist survives the redeploy.

## Authentication

The cookbook is gated by **IIS Windows Authentication + a hard-coded allowlist in `web.config`**. Domain-joined browsers SSO transparently for users on the allowlist; everyone else gets HTTP 401.

### Source of truth

`enable-auth.ps1` in this repo. The script:
- Disables Anonymous Authentication on `Default Web Site`
- Enables Windows Authentication
- Writes `C:\inetpub\wwwroot\cookbook\public\web.config` with the rewrite rule **and** the `<authorization>` allowlist
- `iisreset`s

The `web.config` on llm01 is generated from `enable-auth.ps1`. `iis-setup.ps1` re-runs (deploys) read the existing `<security>` block off the live web.config and re-inject it into the new one — so the allowlist survives every deploy without re-running `enable-auth.ps1`. Edit the script, not the live `web.config`, to change the allowlist.

### Current pilot allowlist

| User | Notes |
|---|---|
| `BCC\ejarbeadm` | Operator account (do not remove — locks you out) |
| `BCC\marriagaadm` | Pilot user |
| `BCC\csolanadm` | Pilot user |
| `BCC\kmonroeadm` | Pilot user |

### Add or remove a user

1. Edit `enable-auth.ps1` on Mac — change the `$AllowedUsers` line.
2. Commit + push to both remotes.
3. On llm01 (Admin PS):
   ```powershell
   $h = git rev-parse --short HEAD   # or copy the new commit hash from GitHub
   iwr "https://raw.githubusercontent.com/jarbitechture/prompt-cookbook-gov/$h/enable-auth.ps1" -OutFile enable-auth.ps1
   .\enable-auth.ps1
   ```
4. Browser test as the new user.

### Lockout recovery

If you remove yourself from the allowlist or the `web.config` is malformed, you'll get 401 on everything including the URL you'd use to fix it. Recovery from llm01 console (RDP as a local admin who is NOT gated):

```powershell
Remove-Item C:\inetpub\wwwroot\cookbook\public\web.config
.\iis-setup.ps1   # restores rewrite-only web.config (no auth gate, full anon access)
.\enable-auth.ps1 # then re-applies the gate with the corrected allowlist
```

### Move from allowlist to AD group (later)

When the pilot expands beyond ~10 users, ask ops to create an AD security group (e.g., `BCC-Cookbook-Pilot`) and replace the `<add accessType="Allow" users="..." />` with `<add accessType="Allow" roles="BCC\BCC-Cookbook-Pilot" />`. Group membership is then managed in AD, no code changes needed.

## Security Headers

The server sets a Content-Security-Policy via helmet:
- **Scripts/default:** self only
- **Styles:** self + inline + Google Fonts
- **Fonts:** self + Google Fonts CDN
- **Images:** self + data URIs + CloudFront hero image CDN
- **API connections:** self (+ Azure Logic Apps if training form configured)
- **Frame ancestors:** self (+ SharePoint origins when `SHAREPOINT_ORIGINS` is set)

## Self-Hosted Deployment

The app has no cloud-specific code. It runs on any server with Node 20.

### Docker

```bash
docker build -t prompt-cookbook .
docker run -p 3000:3000 \
  -e COOKBOOK_LLM_API_KEY=sk-... \
  -e COOKBOOK_LLM_BASE_URL=https://{resource}.openai.azure.com/... \
  -e TRUST_PROXY=1 \
  prompt-cookbook
```

### Direct (no Docker)

```bash
pnpm install --frozen-lockfile
pnpm run build
NODE_ENV=production COOKBOOK_LLM_API_KEY=sk-... node dist/index.js
```

### Reverse Proxy Requirements

If behind nginx, IIS, or a load balancer:
- Set `TRUST_PROXY=1` so rate limiting uses the real client IP
- **Disable response buffering** for `/api/try-it` and `/api/chat` — these use Server-Sent Events (SSE). In nginx: `proxy_buffering off;`. In IIS: `responseBufferLimit="0"` on the handler
