import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Menu, ChevronDown, ChevronRight as ChevronRightIcon, FlaskConical, Wrench, BookOpen, ChefHat, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { AnimatePresence } from "framer-motion";
import { chapters, parts } from "@/lib/cookbookData";
import type { Difficulty } from "@/lib/cookbookData";
import { personas } from "@/lib/personas";
import { tasteTests, tierLabels } from "@/lib/tasteTests";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { usePersona } from "@/hooks/usePersona";
import { useTasteTests } from "@/hooks/useTasteTests";
import { getDepartment, departments } from "@/lib/departments";
import type { Department } from "@/lib/departments";
import Sidebar from "@/components/Sidebar";
import HeroSection from "@/components/HeroSection";
import DifficultyFilter from "@/components/DifficultyFilter";
import RecipeCard from "@/components/RecipeCard";
import ChapterDetail from "@/components/ChapterDetail";
import RecentlyViewed from "@/components/RecentlyViewed";
import TasteTestModal from "@/components/TasteTestModal";

const quickActions = [
  { label: "Prompt Lab", desc: "Practice improving prompts with 10 real scenarios", icon: FlaskConical, href: "/game", color: "oklch(0.50 0.14 155)", bg: "linear-gradient(135deg, oklch(0.18 0.06 155), oklch(0.22 0.04 145))", border: "oklch(0.30 0.08 155)" },
  { label: "Prompt Builder", desc: "Assemble prompts from department templates", icon: Wrench, href: "/builder", color: "oklch(0.55 0.12 220)", bg: "linear-gradient(135deg, oklch(0.18 0.06 220), oklch(0.22 0.04 240))", border: "oklch(0.30 0.08 220)" },
  { label: "Resources", desc: "Curated tools, trainings, and references", icon: BookOpen, href: "/resources", color: "oklch(0.55 0.14 280)", bg: "linear-gradient(135deg, oklch(0.18 0.06 280), oklch(0.22 0.04 300))", border: "oklch(0.30 0.08 280)" },
];

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
            <strong>1. Pick your department</strong> — Use the dropdown to personalize everything: hero message, recommended chapters, prompt templates, and the Prompt of the Week all adapt to your team's workflows.
          </p>
          <p style={{ color: "oklch(0.30 0.04 40)" }}>
            <strong>2. Browse recipes</strong> — 30 chapters organized by skill level. Each recipe teaches one prompt technique with Manatee County examples you can use in Copilot or ChatGPT.
          </p>
          <p style={{ color: "oklch(0.30 0.04 40)" }}>
            <strong>3. Build prompts</strong> — The Prompt Builder assembles structured prompts block by block using the RTCO framework. Pre-loaded with your department's template when you select one.
          </p>
          <p style={{ color: "oklch(0.30 0.04 40)" }}>
            <strong>4. Practice</strong> — The Prompt Lab has real county scenarios: blind arena comparisons, technique identification, and a 9-step capstone blueprint.
          </p>
          <p style={{ color: "oklch(0.30 0.04 40)" }}>
            <strong>5. Stay compliant</strong> — All prompts follow the AI Governance Handbook (v1.0). See Resources → Internal for the full policy, risk classification, and approved tools list.
          </p>
          <p style={{ color: "oklch(0.30 0.04 40)" }}>
            <strong>6. Get help</strong> — Click "Menu Planning" in the bottom right for AI prompt assistance. Contact ITS at itservices@mymanatee.org for policy questions.
          </p>
        </div>
      )}
    </div>
  );
}

/** Prompt of the Week — featured prompt, department-aware */
function PromptOfTheWeek({ department }: { department?: Department | null }) {
  const [expanded, setExpanded] = useState(false);

  const defaultPrompt = {
    week: "Week of March 31, 2026",
    title: "Meeting Transcript Summarizer",
    description: "Take a Microsoft Stream or Teams recording transcript and turn it into a concise summary with action items, decisions, and next steps.",
    template: `You are a meeting analyst for Manatee County Government.

I will paste a transcript from a Microsoft Teams or Stream recording.

Produce a structured summary with these sections:
1. **Meeting Overview** — date, attendees, purpose (1-2 sentences)
2. **Key Discussion Points** — bulleted list of topics covered
3. **Decisions Made** — numbered list with owner if mentioned
4. **Action Items** — table with columns: Action, Owner, Due Date
5. **Next Steps** — what happens after this meeting

Rules:
- Keep the total summary under 400 words
- Use direct, factual language
- If a speaker is unclear, note it as [unclear]
- Do not add information not in the transcript`,
    technique: "RTCO + Constraints",
    chapter: "ch04",
    chapterTitle: "Meeting Notes Summarizer",
  };

  const deptPrompt = department?.personalization.promptOfTheWeek;
  const prompt = deptPrompt
    ? { ...deptPrompt, week: "Week of March 31, 2026" }
    : defaultPrompt;

  return (
    <div
      className="rounded-xl overflow-hidden mb-8"
      style={{
        background: "linear-gradient(135deg, oklch(0.16 0.04 245), oklch(0.20 0.05 260))",
        border: "1px solid oklch(0.28 0.06 250)",
      }}
    >
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "oklch(0.65 0.14 250)" }}>
                Prompt of the Week
              </span>
              <span className="text-[10px] block" style={{ color: "oklch(0.55 0.05 260)" }}>
                {prompt.week}
              </span>
            </div>
          </div>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "oklch(0.30 0.06 250)", color: "oklch(0.75 0.12 250)" }}
          >
            {prompt.technique}
          </span>
        </div>

        <h3 className="text-base font-bold mb-1" style={{ color: "oklch(0.95 0.01 70)" }}>
          {prompt.title}
        </h3>
        <p className="text-xs leading-relaxed mb-3" style={{ color: "oklch(0.72 0.03 70)" }}>
          {prompt.description}
        </p>

        {expanded && (
          <div
            className="rounded-lg px-4 py-3 mb-3 text-xs leading-relaxed whitespace-pre-wrap"
            style={{
              background: "oklch(0.12 0.03 240)",
              border: "1px solid oklch(0.25 0.04 250)",
              color: "oklch(0.82 0.02 70)",
              fontFamily: "'Courier New', monospace",
            }}
          >
            {prompt.template}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: "oklch(0.45 0.14 250)",
              color: "oklch(0.98 0.01 70)",
            }}
          >
            {expanded ? "Hide Prompt" : "View Full Prompt"}
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(prompt.template);
            }}
            className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: "oklch(0.28 0.05 250)",
              color: "oklch(0.78 0.08 250)",
              border: "1px solid oklch(0.35 0.06 250)",
            }}
          >
            Copy
          </button>
          <button
            onClick={() => {
              localStorage.setItem("cookbook-builder-import", prompt.template);
              window.location.href = "/builder";
            }}
            className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: "oklch(0.28 0.05 250)",
              color: "oklch(0.78 0.08 250)",
              border: "1px solid oklch(0.35 0.06 250)",
            }}
          >
            Open in Builder
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  const [activeChapter, setActiveChapter] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tierDropdownOpen, setTierDropdownOpen] = useState(false);
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [showAllChapters, setShowAllChapters] = useState(false);
  const [selectedDept, setSelectedDeptState] = useState<Department | null>(() => {
    try {
      const stored = localStorage.getItem("cookbook-department");
      if (stored) return getDepartment(stored) || null;
    } catch { /* */ }
    return null;
  });
  const setSelectedDept = useCallback((dept: Department | null) => {
    setSelectedDeptState(dept);
    try {
      if (dept) localStorage.setItem("cookbook-department", dept.id);
      else localStorage.removeItem("cookbook-department");
    } catch { /* */ }
    // Notify App-level listeners (storage event only fires cross-tab)
    window.dispatchEvent(new Event("cookbook-department-changed"));
  }, []);
  const tierRef = useRef<HTMLDivElement>(null);

  const { recentItems, addRecentItem, clearRecent } = useRecentlyViewed();
  const { persona, setPersona } = usePersona();
  const { completedTests, currentTier, tierLabel, markComplete, resetTests } = useTasteTests();

  // Close tier dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tierRef.current && !tierRef.current.contains(e.target as Node)) {
        setTierDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

  const handleOpenTest = useCallback((testId: string) => {
    setActiveTestId(testId);
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

  const activeTest = activeTestId ? tasteTests.find((t) => t.id === activeTestId) : null;

  return (
    <div className="flex min-h-screen" style={{ background: "oklch(0.97 0.008 75)" }}>
      {/* Sidebar */}
      <Sidebar
        activeChapter={activeChapter}
        onSelectChapter={handleSelectChapter}
        recentItems={recentItems}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        completedTests={completedTests}
        onOpenTest={handleOpenTest}
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

              {/* Department banner + Tier badge row */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                {/* Department indicator */}
                <div className="flex-1">
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

                {/* Tier badge */}
                <div className="relative flex-shrink-0" ref={tierRef}>
                  <button
                    onClick={() => setTierDropdownOpen(!tierDropdownOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                    style={{
                      background: "oklch(0.22 0.03 45)",
                      color: "oklch(0.78 0.12 55)",
                      border: "1px solid oklch(0.32 0.04 45)",
                    }}
                  >
                    <TierStar tier={currentTier} />
                    {tierLabel}
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {/* Tier dropdown */}
                  {tierDropdownOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-xl z-50 overflow-hidden"
                      style={{
                        background: "oklch(0.998 0.002 70)",
                        border: "1px solid oklch(0.90 0.01 70)",
                      }}
                    >
                      <div className="px-4 py-3" style={{ borderBottom: "1px solid oklch(0.92 0.01 70)" }}>
                        <p className="text-xs font-semibold" style={{ color: "oklch(0.30 0.03 40)" }}>
                          Your Progress
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: "oklch(0.55 0.04 50)" }}>
                          {completedTests.length} of {tasteTests.length} taste tests passed
                        </p>
                      </div>
                      <div className="py-1">
                        {tierLabels.map((label, i) => {
                          const isCurrent = i === currentTier;
                          const isUnlocked = i <= currentTier;
                          return (
                            <div
                              key={label}
                              className="flex items-center gap-2 px-4 py-2"
                              style={{
                                background: isCurrent ? "oklch(0.55 0.12 45 / 0.08)" : "transparent",
                                opacity: isUnlocked ? 1 : 0.4,
                              }}
                            >
                              <TierStar tier={i} />
                              <span
                                className="text-xs font-medium"
                                style={{
                                  color: isCurrent ? "oklch(0.40 0.10 45)" : "oklch(0.45 0.03 48)",
                                }}
                              >
                                {label}
                              </span>
                              {isCurrent && (
                                <span
                                  className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded"
                                  style={{
                                    background: "oklch(0.55 0.12 45 / 0.15)",
                                    color: "oklch(0.45 0.12 45)",
                                  }}
                                >
                                  Current
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {completedTests.length > 0 && (
                        <div className="px-4 py-2" style={{ borderTop: "1px solid oklch(0.92 0.01 70)" }}>
                          <button
                            onClick={() => {
                              resetTests();
                              setTierDropdownOpen(false);
                            }}
                            className="text-[10px] font-medium"
                            style={{ color: "oklch(0.55 0.15 25)" }}
                          >
                            Reset progress
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Hero */}
              <HeroSection greeting={selectedDept?.personalization.heroGreeting || persona?.greeting} />

              {/* Quick Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  // Department-specific descriptions
                  const deptDesc = selectedDept?.personalization.quickActions;
                  const desc = deptDesc
                    ? (action.href === "/game" ? deptDesc.lab : action.href === "/builder" ? deptDesc.builder : deptDesc.resources)
                    : action.desc;
                  return (
                    <button
                      key={action.href}
                      onClick={() => navigate(action.href)}
                      className="group flex flex-col gap-3 p-5 rounded-xl text-left transition-all"
                      style={{
                        background: action.bg,
                        border: `1px solid ${action.border}`,
                        boxShadow: "0 2px 8px oklch(0.10 0.02 38 / 0.20)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 30px oklch(0.08 0.02 38 / 0.30)";
                        (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px oklch(0.10 0.02 38 / 0.20)";
                        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                      }}
                    >
                      <Icon className="w-7 h-7" style={{ color: action.color }} />
                      <div className="flex-1">
                        <p className="text-sm font-bold mb-0.5" style={{ color: "oklch(0.95 0.01 70)" }}>
                          {action.label}
                        </p>
                        <p className="text-xs leading-relaxed" style={{ color: "oklch(0.68 0.03 70)" }}>
                          {desc}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold" style={{ color: action.color }}>
                        Go
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Prompt of the Week */}
              <PromptOfTheWeek department={selectedDept} />

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
                              window.location.href = "/builder";
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
                <div key={group.partId}>
                  <SectionDivider partId={group.partId} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-center">
                    {group.chapters.map((ch, i) => (
                      <RecipeCard
                        key={ch.id}
                        chapter={ch}
                        onClick={() => handleSelectChapter(ch.id)}
                        index={i}
                      />
                    ))}
                  </div>
                </div>
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
                          <div key={group.partId}>
                            <SectionDivider partId={group.partId} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-center">
                              {group.chapters.map((ch, i) => (
                                <RecipeCard
                                  key={ch.id}
                                  chapter={ch}
                                  onClick={() => handleSelectChapter(ch.id)}
                                  index={i}
                                />
                              ))}
                            </div>
                          </div>
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
                <div key={group.partId}>
                  <SectionDivider partId={group.partId} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-center">
                    {group.chapters.map((ch, i) => (
                      <RecipeCard
                        key={ch.id}
                        chapter={ch}
                        onClick={() => handleSelectChapter(ch.id)}
                        index={i}
                      />
                    ))}
                  </div>
                </div>
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
                <p className="text-xs mt-1" style={{ color: "oklch(0.60 0.03 55)" }}>
                  Compiled March 2026
                </p>
              </footer>
            </>
          )}
        </div>
      </main>

      {/* Taste Test Modal */}
      <AnimatePresence>
        {activeTest && (
          <TasteTestModal
            key={activeTest.id}
            test={activeTest}
            onClose={() => setActiveTestId(null)}
            onPass={markComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/** Small star indicator per tier level */
function TierStar({ tier }: { tier: number }) {
  const stars = ["🌱", "🍳", "🔪", "👨‍🍳", "⭐"];
  return <span className="text-sm leading-none">{stars[tier] || stars[0]}</span>;
}
