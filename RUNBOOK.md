# Prompt Cookbook — Runbook

## What This Is

An interactive AI prompt training app for county staff. 30 chapters covering prompt engineering from basics to advanced, with 4 game modes and a built-in AI prompt coach. Built with React + Express.

## Deployment Roadmap

| Step | Status | What's needed |
|------|--------|---------------|
| 1. Code in Azure DevOps | Done | Repo: `ManateeCounty/AIRollout/Prompt Cookbook` |
| 2. Pipeline YAML | Done | `azure-pipelines.yml` — builds, bundles, publishes artifact |
| 3. Self-hosted agent on RHEL | Pending | Optional once GitHub release deploy is in place |
| 4. Pipeline runs (build validates) | Blocked by #3 | Optional |
| 5. IIS site on Windows App Server | **Done 2026-04-25** | `Default Web Site` → `C:\inetpub\wwwroot\cookbook\public` on bcc-ap-llm01 |
| 6. Deploy artifact to IIS + Node service | **Done 2026-04-25** | NSSM service `cookbook-node` runs `node dist/index.js` on `localhost:3000`; IIS reverse-proxies `/api/*` via ARR |
| 7. LLM backend on RHEL | **Done 2026-04-25** | SGLang systemd unit on bcc-ap-infer01, serving Qwen2.5-7B-Instruct-FP8-dynamic on `0.0.0.0:30000`. |
| 8. Civic-ai governed proxy | Pending | civic-ai proxy slots in on bcc-ap-infer01:8100; cookbook already wired to `CIVIC_AI_BASE_URL`. |
| 9. Cookbook → civic-ai env vars | **Done 2026-05-13** | `CIVIC_AI_BASE_URL=http://bcc-ap-infer01...:8100/v1`, `CIVIC_AI_DEFAULT_MODEL=phi4` |
| 10. End-to-end verified | **Done 2026-04-25** | Streamed response from infer01 → llm01:3000 → IIS → curl |
| 11. DNS `mcgpt.mymanatee.org` → llm01 | Pending | County DNS ops (Mon) |
| 12. TLS cert bound to IIS site | Pending | Wildcard cert PFX from ops, IIS HTTPS binding (Mon) |

## Quick Start (Local)

```bash
pnpm install
pnpm run build
pnpm start          # app runs on http://localhost:3000
```

The app works immediately. All 30 chapters, game modes, and training content load without any configuration.

## Verify It Works

After building, run these checks:

```bash
# Start the server
pnpm start &

# Health check
curl http://localhost:3000/api/health
# Expected: {"status":"ok"}

# Homepage loads
curl -o /dev/null -w "HTTP %{http_code}" http://localhost:3000/
# Expected: HTTP 200

# Stop the server
kill %1
```

Both checks should pass without any environment variables configured.

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

All LLM calls route through the **civic-ai governed proxy** on `bcc-ap-infer01:8100`. Every staff prompt goes through PII redaction, safety gates, and audit logging.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CIVIC_AI_BASE_URL` | No | civic-ai proxy base URL (default: `http://127.0.0.1:8100/v1`) |
| `CIVIC_AI_API_KEY` | No | API key for the civic-ai proxy (leave blank for open-access dev mode) |
| `CIVIC_AI_DEFAULT_MODEL` | No | Default model passed to the proxy (default: `phi4`) |
| `PORT` | No | Defaults to 3000 |
| `TRUST_PROXY` | No | Set to `1` if behind reverse proxy / load balancer |
| `SHAREPOINT_ORIGINS` | No | Comma-separated SharePoint origins for iframe embedding |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| App won't start | Check Node version: `node --version` (needs 20+) |
| Blank page after deploy | Verify `pnpm run build` succeeded in pipeline logs |
| Coach returns 503 | civic-ai proxy unreachable — check `CIVIC_AI_BASE_URL` and proxy health |
| Coach returns 401 | Set `CIVIC_AI_API_KEY` to match the proxy's configured key |
| Pipeline fails at build | Check Node version (needs 20+) and pnpm lockfile |

## Architecture

### County production (live as of 2026-04-25)

```
County user (browser)
    │  HTTPS via county wildcard cert
    ▼
https://mcgpt.mymanatee.org/   (CNAME → bcc-ap-llm01, Windows Server 2025, IIS Default Web Site)
    │
    ├── /                → IIS static (C:\inetpub\wwwroot\cookbook\public)
    └── /api/*           → ARR reverse proxy → http://localhost:3000/api/*
                                                       │
                                                       ▼
                          cookbook-node (NSSM service)
                          C:\cookbook\dist\index.js, port 3000
                          env: CIVIC_AI_BASE_URL=http://bcc-ap-infer01...:8100/v1
                                                       │  HTTP
                                                       ▼
                          bcc-ap-infer01 (RHEL 10, NVIDIA L4 24GB)
                          civic-ai governed proxy, port 8100
                          → Ollama / LLM inference (port 11434)
```

### Live service inventory

| Host | Service | Port | Manage |
|---|---|---|---|
| bcc-ap-llm01 | IIS `Default Web Site` | 80 | `iisreset`, IIS Manager |
| bcc-ap-llm01 | `cookbook-node` (NSSM) | 3000 (loopback) | `nssm {start\|stop\|restart\|status} cookbook-node` |
| bcc-ap-infer01 | civic-ai proxy | 8100 | `sudo systemctl {start\|stop\|restart\|status} civic-ai` |

### Logs

| What | Where |
|---|---|
| cookbook stdout/stderr (llm01) | `C:\cookbook\service.out.log`, `service.err.log` (rotated 10MB) |
| IIS access logs | `C:\inetpub\logs\LogFiles\W3SVC1\` |
| civic-ai (infer01) | `sudo journalctl -u civic-ai -f` |

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

### web.config rules (both PS scripts must agree)

The `web.config` has 4 functional sections: rewrite rules, error mode, static cache, and `<security>`/`<authorization>`. Two PS scripts write it:

| Script | Writes web.config? | Includes `<security>` block? | Triggers `iisreset`? |
|---|---|---|---|
| `iis-setup.ps1` | Yes | Preserves existing block (reads before wipe, re-injects) | No |
| `enable-auth.ps1` | Yes | Yes (full template with allowlist) | Yes |

**Both scripts must include identical rewrite rules**: `ReverseProxyToNode` (for `/api/*`) **AND** `SPA fallback` (for client-side routes like `/builder`, `/resources`). If either rule is missing from either script, deep links 404 after that script runs.

When editing one script's web.config template, edit the other to match. Future hardening: consolidate the template into a shared dot-sourced PS function.

### Verifying the auth gate is live

NTLM SSO is transparent for allowlisted users on domain-joined machines — you will not see a credential prompt. To prove the gate is enforcing the allowlist (not letting everyone through):

```powershell
# From any PS on llm01:
iwr https://mcgpt.mymanatee.org/api/health -UseDefaultCredentials | Select-Object StatusCode
# Allowlisted account => 200

iwr https://mcgpt.mymanatee.org/api/health
# No credentials => 401 Unauthorized (this proves the gate is rejecting non-allowlisted access)
```

If both return 200, the `<authorization>` block is missing — re-run `enable-auth.ps1`.

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
  -e CIVIC_AI_BASE_URL=http://bcc-ap-infer01.bcc.ad.mymanatee.org:8100/v1 \
  -e TRUST_PROXY=1 \
  prompt-cookbook
```

### Direct (no Docker)

```bash
pnpm install --frozen-lockfile
pnpm run build
NODE_ENV=production node dist/index.js
```

### Reverse Proxy Requirements

If behind nginx, IIS, or a load balancer:
- Set `TRUST_PROXY=1` so rate limiting uses the real client IP

## GitHub Branch Protection

### What needs to be configured (GitHub admin action — not automated)

These rules are **not set by the scaffold commit**. A GitHub repository admin must configure them manually after the repo is pushed to GitHub:

1. **Settings → Branches → Add branch protection rule** for `main`:
   - Require a pull request before merging (1 approval required).
   - Require approvals from CODEOWNERS: enable **"Require review from Code Owners"**.
   - Require status checks to pass: add `content-checks / Link check`, `content-checks / Banned-claims regex`, `content-checks / Schema validation`, `content-checks / CI gates (test + check + build)`.
   - Do not allow bypassing the above settings.

2. **Verify CODEOWNERS is parsed**: Settings → Code and automation → CODEOWNERS shows the file loaded with no syntax errors.

### Updating CODEOWNERS placeholder usernames

`.github/CODEOWNERS` was scaffolded with `@matt-TBD`, `@keith-TBD`, `@chris-TBD` as placeholders. Replace these with real GitHub handles once accounts are confirmed:

1. Open `.github/CODEOWNERS`.
2. Replace each placeholder with the real GitHub username (e.g., `@matt-TBD` → `@real-handle`).
3. Commit the change on a branch and open a PR (the PR itself will trigger CODEOWNERS review, so at least one of the updated owners must approve).
4. After merge, verify in Settings → Code and automation → CODEOWNERS that all owners resolve without warnings.

### Primary CI today

Azure DevOps (`azure-pipelines.yml`) is the active build gate for county deployments. The `.github/workflows/content-checks.yml` workflow runs on GitHub-hosted mirrors or forks. Both run `pnpm test + check + build`; the GitHub workflow adds link-check, banned-claims grep, and schema validation.
