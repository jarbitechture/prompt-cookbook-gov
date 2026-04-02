# Prompt Cookbook — Runbook

## What This Is

An interactive AI prompt training app for county staff. 30 chapters covering prompt engineering from basics to advanced, with 4 game modes and a built-in AI coach. Built with React + Express.

## Quick Start (Local)

```bash
npm install        # or: pnpm install
npm run build
npm start          # app runs on http://localhost:3000
```

The app works immediately. All 30 chapters, game modes, and training content load without any configuration.

## Deploy to Azure App Service

### Prerequisites

- Azure DevOps project with Repos and Pipelines enabled
- Azure App Service (Linux, Node 20 LTS)
- Azure service connection configured in DevOps

### Steps

1. Push this repo to an Azure DevOps Repo
2. Create a new Pipeline pointing to `azure-pipelines.yml`
3. Set three Pipeline Variables in Azure DevOps:
   - `AZURE_SUBSCRIPTION` — your Azure service connection name
   - `APP_SERVICE_NAME` — your App Service resource name
   - `COOKBOOK_LLM_API_KEY` — (optional, see below)
4. Push to `main` — the pipeline builds and deploys automatically

### App Service Configuration

In Azure Portal > App Service > Configuration > Application Settings:

| Setting | Required | Value |
|---------|----------|-------|
| `COOKBOOK_LLM_API_KEY` | No | API key for AI features (see below) |
| `COOKBOOK_LLM_BASE_URL` | No | Custom endpoint URL (see below) |
| `PORT` | No | Defaults to 3000 |

## AI Features (Optional)

Two features require an LLM API key: **Try It** (test prompts live) and **Chat** (AI prompt coach). Without the key, the app runs normally — these two features return a message saying they need configuration.

### Azure OpenAI (Recommended)

Set both variables in App Service Configuration:

```
COOKBOOK_LLM_API_KEY=your-azure-openai-key
COOKBOOK_LLM_BASE_URL=https://{resource-name}.openai.azure.com/openai/deployments/{deployment-name}
```

Get the key from: Azure Portal > Azure OpenAI resource > Keys and Endpoint

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
| Blank page after deploy | Verify `npm run build` succeeded in pipeline logs |
| Try It returns 503 | Set `COOKBOOK_LLM_API_KEY` in App Service Configuration |
| Chat returns 503 | Same as above |
| Azure OpenAI 401 | Verify key and base URL match your Azure OpenAI resource |
| Pipeline fails at Deploy stage | Check `AZURE_SUBSCRIPTION` matches your service connection name exactly |

## Architecture

```
Client (React/Vite)  →  Express Server  →  Azure OpenAI (optional)
     port 3000              port 3000
```

Single service. The Express server serves the built React app and handles the two API endpoints (`/api/try-it`, `/api/chat`). No database, no external dependencies beyond the optional LLM.
