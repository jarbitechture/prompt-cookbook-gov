import { useState, useEffect, useCallback, useMemo } from "react";
import type { ComponentProps } from "react";
import { Menu } from "lucide-react";
import { chapters, parts } from "@/lib/cookbookData";
import type { Difficulty } from "@/lib/cookbookData";
import { personas } from "@/lib/personas";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { usePersona } from "@/hooks/usePersona";
import { getDepartment, departments } from "@/lib/departments";
import type { Category } from "@/lib/departments";
import Sidebar from "@/components/Sidebar";
import HeroSection from "@/components/HeroSection";
import DifficultyFilter from "@/components/DifficultyFilter";
import RecipeCard from "@/components/RecipeCard";
import ChapterDetail from "@/components/ChapterDetail";
import RecentlyViewed from "@/components/RecentlyViewed";

const sectionDividerConfig: Record<string, { label: string; accent: string }> = {
  part1: { label: "START HERE", accent: "oklch(0.38 0.14 245)" },
  part2: { label: "EVERYDAY USE", accent: "oklch(0.52 0.14 55)" },
  part3: { label: "GOING DEEPER", accent: "oklch(0.42 0.14 155)" },
  part4: { label: "GOVERNANCE & HORIZON", accent: "oklch(0.42 0.14 300)" },
};

function SectionDivider({ partId, label: overrideLabel }: { partId: string; label?: string }) {
  const config = sectionDividerConfig[partId] || { label: partId, accent: "oklch(0.5 0.1 200)" };
  const displayLabel = overrideLabel || config.label;
  return (
    <div className="flex items-center gap-3 my-8">
      <div
        className="w-1.5 h-5 rounded-full flex-shrink-0"
        style={{ background: config.accent }}
      />
      <span
        className="font-serif font-bold text-sm"
        style={{ color: "oklch(0.20 0.025 38)" }}
      >
        {displayLabel}
      </span>
      <div className="flex-1 h-px ml-2" style={{ background: "oklch(0.91 0.010 70)" }} />
    </div>
  );
}

/** A cookbook Part rendered as a collapsible pick-list section, so the
 *  chapter browser doesn't run the full length of the page. */
function CollapsiblePart({
  partId,
  chapters,
  isOpen,
  onToggle,
  onSelectChapter,
}: {
  partId: string;
  chapters: ComponentProps<typeof RecipeCard>["chapter"][];
  isOpen: boolean;
  onToggle: () => void;
  onSelectChapter: (id: string) => void;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center gap-2 text-left"
      >
        <div className="flex-1">
          <SectionDivider partId={partId} />
        </div>
        <span
          className="text-xs font-bold flex-shrink-0"
          style={{ color: "oklch(0.50 0.04 55)" }}
        >
          {isOpen ? "▾" : "▸"}
        </span>
      </button>
      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-center">
          {chapters.map((ch, i) => (
            <RecipeCard
              key={ch.id}
              chapter={ch}
              onClick={() => onSelectChapter(ch.id)}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** First-visit instructions banner */
function OnboardingBanner({ onSelectChapter: _onSelectChapter }: { onSelectChapter: (id: string) => void }) {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("cookbook-onboarded") === "true");
  const [expanded, setExpanded] = useState(false);

  if (dismissed) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:shadow-sm"
          style={{
            background: "oklch(0.48 0.14 55)",
            color: "oklch(0.98 0.01 70)",
          }}
        >
          📖 {expanded ? "Hide Instructions" : "How to Use This App"}
        </button>
        <button
          onClick={() => {
            localStorage.setItem("cookbook-onboarded", "true");
            setDismissed(true);
          }}
          className="text-[10px]"
          style={{ color: "oklch(0.60 0.04 50)" }}
        >
          ✕ hide
        </button>
      </div>
      {expanded && (
        <div
          className="mt-2 rounded-xl p-4 text-xs leading-relaxed space-y-2"
          style={{
            background: "oklch(0.998 0.002 70)",
            border: "1px solid oklch(0.90 0.02 55)",
          }}
        >
          <p style={{ color: "oklch(0.30 0.04 40)" }}>
            <strong>1. Pick your department</strong> — Use the dropdown to personalize everything: hero message, recommended chapters, and prompt templates all adapt to your team's workflows.
          </p>
          <p style={{ color: "oklch(0.30 0.04 40)" }}>
            <strong>2. Browse recipes</strong> — {chapters.length} chapters organized by skill level. Each recipe teaches one prompt technique with Manatee County examples you can use in Copilot or ChatGPT.
          </p>
          <p style={{ color: "oklch(0.30 0.04 40)" }}>
            <strong>3. Practice</strong> — The Prompt Lab has real county scenarios: blind arena comparisons, technique identification, and a capstone blueprint.
          </p>
          <p style={{ color: "oklch(0.30 0.04 40)" }}>
            <strong>4. Stay compliant</strong> — All prompts follow the AI Governance Handbook (v1.0). See Resources → Internal for the full policy, risk classification, and approved tools list.
          </p>
          <p style={{ color: "oklch(0.30 0.04 40)" }}>
            <strong>5. Get help</strong> — Contact ITS at itservices@mymanatee.org for policy questions.
          </p>
        </div>
      )}
    </div>
  );
}


export default function Home() {
  const [activeChapter, setActiveChapter] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAllChapters, setShowAllChapters] = useState(false);
  const [openParts, setOpenParts] = useState<Set<string>>(() => new Set(["part1"]));
  const togglePart = useCallback((pid: string) => {
    setOpenParts((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
  }, []);
  const [selectedDept, setSelectedDeptState] = useState<Category | null>(() => {
    try {
      const stored = localStorage.getItem("cookbook-department");
      if (stored) return getDepartment(stored) || null;
    } catch { /* */ }
    return null;
  });
  const setSelectedDept = useCallback((dept: Category | null) => {
    setSelectedDeptState(dept);
    try {
      if (dept) localStorage.setItem("cookbook-department", dept.id);
      else localStorage.removeItem("cookbook-department");
    } catch { /* */ }
    // Notify App-level listeners (storage event only fires cross-tab)
    window.dispatchEvent(new Event("cookbook-department-changed"));
  }, []);
  const { recentItems, addRecentItem, clearRecent } = useRecentlyViewed();
  const { persona, setPersona } = usePersona();

  // Handle hash-based deep linking
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      const chapter = chapters.find((ch) => ch.id === hash);
      if (chapter) {
        setActiveChapter(hash);
        addRecentItem(hash, chapter.title);
      }
    }

    const handleHashChange = () => {
      const newHash = window.location.hash.replace("#", "");
      if (newHash) {
        const chapter = chapters.find((ch) => ch.id === newHash);
        if (chapter) {
          setActiveChapter(newHash);
          addRecentItem(newHash, chapter.title);
        }
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [addRecentItem]);

  const handleSelectChapter = useCallback(
    (id: string) => {
      const chapter = chapters.find((ch) => ch.id === id);
      if (chapter) {
        setActiveChapter(id);
        addRecentItem(id, chapter.title);
        window.location.hash = id;
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [addRecentItem]
  );

  const handleBack = useCallback(() => {
    setActiveChapter(null);
    window.location.hash = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Apply difficulty filter first
  const difficultyFiltered =
    difficultyFilter === "all"
      ? chapters
      : chapters.filter((ch) => ch.difficulty === difficultyFilter);

  // Split into matching and non-matching groups
  // Department filtering takes priority over persona filtering
  const { matchingGroups, nonMatchingGroups } = useMemo(() => {
    const partOrder = parts.map((p) => p.id);
    const matching: { partId: string; chapters: typeof difficultyFiltered }[] = [];
    const nonMatching: { partId: string; chapters: typeof difficultyFiltered }[] = [];

    // If a department is selected, use its relevantChapters for filtering
    const relevantChapterIds = selectedDept?.relevantChapters;

    for (const partId of partOrder) {
      const partChapters = difficultyFiltered.filter((ch) => ch.part === partId);
      if (partChapters.length === 0) continue;

      if (relevantChapterIds) {
        // Department selected: split chapters by relevance
        const relevant = partChapters.filter((ch) => relevantChapterIds.includes(ch.id));
        const notRelevant = partChapters.filter((ch) => !relevantChapterIds.includes(ch.id));
        if (relevant.length > 0) matching.push({ partId, chapters: relevant });
        if (notRelevant.length > 0) nonMatching.push({ partId, chapters: notRelevant });
      } else if (persona && !persona.interests.includes(partId)) {
        // No department but persona selected: use persona interests
        nonMatching.push({ partId, chapters: partChapters });
      } else {
        matching.push({ partId, chapters: partChapters });
      }
    }
    return { matchingGroups: matching, nonMatchingGroups: nonMatching };
  }, [difficultyFiltered, persona, selectedDept]);

  const selectedChapter = activeChapter
    ? chapters.find((ch) => ch.id === activeChapter)
    : null;

  return (
    <div className="flex min-h-screen" style={{ background: "oklch(0.97 0.008 75)" }}>
      {/* Sidebar */}
      <Sidebar
        activeChapter={activeChapter}
        onSelectChapter={handleSelectChapter}
        recentItems={recentItems}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        selectedDepartment={selectedDept}
        onSelectDepartment={setSelectedDept}
      />

      {/* Main content */}
      <main className="flex-1 min-w-0" id="main-content">
        {/* Mobile header */}
        <div
          className="sticky top-0 z-30 lg:hidden flex items-center gap-3 px-4 py-3"
          style={{
            background: "oklch(0.97 0.008 75 / 0.95)",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid oklch(0.90 0.02 75)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-md"
            style={{ color: "oklch(0.40 0.04 45)" }}
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-serif font-bold text-sm flex-1" style={{ color: "oklch(0.25 0.03 40)" }}>
            MCG AI Prompt Cookbook
          </span>
          {/* Mobile department selector */}
          <select
            value={selectedDept?.id || ""}
            onChange={(e) => {
              if (e.target.value) {
                const dept = getDepartment(e.target.value);
                if (dept) setSelectedDept(dept);
              } else {
                setSelectedDept(null);
              }
            }}
            className="text-xs font-bold px-3 py-1.5 rounded-lg"
            style={{
              background: selectedDept ? "oklch(0.25 0.06 55)" : "oklch(0.92 0.03 55)",
              border: selectedDept ? "1px solid oklch(0.40 0.08 55)" : "1px solid oklch(0.80 0.05 55)",
              color: selectedDept ? "oklch(0.90 0.02 70)" : "oklch(0.30 0.06 45)",
              maxWidth: "160px",
            }}
          >
            <option value="">🏛️ Pick Department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
            ))}
          </select>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
          {selectedChapter ? (
            <ChapterDetail chapter={selectedChapter} onBack={handleBack} />
          ) : (
            <>
              {/* First-visit onboarding */}
              <OnboardingBanner onSelectChapter={handleSelectChapter} />

              {/* Department indicator */}
              <div className="mb-4">
                {selectedDept ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{selectedDept.icon}</span>
                    <div>
                      <span className="text-sm font-bold" style={{ color: "oklch(0.25 0.04 40)" }}>
                        {selectedDept.name}
                      </span>
                      <span className="text-xs ml-2" style={{ color: "oklch(0.55 0.04 50)" }}>
                        Showing {selectedDept.relevantChapters.length} relevant chapters
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      background: "oklch(0.92 0.02 55 / 0.5)",
                      border: "1px solid oklch(0.85 0.04 55)",
                    }}
                  >
                    <span className="text-sm">👋</span>
                    <span className="text-xs font-medium" style={{ color: "oklch(0.35 0.06 45)" }}>
                      Pick your department to see relevant recipes first
                    </span>
                  </div>
                )}
              </div>

              {/* Hero */}
              <HeroSection greeting={selectedDept?.personalization.heroGreeting || persona?.greeting} />

              {/* Recently Viewed */}
              <RecentlyViewed
                items={recentItems}
                onSelect={handleSelectChapter}
                onClear={clearRecent}
              />

              {/* Difficulty Filter */}
              <DifficultyFilter active={difficultyFilter} onChange={setDifficultyFilter} />

              {/* Department Case Studies */}
              {selectedDept && selectedDept.caseStudies.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">{selectedDept.icon}</span>
                    <h2 className="text-sm font-bold" style={{ color: "oklch(0.25 0.04 40)" }}>
                      {selectedDept.name} — Prompt Case Studies
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedDept.caseStudies.map((cs, i) => (
                      <div
                        key={i}
                        className="rounded-xl overflow-hidden"
                        style={{
                          background: "oklch(0.998 0.002 70)",
                          border: `1px solid oklch(0.92 0.01 70)`,
                        }}
                      >
                        <div className="px-4 py-3" style={{ borderBottom: "1px solid oklch(0.94 0.01 70)" }}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold" style={{ color: "oklch(0.25 0.04 40)" }}>{cs.title}</span>
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: "oklch(0.94 0.03 155)", color: "oklch(0.40 0.12 155)" }}
                            >
                              {cs.technique}
                            </span>
                          </div>
                          <p className="text-xs" style={{ color: "oklch(0.50 0.04 50)" }}>{cs.scenario}</p>
                        </div>
                        <div className="grid grid-cols-2 divide-x" style={{ borderColor: "oklch(0.92 0.01 70)" }}>
                          <div className="p-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: "oklch(0.55 0.14 25)" }}>
                              Weak
                            </span>
                            <p className="text-[11px] leading-relaxed" style={{ color: "oklch(0.40 0.04 40)" }}>
                              {cs.weakPrompt}
                            </p>
                          </div>
                          <div className="p-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: "oklch(0.45 0.14 155)" }}>
                              Strong
                            </span>
                            <p className="text-[11px] leading-relaxed" style={{ color: "oklch(0.30 0.04 40)" }}>
                              {cs.strongPrompt}
                            </p>
                          </div>
                        </div>
                        <div className="px-4 py-2" style={{ background: "oklch(0.97 0.005 70)" }}>
                          <button
                            onClick={() => {
                              localStorage.setItem("cookbook-builder-import", cs.strongPrompt);
                              window.location.href = "/builder/"; // cross-bundle: full navigation
                            }}
                            className="text-[11px] font-bold"
                            style={{ color: "oklch(0.48 0.12 220)" }}
                          >
                            Try this prompt in Builder →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recipe Grid — matching sections */}
              {matchingGroups.map((group) => (
                <CollapsiblePart
                  key={group.partId}
                  partId={group.partId}
                  chapters={group.chapters}
                  isOpen={openParts.has(group.partId)}
                  onToggle={() => togglePart(group.partId)}
                  onSelectChapter={handleSelectChapter}
                />
              ))}

              {/* Non-matching sections (dimmed when persona active) */}
              {nonMatchingGroups.length > 0 && persona && (
                <div className="mt-4">
                  {showAllChapters ? (
                    <>
                      <div className="flex items-center gap-4 my-8">
                        <div className="flex-1 h-px" style={{ background: "oklch(0.75 0.02 55)", opacity: 0.3 }} />
                        <button
                          onClick={() => setShowAllChapters(false)}
                          className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full whitespace-nowrap transition-all hover:opacity-80"
                          style={{ color: "oklch(0.50 0.04 55)", background: "oklch(0.94 0.01 55)" }}
                        >
                          ▾ MORE CHAPTERS
                        </button>
                        <div className="flex-1 h-px" style={{ background: "oklch(0.75 0.02 55)", opacity: 0.3 }} />
                      </div>
                      <div style={{ opacity: 0.5 }}>
                        {nonMatchingGroups.map((group) => (
                          <CollapsiblePart
                            key={group.partId}
                            partId={group.partId}
                            chapters={group.chapters}
                            isOpen={openParts.has(group.partId)}
                            onToggle={() => togglePart(group.partId)}
                            onSelectChapter={handleSelectChapter}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-4 my-8">
                      <div className="flex-1 h-px" style={{ background: "oklch(0.75 0.02 55)", opacity: 0.3 }} />
                      <button
                        onClick={() => setShowAllChapters(true)}
                        className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full whitespace-nowrap transition-all hover:opacity-80"
                        style={{ color: "oklch(0.50 0.04 55)", background: "oklch(0.94 0.01 55)" }}
                      >
                        ▸ SHOW {nonMatchingGroups.reduce((n, g) => n + g.chapters.length, 0)} MORE CHAPTERS
                      </button>
                      <div className="flex-1 h-px" style={{ background: "oklch(0.75 0.02 55)", opacity: 0.3 }} />
                    </div>
                  )}
                </div>
              )}

              {/* No persona — show non-matching normally */}
              {nonMatchingGroups.length > 0 && !persona && nonMatchingGroups.map((group) => (
                <CollapsiblePart
                  key={group.partId}
                  partId={group.partId}
                  chapters={group.chapters}
                  isOpen={openParts.has(group.partId)}
                  onToggle={() => togglePart(group.partId)}
                  onSelectChapter={handleSelectChapter}
                />
              ))}

              {matchingGroups.length === 0 && nonMatchingGroups.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-lg" style={{ color: "oklch(0.50 0.04 50)" }}>
                    No recipes match this difficulty level.
                  </p>
                  <button
                    onClick={() => setDifficultyFilter("all")}
                    className="mt-3 text-sm font-medium"
                    style={{ color: "oklch(0.55 0.12 45)" }}
                  >
                    Show all recipes
                  </button>
                </div>
              )}

              {/* Footer */}
              <footer className="mt-12 pt-6 pb-8 text-center" style={{ borderTop: "1px solid oklch(0.90 0.02 75)" }}>
                <p className="text-xs" style={{ color: "oklch(0.50 0.04 50)" }}>
                  AI Working Group Prompt Cookbook — Manatee County Government
                </p>
                <p className="text-xs mt-1" style={{ color: "oklch(0.60 0.03 55)" }}>
                  Sources: GovAI Coalition, City of San Jose, NIST, NJ OIT, MA EOTSS, Georgia GTA, InnovateUS/Maryland DoIT, NACo, National Academies
                </p>
              </footer>
            </>
          )}
        </div>
      </main>

    </div>
  );
}
