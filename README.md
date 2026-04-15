# Prompt Cookbook (Gov)

Interactive AI prompt training app for county government staff. Teaches prompt engineering through 30 structured chapters, 4 game modes, and an optional AI coach — built for direct deployment to Azure App Service.

## What's Inside

- **30 chapters** covering prompt engineering from basics (RTCO formula, persona pattern) to advanced (chain-of-thought, DSPy optimization, multi-agent prompting)
- **4 game modes** — Quiz, Speed Round, Taste Test, Builder
- **Difficulty tiers** — Beginner, Intermediate, Advanced with filtering
- **Department personas** — tailored examples for Public Works, Utilities, Building, Parks, and more
- **AI prompt coach** (optional) — guided prompt-building assistant that teaches, not writes
- **Try It live testing** (optional) — test prompts against a real LLM from within the app
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

## AI Features (Optional)

Two features require an LLM API key: **Try It** and **Chat**. Without a key, the app runs normally — these features return a helpful configuration message.

Set in Azure App Service Configuration or in a local `.env` file:

```bash
# Azure OpenAI (recommended for county)
COOKBOOK_LLM_API_KEY=your-azure-openai-key
COOKBOOK_LLM_BASE_URL=https://{resource}.openai.azure.com/openai/deployments/{model}

# Or OpenAI direct (key only, no base URL needed)
COOKBOOK_LLM_API_KEY=sk-...

# Or Ollama local (air-gapped, no data leaves the network)
COOKBOOK_LLM_API_KEY=ollama
COOKBOOK_LLM_BASE_URL=http://localhost:11434/v1
```

## Deploy to Azure App Service

An `azure-pipelines.yml` is included for Azure DevOps CI/CD.

1. Push this repo to an Azure DevOps Repo
2. Create a Pipeline pointing to `azure-pipelines.yml`
3. Set pipeline variables:
   - `AZURE_SUBSCRIPTION` — Azure service connection name
   - `APP_SERVICE_NAME` — App Service resource name
   - `COOKBOOK_LLM_API_KEY` — (optional) LLM API key
4. Push to `main` — pipeline builds and deploys automatically

## Verify It Works

```bash
pnpm start &

# Health check
curl http://localhost:3000/api/health
# {"status":"ok"}

# Homepage
curl -o /dev/null -w "HTTP %{http_code}" http://localhost:3000/
# HTTP 200

# AI features (graceful without key)
curl -X POST http://localhost:3000/api/try-it \
  -H "Content-Type: application/json" -d '{"prompt":"test"}'
# {"error":"Live AI features are not configured..."}

kill %1
```

## Architecture

```
Client (React/Vite)  →  Express Server  →  Azure OpenAI (optional)
     port 3000              port 3000
```

Single service. Express serves the built React app and handles two API endpoints (`/api/try-it`, `/api/chat`). No database, no external dependencies beyond the optional LLM.

## Security

The server sets a Content-Security-Policy that restricts scripts, styles, fonts, images, and API connections to known sources. When `SHAREPOINT_ORIGINS` is set, the CSP also allows iframe embedding from those origins.

## Self-Hosted Deployment

The app runs anywhere Node 20 is available — no Azure dependency. Use Docker or run directly:

```bash
# Docker
docker build -t prompt-cookbook .
docker run -p 3000:3000 -e COOKBOOK_LLM_API_KEY=sk-... prompt-cookbook

# Direct
pnpm install && pnpm run build
NODE_ENV=production COOKBOOK_LLM_API_KEY=sk-... node dist/index.js
```

If behind a reverse proxy (nginx, IIS, Azure App Gateway), set `TRUST_PROXY=1` and make sure **response buffering is off** for `/api/try-it` and `/api/chat` — these use Server-Sent Events for streaming.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `COOKBOOK_LLM_API_KEY` | No | API key for LLM provider |
| `COOKBOOK_LLM_BASE_URL` | No | Custom endpoint (Azure OpenAI, Ollama) |
| `PORT` | No | Server port (default: 3000) |
| `TRUST_PROXY` | No | Set to `1` if behind a load balancer |
| `SHAREPOINT_ORIGINS` | No | Comma-separated SharePoint origins for iframe embedding |

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Framer Motion
- **Backend:** Express, OpenAI SDK (compatible with Azure OpenAI and Ollama)
- **Build:** Vite + esbuild
- **Package manager:** pnpm

## Detailed Documentation

See [RUNBOOK.md](RUNBOOK.md) for full deployment steps, troubleshooting, and verification procedures.
