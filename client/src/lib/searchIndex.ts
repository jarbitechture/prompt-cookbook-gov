// ═══════════════════════════════════════════════════════════════════════════
// Semantic Search Index — searches across all app content
// Fuzzy matching with relevance scoring
// ═══════════════════════════════════════════════════════════════════════════

import { chapters } from "./cookbookData";
import { departments } from "./departments";

export interface SearchResult {
  type: "chapter" | "recipe" | "department" | "lesson" | "case-study";
  title: string;
  subtitle: string;
  icon: string;
  href: string;
  score: number;
  /** Extra context shown in results */
  context?: string;
}

interface IndexEntry {
  type: SearchResult["type"];
  title: string;
  subtitle: string;
  icon: string;
  href: string;
  /** All searchable text concatenated, lowercased */
  searchText: string;
  /** Keywords that boost relevance */
  keywords: string[];
}

let _index: IndexEntry[] | null = null;

function buildIndex(): IndexEntry[] {
  if (_index) return _index;

  const entries: IndexEntry[] = [];

  // 1. Chapters (30)
  for (const ch of chapters) {
    entries.push({
      type: "chapter",
      title: ch.title,
      subtitle: ch.subtitle,
      icon: ch.icon,
      href: `/#${ch.id}`,
      searchText: `${ch.title} ${ch.subtitle} ${ch.id}`.toLowerCase(),
      keywords: [ch.id, ch.part, ch.difficulty],
    });
  }

  // 2. Departments (7) + case studies
  for (const dept of departments) {
    entries.push({
      type: "department",
      title: dept.name,
      subtitle: dept.description,
      icon: dept.icon,
      href: "/", // selecting dept is done via dropdown
      searchText: `${dept.name} ${dept.description} ${dept.subCategories.map(sc => `${sc.name} ${sc.services.map(s => `${s.name} ${s.description}`).join(" ")}`).join(" ")}`.toLowerCase(),
      keywords: [dept.id, ...dept.subCategories.flatMap(sc => sc.services.map(s => s.name.toLowerCase()))],
    });

    // Case studies
    for (const cs of dept.caseStudies) {
      entries.push({
        type: "case-study",
        title: cs.title,
        subtitle: `${dept.name} — ${cs.technique}`,
        icon: "📋",
        href: "/", // case studies show when dept is selected
        searchText: `${cs.title} ${cs.scenario} ${cs.technique} ${cs.strongPrompt} ${dept.name}`.toLowerCase(),
        keywords: [cs.technique.toLowerCase(), dept.id],
      });
    }
  }

  // 3. Prompt technique keywords (mapped to chapters)
  const techniqueMap: Record<string, { title: string; href: string; icon: string }> = {
    "zero-shot": { title: "Zero-Shot Prompting", href: "/#ch01", icon: "🎯" },
    "few-shot": { title: "Few-Shot Learning", href: "/#ch04", icon: "📚" },
    "chain-of-thought": { title: "Chain-of-Thought", href: "/#ch05", icon: "🔗" },
    "cot": { title: "Chain-of-Thought (CoT)", href: "/#ch05", icon: "🔗" },
    "rtco": { title: "RTCO Framework", href: "/#ch24", icon: "🧩" },
    "persona": { title: "Persona Pattern", href: "/#ch03", icon: "🎭" },
    "negative prompting": { title: "Negative Prompting", href: "/#ch26", icon: "🚫" },
    "task chaining": { title: "Task Chaining", href: "/#ch09", icon: "⛓️" },
  };

  for (const [keyword, meta] of Object.entries(techniqueMap)) {
    entries.push({
      type: "chapter",
      title: meta.title,
      subtitle: "Prompt technique",
      icon: meta.icon,
      href: meta.href,
      searchText: keyword,
      keywords: [keyword],
    });
  }

  // 4. App pages
  entries.push(
    { type: "recipe", title: "Prompt Builder", subtitle: "Build structured prompts block by block", icon: "🔨", href: "/builder", searchText: "prompt builder build create assemble template rtco", keywords: ["builder"] },
    { type: "recipe", title: "Prompt Lab", subtitle: "Practice with real county scenarios", icon: "🧪", href: "/game", searchText: "prompt lab game practice test quiz arena challenge capstone", keywords: ["lab", "game"] },
    { type: "recipe", title: "All Recipes", subtitle: "15 plug-and-play prompt templates", icon: "📖", href: "/resources?tab=recipes", searchText: "recipes templates writing analysis data planning county work", keywords: ["recipes"] },
    { type: "lesson", title: "Jumpstart Course", subtitle: "14 lessons on prompt engineering", icon: "🎓", href: "/resources", searchText: "jumpstart course lessons training learn tutorial", keywords: ["jumpstart", "course"] },
    { type: "recipe", title: "Request AI Training", subtitle: "Book a session for your team", icon: "🎓", href: "/resources?tab=internal", searchText: "training request workshop session team department", keywords: ["training"] },
  );

  _index = entries;
  return entries;
}

/** Score a query against a search entry. Higher = better match. */
function scoreEntry(entry: IndexEntry, queryTerms: string[]): number {
  let score = 0;
  const titleLower = entry.title.toLowerCase();
  const subtitleLower = entry.subtitle.toLowerCase();

  for (const term of queryTerms) {
    // Exact title match (highest weight)
    if (titleLower === term) score += 100;
    // Title starts with term
    else if (titleLower.startsWith(term)) score += 60;
    // Title contains term
    else if (titleLower.includes(term)) score += 40;
    // Subtitle contains term
    if (subtitleLower.includes(term)) score += 20;
    // Keyword exact match
    if (entry.keywords.some(k => k === term)) score += 35;
    // Keyword partial match
    else if (entry.keywords.some(k => k.includes(term))) score += 15;
    // Full text contains term
    if (entry.searchText.includes(term)) score += 10;
    // Fuzzy: term is substring of any word in searchText
    const words = entry.searchText.split(/\s+/);
    for (const word of words) {
      if (word.startsWith(term) && term.length >= 2) {
        score += 8;
        break;
      }
    }
  }

  // Bonus for matching multiple terms
  const matchedTerms = queryTerms.filter(t => entry.searchText.includes(t));
  if (matchedTerms.length > 1) score += matchedTerms.length * 10;

  return score;
}

/** Search all content. Returns top results sorted by relevance. */
export function search(query: string, limit = 12): SearchResult[] {
  if (!query || query.trim().length < 2) return [];

  const index = buildIndex();
  const queryTerms = query.toLowerCase().trim().split(/\s+/).filter(t => t.length >= 2);
  if (queryTerms.length === 0) return [];

  const scored = index
    .map(entry => ({
      ...entry,
      score: scoreEntry(entry, queryTerms),
    }))
    .filter(e => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ type, title, subtitle, icon, href, score }) => ({
    type,
    title,
    subtitle,
    icon,
    href,
    score,
  }));
}
