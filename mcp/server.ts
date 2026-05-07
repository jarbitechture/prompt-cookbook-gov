/**
 * Manatee Cookbook MCP server (ADR-008 Layer 3 — Cookbook tools).
 *
 * Exposes the Prompt Cookbook chapters as MCP tools, callable from
 * ChatGPT Enterprise, M365 Copilot, or any MCP-compliant LLM client.
 * Each tool invocation emits a ROI event tagged event_kind=TOOL_INVOCATION,
 * tool=cookbook so renewal-narrative dashboards can show:
 *
 *   "% of paid Copilot/ChatGPT seats that tapped county-built cookbook
 *    guidance during the period"
 *
 * Tier 2 KPI: cookbook MCP usage by dept × tool (vendor source).
 *
 * Identity: env vars at startup carry the calling user's identity. The
 * server is deployed per-user (each user adds it to their ChatGPT/Copilot
 * tools config) so this is the natural attribution model.
 *
 *   MCP_USER_UPN       — required, AD UPN of the user
 *   MCP_DEPT           — recommended, county dept code
 *   MCP_ROLE_BAND      — recommended, one of: exec/director/manager/senior/professional/support
 *   ROI_EVENTS_URL     — manatee-ai-roi FastAPI base (default localhost:8000)
 *   ROI_FALLBACK_PATH  — fallback JSONL path if FastAPI unreachable
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { chapters, type Chapter } from "../client/src/lib/cookbookData.js";
import { withRoiEvent, EventKind, newTraceId } from "../api/src/lib/roi-sidecar.js";

const USER_UPN = process.env.MCP_USER_UPN || "anonymous";
const DEPT = process.env.MCP_DEPT || "Unknown";
const ROLE_BAND = process.env.MCP_ROLE_BAND || "professional";

// ─── tool implementations ────────────────────────────────────────────────────

function searchChaptersImpl(query: string, limit: number): Chapter[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  // Score each chapter; substring hits in title weight more than summary/content.
  const scored = chapters.map((c) => {
    let score = 0;
    if (c.title.toLowerCase().includes(q)) score += 10;
    if (c.subtitle.toLowerCase().includes(q)) score += 5;
    if (c.summary.toLowerCase().includes(q)) score += 3;
    if (c.content.some((p) => p.toLowerCase().includes(q))) score += 2;
    if (c.keyTakeaways.some((p) => p.toLowerCase().includes(q))) score += 4;
    return { c, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.c);
}

function getChapterImpl(idOrNumber: string): Chapter | null {
  const target = idOrNumber.trim();
  return (
    chapters.find((c) => c.id === target) ??
    chapters.find((c) => String(c.number) === target) ??
    null
  );
}

// ─── MCP server ──────────────────────────────────────────────────────────────

const server = new Server(
  { name: "manatee-cookbook", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_chapters",
      description:
        "Search the Manatee County Prompt Cookbook for chapters relevant to a user's task. " +
        "Returns ranked chapter summaries (title, subtitle, summary, key takeaways). " +
        "Use this when a user asks for prompting guidance, technique selection, or how to approach a task.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "What the user wants help with (free-text)." },
          limit: { type: "number", description: "Max results to return.", default: 5 },
        },
        required: ["query"],
      },
    },
    {
      name: "get_chapter",
      description:
        "Retrieve the full content of a specific cookbook chapter, including content paragraphs, " +
        "prompt examples, key takeaways, and the persona/role it targets. Use this after search_chapters " +
        "when the user has chosen a chapter to read in depth.",
      inputSchema: {
        type: "object",
        properties: {
          id_or_number: {
            type: "string",
            description: "Chapter id (e.g. 'ch01') or number (e.g. '1').",
          },
        },
        required: ["id_or_number"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const traceId = newTraceId();
  const { name, arguments: args } = req.params;

  const ctx = {
    workflow: `cookbook_mcp.${name}`,
    user_id: USER_UPN,
    dept: DEPT,
    role_band: ROLE_BAND,
    task_type: "search",
    tool: "cookbook",
    surface: "other",
    event_kind: EventKind.TOOL_INVOCATION,
    trace_id: traceId,
  };

  if (name === "search_chapters") {
    const query = String(args?.query ?? "");
    const limit = Number(args?.limit ?? 5);
    const result = await withRoiEvent(ctx, async () => {
      const hits = searchChaptersImpl(query, limit);
      return hits.map((c) => ({
        id: c.id,
        number: c.number,
        title: c.title,
        subtitle: c.subtitle,
        difficulty: c.difficulty,
        summary: c.summary,
        key_takeaways: c.keyTakeaways,
      }));
    });
    return { content: [{ type: "text", text: JSON.stringify({ matches: result }, null, 2) }] };
  }

  if (name === "get_chapter") {
    const idOrNumber = String(args?.id_or_number ?? "");
    const result = await withRoiEvent(ctx, async () => {
      const c = getChapterImpl(idOrNumber);
      if (!c) return { error: `chapter not found: ${idOrNumber}` };
      return {
        id: c.id,
        number: c.number,
        title: c.title,
        subtitle: c.subtitle,
        part: c.partLabel,
        difficulty: c.difficulty,
        persona: c.persona,
        persona_role: c.personaRole,
        summary: c.summary,
        content: c.content,
        prompt_examples: c.promptExamples,
        key_takeaways: c.keyTakeaways,
        try_it_template: c.tryItTemplate,
      };
    });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  throw new Error(`unknown tool: ${name}`);
});

// ─── boot ───────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
process.stderr.write(
  `manatee-cookbook MCP server listening on stdio · user=${USER_UPN} dept=${DEPT}\n`
);
