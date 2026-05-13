# Prompt Cookbook (Gov)

Interactive AI prompt training app for county government staff. Teaches prompt engineering through 30 structured chapters, 4 game modes, and an AI prompt coach.

## What's Inside

- **30 chapters** covering prompt engineering from basics (RTCO formula, persona pattern) to advanced (chain-of-thought, DSPy optimization, multi-agent prompting)
- **4 game modes** — Quiz, Speed Round, Taste Test, Builder
- **Difficulty tiers** — Beginner, Intermediate, Advanced with filtering
- **Department personas** — tailored examples for Public Works, Utilities, Building, Parks, and more
- **AI prompt coach** — guided critique, refine, and preview via the civic-ai governed proxy
- **Full-text search** across all chapters
- **Recently viewed** tracking
- **Responsive** — desktop and mobile

## Quick Start

```bash
pnpm install
pnpm run build
pnpm start
# App runs on http://localhost:3000
```

All 30 chapters, game modes, and training content work immediately with zero configuration.

**Note:** This project uses `pnpm`. If `npm install` fails, install pnpm first: `npm install -g pnpm`

## AI Features

The Builder mode (critique, refine, preview) routes through the **civic-ai governed proxy** on `bcc-ap-infer01:8100`. Set these in your deployment environment or in a local `.env` file:

```bash
# civic-ai proxy (county production)
CIVIC_AI_BASE_URL=http://bcc-ap-infer01.bcc.ad.mymanatee.org:8100/v1
CIVIC_AI_API_KEY=          # leave blank for open-access dev mode
CIVIC_AI_DEFAULT_MODEL=phi4
```

## CI/CD

An `azure-pipelines.yml` is included for Azure DevOps. It builds and validates the app on every push to `main`. The build artifact is published for deployment.

1. Push this repo to an Azure DevOps Repo
2. Create a Pipeline pointing to `azure-pipelines.yml`
3. Push to `main` — pipeline installs, builds, bundles, and publishes the artifact

Deployment to IIS is a separate step handled by your infrastructure team.

## Verify It Works

```bash
pnpm start &

# Health check
curl http://localhost:3000/api/health
# {"status":"ok"}

# Homepage
curl -o /dev/null -w "HTTP %{http_code}" http://localhost:3000/
# HTTP 200

kill %1
```

## Architecture

```
Client (React/Vite)  →  Express Server  →  civic-ai proxy  →  Ollama / LLM
     port 3000              port 3000           port 8100
```

Single service. Express serves the built React app and handles coach API endpoints (`/api/critique`, `/api/refine`, `/api/preview`). All LLM calls route through the civic-ai governed proxy. No database.

### County production deployment

The cookbook is live in the county environment:

- **bcc-ap-llm01** (Windows Server 2025) — IIS at port 443 fronts the cookbook with the county wildcard cert. Static files served directly; `/api/*` reverse-proxied via ARR to a local `cookbook-node` NSSM service on `localhost:3000`.
- **bcc-ap-infer01** (RHEL 10, NVIDIA L4) — civic-ai governed proxy on port 8100 fronts Ollama/LLM inference.
- **Public URL** (county network): `https://mcgpt.mymanatee.org/` — CNAME → `bcc-ap-llm01.bcc.ad.mymanatee.org`. DNS + TLS live as of 2026-05-01.

See [RUNBOOK.md](RUNBOOK.md) for service inventory, log paths, and update workflow.

## Security

The server sets a Content-Security-Policy that restricts scripts, styles, fonts, images, and API connections to known sources. When `SHAREPOINT_ORIGINS` is set, the CSP also allows iframe embedding from those origins.

## Self-Hosted Deployment

The app runs anywhere Node 20 is available. Use Docker, IIS, or run directly:

```bash
# Docker
docker build -t prompt-cookbook .
docker run -p 3000:3000 \
  -e CIVIC_AI_BASE_URL=http://bcc-ap-infer01.bcc.ad.mymanatee.org:8100/v1 \
  prompt-cookbook

# Direct
pnpm install && pnpm run build
NODE_ENV=production node dist/index.js
```

If behind a reverse proxy (nginx, IIS, Azure App Gateway), set `TRUST_PROXY=1`.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CIVIC_AI_BASE_URL` | No | civic-ai proxy base URL (default: `http://127.0.0.1:8100/v1`) |
| `CIVIC_AI_API_KEY` | No | API key for the civic-ai proxy (leave blank for open-access dev mode) |
| `CIVIC_AI_DEFAULT_MODEL` | No | Default model passed to the proxy (default: `phi4`) |
| `PORT` | No | Server port (default: 3000) |
| `TRUST_PROXY` | No | Set to `1` if behind a load balancer |
| `SHAREPOINT_ORIGINS` | No | Comma-separated SharePoint origins for iframe embedding |

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Framer Motion
- **Backend:** Express
- **Build:** Vite + esbuild
- **Package manager:** pnpm

## Detailed Documentation

See [RUNBOOK.md](RUNBOOK.md) for full deployment steps, troubleshooting, and verification procedures.
