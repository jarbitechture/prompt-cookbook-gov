# Manatee Cookbook MCP Server

Exposes the **Prompt Cookbook** (`mcgpt.mymanatee.org`) as MCP tools callable from ChatGPT Enterprise, M365 Copilot, and any MCP-compliant LLM client.

**Why this exists (renewal narrative):**

- ChatGPT Enterprise + M365 Copilot are paid-for vendor LLM seats.
- The Cookbook is county-built guidance.
- This MCP server lets paid vendor LLM users tap county-built guidance directly from inside their ChatGPT/Copilot session.
- Each tool invocation emits a ROI event — proving "% of paid Copilot/ChatGPT seats that used county-built cookbook guidance during the period."

This is **Layer 3** of the 3-layer ROI coverage strategy (ADR-008): vendor admin pulls (Layer 1) + built-LLM telemetry (Layer 2) + MCP enrichment (Layer 3).

## Tools exposed

| Tool | Inputs | Returns |
|---|---|---|
| `search_chapters` | `{query: string, limit?: number}` | Ranked list of chapter summaries (title, subtitle, summary, key takeaways) |
| `get_chapter` | `{id_or_number: string}` | Full chapter content including content paragraphs, prompt examples, key takeaways, try-it template |

## Running locally (smoke)

```bash
cd mcp
npm install
npm run smoke      # exercises search + get against real chapter data, no MCP client needed
npm start          # starts the MCP server on stdio (waits for an MCP client)
```

## Configuration

Environment variables (set when registering the server with ChatGPT/Copilot):

| Variable | Required | Description |
|---|---|---|
| `MCP_USER_UPN` | recommended | AD UPN of the calling user — flows into ROI events for dept slicing |
| `MCP_DEPT` | recommended | County dept code |
| `MCP_ROLE_BAND` | recommended | One of: `exec`, `director`, `manager`, `senior`, `professional`, `support` |
| `ROI_EVENTS_URL` | optional | manatee-ai-roi FastAPI base URL (default `http://localhost:8000`) |
| `ROI_FALLBACK_PATH` | optional | Local fallback JSONL when FastAPI breaker is open |

## ROI event shape per invocation

Every tool call emits one event with:

```json
{
  "event_kind": "tool_invocation",
  "tool": "cookbook",
  "workflow": "cookbook_mcp.<tool_name>",
  "user_id": "<MCP_USER_UPN>",
  "dept": "<MCP_DEPT>",
  "role_band": "<MCP_ROLE_BAND>",
  "task_type": "search",
  "surface": "other",
  "trace_id": "<32-hex W3C trace_id>",
  "duration_s": "...",
  "success": true
}
```

Trace ID groups the MCP call with any downstream LLM call in the same Power BI session reconstruction (per ADR-007 multi-event lifecycle).

## Deployment to ChatGPT Enterprise / M365 Copilot

**ChatGPT Enterprise:** Workspace owner registers the MCP server in the admin console under "Custom tools" with the local executable path.

**M365 Copilot:** Per-user registration via the Copilot Studio "MCP servers" panel (preview as of 2026-05).

Both require the MCP server be reachable from the LLM client process. For initial pilot, deploy the server alongside the cookbook on `bcc-ap-llm01` and expose it via stdio to the local user's ChatGPT/Copilot client.

## Future tools (Phase 2)

- `recommend_pattern(task: string)` — given a user task description, recommend the most relevant cookbook pattern (RTCO, persona, chain-of-thought, etc.)
- `evaluate_prompt(prompt: string)` — heuristic evaluation of a user's prompt against cookbook patterns

Both require an LLM call — deferred until the renewal narrative needs the deeper signal.

## Cross-references

- Cookbook chapter source: `client/src/lib/cookbookData.ts` (34 chapters)
- ROI sidecar: `api/src/lib/roi-sidecar.js`
- ADR-008 (3-layer coverage strategy): `~/Projects/manatee-ai-roi/docs/adr/` (when written)
- Operating Rule #18 (broadened scope): `~/.claude/CLAUDE.md`
