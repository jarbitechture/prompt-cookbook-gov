/**
 * parseRefinedRtco — shred a Refine-mode rewritten prompt back into RTCO blocks.
 *
 * The /api/refine endpoint returns `rewritten` as one holistic string: usually
 * a single paragraph, the role as a leading "You are a ..." sentence, the other
 * sections marked by inline "Task:/Context:/Output:/Constraints:" labels. Weak
 * dev models (Ollama gemma3:4b) additionally leak the sibling JSON fields
 * ("Applied techniques:", "Notes:") into the string.
 *
 * Best-effort by design, so the Builder's "Use this prompt" can replace the
 * user's draft. Section bleed is possible (e.g. an anti-hallucination sentence
 * landing in Output rather than Constraints) — acceptable: the user can edit
 * the blocks afterward, and Reset clears everything.
 */
export function parseRefinedRtco(raw: string): Record<string, string> {
  const out: Record<string, string> = {};

  // 1. Drop the schema-field leak ("Applied techniques:" / "Notes:" onward).
  let text = raw.replace(/\s*(?:Applied techniques|Notes)\s*:[\s\S]*$/i, "").trim();

  // 2. Leading "You are a/an <role>." → the Role block.
  const role = text.match(/^You are an?\s+(.+?)\.\s*/i);
  if (role) {
    out.role = role[1].trim();
    text = text.slice(role[0].length);
  }

  // 3. Split the remainder on inline RTCO labels; last value wins per key.
  const LABEL = /(Role|Task|Context|Output\s*Format|Output|Constraints)\s*:/gi;
  const KEY: Record<string, string> = {
    role: "role",
    task: "task",
    context: "context",
    output: "output",
    "output format": "output",
    constraints: "constraints",
  };
  const hits = [...text.matchAll(LABEL)];

  // 4. Fallback: no labels at all — put the whole cleaned string in Task so
  //    Accept still visibly changes the draft.
  if (hits.length === 0) {
    if (text.trim()) out.task = text.trim();
    return out;
  }

  for (let i = 0; i < hits.length; i++) {
    const m = hits[i];
    const key = KEY[m[1].toLowerCase().replace(/\s+/g, " ")];
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < hits.length ? (hits[i + 1].index ?? text.length) : text.length;
    const value = text.slice(start, end).trim();
    if (key && value) out[key] = value;
  }
  return out;
}
