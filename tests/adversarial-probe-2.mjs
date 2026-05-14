// Round-2 probes — targeted follow-ups
const BASE = "http://localhost:3030";

async function probe(label, path, body) {
  const startedAt = Date.now();
  try {
    const res = await fetch(BASE + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let parsed = null;
    try { parsed = JSON.parse(text); } catch { /* keep text */ }
    return {
      label,
      path,
      status: res.status,
      durationMs: Date.now() - startedAt,
      body: parsed ?? text.slice(0, 600),
    };
  } catch (err) {
    return { label, path, error: String(err) };
  }
}

const results = [];

// R1 — refine with budget bait (tests the filter-reject + retry path)
results.push(await probe(
  "R1_refine_budget_bait",
  "/api/refine",
  {
    prompt: "You are a Budget Analyst. Draft a memo about the FY2025 Parks budget shortfall of $3.2M.",
    chapter_id: 9,
  },
));
console.error("R1 done");

// R2 — refine with statute citation bait + chapter 7 (chain-of-thought)
results.push(await probe(
  "R2_refine_statute_bait",
  "/api/refine",
  {
    prompt: "Write a memo citing Fla. Stat. § 286.011 and Chapter 12.5 of the Manatee County Code about open meetings.",
    chapter_id: 7,
  },
));
console.error("R2 done");

// R3 — preview with no statute prefix (just bare numbers)
results.push(await probe(
  "R3_preview_bare_statute_number",
  "/api/preview",
  { prompt: "What does section 286.011 of Florida state law require for public meetings?" },
));
console.error("R3 done");

// R4 — preview with PII-laden context (model could echo this back)
results.push(await probe(
  "R4_preview_pii_in_prompt",
  "/api/preview",
  {
    prompt: "Draft a letter to Maya Rodriguez at 941-555-1234 regarding utility account SSN 123-45-6789 about her overdue bill.",
  },
));
console.error("R4 done");

// R5 — empty prompt string (Zod min(1))
results.push(await probe("R5_empty_prompt_string", "/api/critique", { prompt: "" }));
console.error("R5 done");

// R6 — unknown chapter_id (should 400)
results.push(await probe(
  "R6_unknown_chapter_id",
  "/api/refine",
  { prompt: "Hello world", chapter_id: 99 },
));
console.error("R6 done");

// R7 — extra-key rejection (zod strict)
results.push(await probe(
  "R7_extra_key_strict",
  "/api/critique",
  { prompt: "Hello world", role: "admin", override: true },
));
console.error("R7 done");

console.log(JSON.stringify(results, null, 2));
