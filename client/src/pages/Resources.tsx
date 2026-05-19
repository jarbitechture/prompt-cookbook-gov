import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  ExternalLink,
  Globe,
  Building2,
  Home,
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { jumpstartChapters, promptRecipes } from "../lib/cookbook-resources";

const ACCENT = "oklch(0.42 0.14 300)";
const ACCENT_LIGHT = "oklch(0.94 0.04 300)";
const CARD_BG = "oklch(0.998 0.002 70)";
const CARD_BORDER = "oklch(0.92 0.01 70)";
const PAGE_BG = "oklch(0.97 0.008 75)";
const TEXT_PRIMARY = "oklch(0.22 0.03 40)";
const TEXT_SECONDARY = "oklch(0.48 0.03 50)";
const TEXT_MUTED = "oklch(0.50 0.04 50)";

const DIFFICULTY_COLORS: Record<string, { text: string; bg: string }> = {
  Beginner: { text: "oklch(0.42 0.14 155)", bg: "oklch(0.94 0.03 155)" },
  Intermediate: { text: "oklch(0.48 0.12 220)", bg: "oklch(0.94 0.03 220)" },
  Advanced: { text: "oklch(0.42 0.14 300)", bg: "oklch(0.94 0.03 300)" },
  "All Levels": { text: "oklch(0.50 0.10 75)", bg: "oklch(0.94 0.04 75)" },
};

type TabId = "courses" | "government" | "internal" | "recipes";


const govResources = [
  { title: "GovAI Coalition", description: "National coalition for responsible AI adoption in government.", url: "https://govai.org" },
  { title: "NACo AI County Compass", description: "National Association of Counties AI toolkit for county governments.", url: "https://www.naco.org/resources/ai" },
  { title: "NIST AI Risk Management Framework", description: "Federal AI risk framework (AI RMF 1.0) — a widely used framework for managing AI risk in organizations.", url: "https://www.nist.gov/artificial-intelligence" },
  { title: "White House AI Bill of Rights", description: "Blueprint for responsible AI use in public services.", url: "https://www.whitehouse.gov/ostp/ai-bill-of-rights/" },
  { title: "Florida Digital Service", description: "State of Florida AI policy and digital government initiatives", url: "https://digital.fl.gov" },
];

const internalResources = [
  {
    title: "AI Working Group",
    description: "The MCG AI Working Group coordinates AI adoption across all county departments, develops training, and maintains the AI Governance Handbook.",
    url: "https://mymanatee.sharepoint.com/sites/AIWorkingGroup/SitePages/TrainingHome.aspx",
    details: [
      "Meets bi-weekly on Teams — open to all county employees",
      "Managed by the Information Technology Services (ITS) Department",
      "Contact: itservices@mymanatee.org",
      "Current focus: prompt engineering fluency, AI policy compliance, and department-specific use cases",
    ],
    icon: "🤝",
  },
  {
    title: "AI Governance — Key Policies",
    // TODO(handbook-version): restore an official Governance Handbook version/status once confirmed by the user — do not invent.
    description: "Quick policy reference for county AI use, aligned with widely used public-sector frameworks such as NIST AI RMF and Florida state policy.",
    details: [
      "Approved tools: Microsoft Copilot (county license) and ChatGPT (non-confidential use only)",
      "Never put PII, HIPAA data, law enforcement records, or Sunshine Law-covered deliberations into any AI tool",
      "All AI-generated content must be human-reviewed before external distribution",
      "Report concerns to your department director or ITS (itservices@mymanatee.org)",
    ],
    icon: "📋",
  },
  {
    title: "Request AI Training",
    description: "Request a custom AI training session for your team or department. Sessions are led by the AI Working Group and can be tailored to your specific workflows.",
    details: [
      "Format options: 30-min lunch-and-learn · 1-hour hands-on workshop · Half-day deep dive",
      "Available topics: Prompt engineering basics · Department-specific use cases · Prompt Builder walkthrough · AI policy and responsible use · Advanced techniques (CoT, RTCO, task chaining)",
      "Who can request: Any department director, team lead, or supervisor on behalf of their team",
      "Minimum group size: 5 participants per session",
      "Lead time: Submit requests at least 2 weeks before your preferred date",
      "How to request: Email the AI Working Group (ai-workgroup@mymanatee.org) with: your name, department, preferred format, topic, team size, and 2-3 available dates",
      "Post-training support: Participants receive access to the Prompt Cookbook app, a quick-reference card, and one 30-min follow-up Q&A session",
    ],
    icon: "🎓",
  },
  {
    title: "Persona & Content Notice",
    description: "All personas in this cookbook are fictional examples used for illustration. Any resemblance to real Manatee County employees is coincidental unless explicitly attributed.",
    details: [
      "Names, roles, and scenarios in each chapter are invented for instructional purposes only",
      "No real county employee data was used to create cookbook content",
      "PII audit on file: docs/persona-audit-2026-05-13.md (reviewed 2026-05-13)",
      "Questions or concerns: itservices@mymanatee.org",
    ],
    icon: "🔒",
  },
];

const tabs: { id: TabId; label: string; icon: typeof BookOpen }[] = [
  { id: "courses", label: "Courses", icon: GraduationCap },
  { id: "government", label: "Government", icon: Globe },
  { id: "internal", label: "Internal", icon: Building2 },
  { id: "recipes", label: "Recipes", icon: BookOpen },
];

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function Resources() {
  const initialTab = (() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("tab") as TabId | null;
      if (t && tabs.some((tab) => tab.id === t)) return t;
      const stored = localStorage.getItem("cookbook-resources-tab") as TabId | null;
      if (stored && tabs.some((tab) => tab.id === stored)) {
        localStorage.removeItem("cookbook-resources-tab");
        return stored;
      }
    } catch { /* ignore */ }
    return "courses" as TabId;
  })();
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  return (
    <div className="min-h-screen" style={{ background: PAGE_BG }}>
      {/* Sticky header */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3"
        style={{
          background: "oklch(0.97 0.008 75 / 0.95)",
          backdropFilter: "blur(8px)",
          borderBottom: `1px solid oklch(0.90 0.02 75)`,
        }}
      >
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm font-medium" style={{ color: TEXT_MUTED }}>
            Cookbook
          </Link>
          <ChevronRight className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.03 55)" }} />
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="font-serif font-bold text-sm" style={{ color: TEXT_PRIMARY }}>
              Resource Board
            </span>
          </div>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{ background: "oklch(0.94 0.01 70)", color: TEXT_MUTED, textDecoration: "none" }}
        >
          <Home className="w-3.5 h-3.5" />
          Home
        </Link>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Compact Hero */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mb-8"
        >
          <motion.div variants={fadeUp} className="mb-5">
            <h1
              className="font-serif text-2xl sm:text-3xl font-bold mb-2"
              style={{ color: TEXT_PRIMARY }}
            >
              Resource Board
            </h1>
            <p className="text-sm sm:text-base max-w-2xl" style={{ color: TEXT_SECONDARY }}>
              Courses, tools, and references for building AI fluency across Manatee County government.
            </p>
          </motion.div>

        </motion.section>


        {/* Tab navigation */}
        <div
          className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto"
          style={{ background: "oklch(0.94 0.01 70)" }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all duration-200"
                style={{
                  background: isActive ? CARD_BG : "transparent",
                  color: isActive ? TEXT_PRIMARY : TEXT_SECONDARY,
                  boxShadow: isActive ? "0 1px 4px oklch(0.18 0.02 38 / 0.08)" : "none",
                }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === "courses" && (
            <motion.div
              key="courses"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-10"
            >
              <CoursesTab />
            </motion.div>
          )}
          {activeTab === "government" && (
            <motion.div
              key="government"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <GovernmentTab />
            </motion.div>
          )}
          {activeTab === "internal" && (
            <motion.div
              key="internal"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <InternalTab />
            </motion.div>
          )}
          {activeTab === "recipes" && (
            <motion.div
              key="recipes"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <RecipesTab />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Featured: Request AI Training — lifted out of the Internal tab */}
        <TrainingRequest />

        {/* Footer */}
        <footer className="pt-8 pb-8 mt-10 text-center" style={{ borderTop: `1px solid oklch(0.90 0.02 75)` }}>
          <p className="text-xs" style={{ color: TEXT_MUTED }}>
            AI Working Group Resource Board — Manatee County Government
          </p>
        </footer>
      </main>
    </div>
  );
}

/* ─── Courses Tab ────────────────────────────────────────────────────────── */

// Group the 14 foundation lessons into themed collapsible pick-lists so the
// page is short by default — pick a theme, then a lesson.
const FOUNDATION_GROUPS: { label: string; blurb: string; icon: string; idxs: number[] }[] = [
  { label: "Start Here — the Basics", blurb: "Mindset + the RTCO formula", icon: "🚀", idxs: [0, 1] },
  { label: "Core Techniques", blurb: "Persona, examples, reasoning, guardrails", icon: "🧩", idxs: [2, 3, 4, 7] },
  { label: "Shaping & Refining Output", blurb: "Formatting, iteration, task chaining", icon: "🪄", idxs: [5, 6, 8] },
  { label: "Apply, Test & Master", blurb: "Templates, images, testing, the capstone", icon: "🏆", idxs: [9, 10, 11, 12, 13] },
];

function CoursesTab() {
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);
  const [openGroup, setOpenGroup] = useState<number | null>(0);

  return (
    <>
      {/* Jumpstart Course */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: ACCENT_LIGHT }}
          >
            <GraduationCap className="w-4.5 h-4.5" style={{ color: ACCENT }} />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold leading-tight" style={{ color: TEXT_PRIMARY }}>
              Cookbook Foundations
            </h2>
            <p className="text-xs" style={{ color: TEXT_SECONDARY }}>{jumpstartChapters.length} lessons — click any to read</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {FOUNDATION_GROUPS.map((group, gi) => {
            const groupOpen = openGroup === gi;
            return (
              <div
                key={group.label}
                className="rounded-xl overflow-hidden"
                style={{
                  background: CARD_BG,
                  border: `1px solid ${groupOpen ? ACCENT : CARD_BORDER}`,
                  transition: "border-color 0.2s",
                }}
              >
                <button
                  onClick={() => setOpenGroup(groupOpen ? null : gi)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  <span className="text-lg flex-shrink-0">{group.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm" style={{ color: TEXT_PRIMARY }}>
                      {group.label}
                    </h3>
                    <p className="text-[11px]" style={{ color: TEXT_SECONDARY }}>
                      {group.blurb} · {group.idxs.length} lessons
                    </p>
                  </div>
                  <ChevronRight
                    className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
                    style={{ color: TEXT_MUTED, transform: groupOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                  />
                </button>
                <AnimatePresence>
                  {groupOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-2 pb-2 space-y-2">
                        {group.idxs.map((i) => {
                          const ch = jumpstartChapters[i];
                          const isOpen = expandedLesson === i;
                          return (
              <motion.div
                key={ch.title}
                variants={fadeUp}
                className="rounded-xl overflow-hidden"
                style={{
                  background: CARD_BG,
                  border: isOpen ? `1px solid ${ACCENT}` : `1px solid ${CARD_BORDER}`,
                  transition: "border-color 0.2s",
                }}
              >
                {/* Collapsed header */}
                <button
                  onClick={() => setExpandedLesson(isOpen ? null : i)}
                  className="w-full flex items-center gap-3 p-3 text-left"
                >
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black tabular-nums flex-shrink-0"
                    style={{ background: isOpen ? ACCENT : "oklch(0.92 0.02 300)", color: isOpen ? "white" : ACCENT }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm leading-snug" style={{ color: TEXT_PRIMARY }}>
                      {ch.title}
                    </h4>
                    <p className="text-[11px]" style={{ color: ACCENT }}>
                      {ch.subtitle}
                    </p>
                  </div>
                  <ChevronRight
                    className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
                    style={{
                      color: TEXT_MUTED,
                      transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                    }}
                  />
                </button>

                {/* Expanded lesson content */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0">
                        {/* Description */}
                        <p className="text-xs leading-relaxed mb-3" style={{ color: TEXT_SECONDARY }}>
                          {ch.description}
                        </p>
                        {/* Lesson content */}
                        <div
                          className="rounded-lg p-4 text-[13px] leading-relaxed whitespace-pre-wrap"
                          style={{
                            background: "oklch(0.97 0.005 75)",
                            color: "oklch(0.28 0.03 40)",
                            border: `1px solid oklch(0.92 0.01 70)`,
                          }}
                        >
                          {ch.lesson}
                        </div>
                        {/* Workshop actions — directed to specific app features */}
                        <div
                          className="rounded-lg p-3 mt-3 flex flex-wrap items-center gap-2"
                          style={{ background: "oklch(0.94 0.02 250 / 0.3)", border: "1px solid oklch(0.88 0.03 250)" }}
                        >
                          <span className="text-[11px] font-bold" style={{ color: "oklch(0.35 0.08 250)" }}>
                            Try it now:
                          </span>
                          {ch.chapterId && (
                            <Link
                              href={`/#${ch.chapterId}`}
                              className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md"
                              style={{ background: ACCENT, color: "white" }}
                            >
                              📖 Read Recipe
                            </Link>
                          )}
                          {/* Cross-bundle nav: plain <a>; onClick pre-loads template then navigates */}
                          <a
                            href="/builder/"
                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md"
                            style={{ background: "oklch(0.48 0.12 220)", color: "white", textDecoration: "none" }}
                            onClick={() => {
                              try {
                                // Pre-load a relevant template into the builder
                                const template = ch.lesson.split("\n").find((l: string) => l.includes("Role:") || l.includes("Task:")) || "";
                                if (template) localStorage.setItem("cookbook-builder-import", template);
                              } catch {}
                            }}
                          >
                            🔨 Build a Prompt
                          </a>
                          <Link
                            href="/game"
                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md"
                            style={{ background: "oklch(0.42 0.14 155)", color: "white" }}
                          >
                            🧪 Practice in Lab
                          </Link>
                          {!ch.chapterId && (
                            <Link
                              href="/game"
                              className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md"
                              style={{ background: "oklch(0.50 0.14 75)", color: "white" }}
                            >
                              🏆 Try Capstone
                            </Link>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

/* ─── Government Tab ─────────────────────────────────────────────────────── */

function GovernmentTab() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      {govResources.map((res) => (
        <motion.a
          key={res.title}
          href={res.url}
          target="_blank"
          rel="noopener noreferrer"
          variants={fadeUp}
          whileHover={{ y: -3, boxShadow: "0 8px 24px oklch(0.18 0.02 38 / 0.08)" }}
          className="rounded-xl p-5 flex items-start gap-4 group"
          style={{
            background: CARD_BG,
            border: `1px solid ${CARD_BORDER}`,
            transition: "box-shadow 0.2s, transform 0.2s",
          }}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: ACCENT_LIGHT }}
          >
            <Globe className="w-5 h-5" style={{ color: ACCENT }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <h4 className="font-bold text-sm group-hover:underline" style={{ color: TEXT_PRIMARY }}>
                {res.title}
              </h4>
              <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: ACCENT }} />
            </div>
            <p className="text-xs leading-relaxed" style={{ color: TEXT_SECONDARY }}>
              {res.description}
            </p>
          </div>
        </motion.a>
      ))}
    </motion.div>
  );
}

/* ─── Recipes Tab ───────────────────────────────────────────────────────── */


const RECIPE_CATEGORY_COLORS: Record<string, { pill: string; pillBg: string; border: string }> = {
  "Writing":     { pill: "oklch(0.50 0.14 75)", pillBg: "oklch(0.94 0.04 75)", border: "oklch(0.88 0.04 75)" },
  "Analysis":    { pill: "oklch(0.48 0.12 220)", pillBg: "oklch(0.94 0.03 220)", border: "oklch(0.88 0.03 220)" },
  "Data":        { pill: "oklch(0.42 0.14 155)", pillBg: "oklch(0.94 0.03 155)", border: "oklch(0.88 0.03 155)" },
  "Planning":    { pill: "oklch(0.45 0.12 300)", pillBg: "oklch(0.94 0.03 300)", border: "oklch(0.88 0.03 300)" },
  "County Work": { pill: "oklch(0.48 0.08 45)", pillBg: "oklch(0.94 0.02 45)", border: "oklch(0.88 0.02 45)" },
};

function RecipesTab() {
  const [, navigate] = useLocation();
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const categories = Array.from(new Set(promptRecipes.map((r) => r.category)));

  const handleUseInBuilder = (template: string) => {
    try {
      localStorage.setItem("cookbook-builder-import", template);
    } catch { /* ignore */ }
    navigate("/builder");
  };

  const handleCopy = (template: string, idx: number) => {
    navigator.clipboard.writeText(template).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-8"
    >
      {categories.map((category) => {
        const colors = RECIPE_CATEGORY_COLORS[category] || RECIPE_CATEGORY_COLORS["Writing"];
        const recipes = promptRecipes.filter((r) => r.category === category);
        return (
          <motion.section key={category} variants={fadeUp}>
            <h3
              className="font-serif text-lg font-bold mb-3"
              style={{ color: TEXT_PRIMARY }}
            >
              {category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recipes.map((recipe) => {
                const globalIdx = promptRecipes.indexOf(recipe);
                const isCopied = copiedIdx === globalIdx;
                return (
                  <motion.div
                    key={recipe.title}
                    variants={fadeUp}
                    whileHover={{ y: -3, boxShadow: "0 8px 24px oklch(0.18 0.02 38 / 0.08)" }}
                    className="rounded-xl p-4 flex flex-col"
                    style={{
                      background: CARD_BG,
                      border: `1px solid ${colors.border}`,
                      transition: "box-shadow 0.2s, transform 0.2s",
                    }}
                  >
                    <span
                      className="inline-flex self-start text-[10px] font-bold px-2 py-0.5 rounded-full mb-2"
                      style={{ background: colors.pillBg, color: colors.pill }}
                    >
                      {category}
                    </span>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{(recipe as any).icon || "📝"}</span>
                      <h4 className="font-bold text-sm" style={{ color: TEXT_PRIMARY }}>
                        {recipe.title}
                      </h4>
                    </div>
                    <p
                      className="text-xs font-mono leading-relaxed mb-4 flex-1"
                      style={{ color: TEXT_MUTED, whiteSpace: "pre-wrap" }}
                    >
                      {recipe.template.length > 80 ? recipe.template.slice(0, 80) + "..." : recipe.template}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUseInBuilder(recipe.template)}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:shadow-sm"
                        style={{ background: ACCENT, color: "white" }}
                      >
                        <ArrowRight className="w-3 h-3" />
                        Use in Builder
                      </button>
                      <button
                        onClick={() => handleCopy(recipe.template, globalIdx)}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:shadow-sm"
                        style={{
                          background: CARD_BG,
                          color: TEXT_SECONDARY,
                          border: `1px solid ${CARD_BORDER}`,
                        }}
                      >
                        {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {isCopied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        );
      })}
    </motion.div>
  );
}

/* ─── Internal Tab ───────────────────────────────────────────────────────── */

// Submissions open the user's mail client with all fields prefilled,
// addressed to TRAINING_RECIPIENT. The user reviews and clicks Send in their mail app.
const TRAINING_RECIPIENT = "elliot.jarbe@mymanatee.org";

// Featured, page-level training request — lifted out of the Internal tab so
// it is the first thing staff see and use on /resources (centered card).
function TrainingRequest() {
  const [formData, setFormData] = useState({ name: "", email: "", department: "", format: "1-hour workshop", topic: "", teamSize: "", preferredDates: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestText, setRequestText] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const subject = `Cookbook Training Request — ${formData.department || "department TBD"}`;
    const body = [
      `Name: ${formData.name}`,
      `Email: ${formData.email}`,
      `Department: ${formData.department}`,
      `Team Size: ${formData.teamSize}`,
      `Format: ${formData.format}`,
      `Preferred Dates: ${formData.preferredDates || "(none specified)"}`,
      `Topics of Interest: ${formData.topic || "(none specified)"}`,
      "",
      "Additional Notes:",
      formData.notes || "(none)",
      "",
      `Submitted: ${new Date().toLocaleString()}`,
    ].join("\n");
    setRequestText(`To: ${TRAINING_RECIPIENT}\nSubject: ${subject}\n\n${body}`);
    window.location.href = `mailto:${TRAINING_RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
    setSubmitting(false);
  };

  const inputStyle = {
    background: "oklch(0.97 0.005 75)",
    border: `1px solid ${CARD_BORDER}`,
    color: TEXT_PRIMARY,
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "13px",
    width: "100%",
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-2xl mx-auto mt-12 rounded-2xl overflow-hidden"
      style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, boxShadow: "0 6px 28px oklch(0.18 0.02 38 / 0.10)" }}
    >
      <div className="px-6 py-5 text-center" style={{ borderBottom: `1px solid ${CARD_BORDER}` }}>
        <span className="text-3xl block mb-1">🎓</span>
        <h2 className="font-serif text-xl font-bold" style={{ color: TEXT_PRIMARY }}>Request AI Training</h2>
        <p className="text-xs mt-1" style={{ color: TEXT_SECONDARY }}>Get a session tailored to your team — led by the AI Working Group.</p>
      </div>
      <div className="px-6 pb-6 pt-5">
        {submitted ? (
          <div className="rounded-lg p-6 text-center" style={{ background: "oklch(0.96 0.02 145)" }}>
            <span className="text-3xl block mb-2">✅</span>
            <p className="text-sm font-bold" style={{ color: "oklch(0.30 0.10 145)" }}>Email prepared in your mail client</p>
            <p className="text-xs mt-1" style={{ color: TEXT_SECONDARY }}>Review the prefilled email and click <strong>Send</strong>. The AI Working Group follows up within 5 business days.</p>
            <p className="text-xs mt-2" style={{ color: TEXT_SECONDARY }}>Mail app didn't open? Copy the full request and email it to <strong>{TRAINING_RECIPIENT}</strong>:</p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(requestText).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
              className="mt-2 text-xs font-bold px-4 py-2 rounded-lg"
              style={{ background: "oklch(0.45 0.12 145)", color: "oklch(0.98 0.01 70)" }}
            >
              {copied ? "Copied ✓" : "Copy request"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold block mb-1" style={{ color: TEXT_SECONDARY }}>Your Name *</label>
                <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={inputStyle} placeholder="Jane Smith" />
              </div>
              <div>
                <label className="text-[11px] font-bold block mb-1" style={{ color: TEXT_SECONDARY }}>Email *</label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={inputStyle} placeholder="jane.smith@mymanatee.org" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold block mb-1" style={{ color: TEXT_SECONDARY }}>Department *</label>
                <input required value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} style={inputStyle} placeholder="e.g. Public Works" />
              </div>
              <div>
                <label className="text-[11px] font-bold block mb-1" style={{ color: TEXT_SECONDARY }}>Team Size *</label>
                <input required value={formData.teamSize} onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })} style={inputStyle} placeholder="e.g. 12 people" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold block mb-1" style={{ color: TEXT_SECONDARY }}>Format</label>
                <select value={formData.format} onChange={(e) => setFormData({ ...formData, format: e.target.value })} style={inputStyle}>
                  <option>30-min lunch-and-learn</option>
                  <option>1-hour workshop</option>
                  <option>Half-day deep dive</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold block mb-1" style={{ color: TEXT_SECONDARY }}>Preferred Dates</label>
                <input value={formData.preferredDates} onChange={(e) => setFormData({ ...formData, preferredDates: e.target.value })} style={inputStyle} placeholder="e.g. Week of April 14" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold block mb-1" style={{ color: TEXT_SECONDARY }}>Topics of Interest</label>
              <input value={formData.topic} onChange={(e) => setFormData({ ...formData, topic: e.target.value })} style={inputStyle} placeholder="e.g. Prompt basics, department-specific use cases" />
            </div>
            <div>
              <label className="text-[11px] font-bold block mb-1" style={{ color: TEXT_SECONDARY }}>Additional Notes</label>
              <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" as const }} placeholder="Any other details..." />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all mx-auto"
              style={{ background: ACCENT, color: "white", opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? "Submitting..." : "Submit Training Request"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </motion.section>
  );
}

function InternalTab() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-4">
      {/* Info cards */}
      {internalResources.slice(0, 2).map((res, i) => (
        <motion.div key={res.title} variants={fadeUp} className="rounded-xl overflow-hidden" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
          <button onClick={() => setExpanded(expanded === i ? null : i)} className="w-full flex items-center gap-4 px-5 py-4 text-left">
            <span className="text-2xl flex-shrink-0">{res.icon}</span>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm" style={{ color: TEXT_PRIMARY }}>{res.title}</h4>
              <p className="text-xs leading-relaxed mt-0.5" style={{ color: TEXT_SECONDARY }}>{res.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 flex-shrink-0 transition-transform duration-200" style={{ color: TEXT_MUTED, transform: expanded === i ? "rotate(90deg)" : "rotate(0deg)" }} />
          </button>
          <AnimatePresence>
            {expanded === i && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="px-5 pb-4 pt-0">
                  <div className="rounded-lg p-4 space-y-2" style={{ background: "oklch(0.96 0.005 75)" }}>
                    {res.details.map((detail, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <span className="text-xs mt-0.5" style={{ color: ACCENT }}>•</span>
                        <p className="text-xs leading-relaxed" style={{ color: TEXT_SECONDARY }}>{detail}</p>
                      </div>
                    ))}
                    {(res as { url?: string }).url && (
                      <a
                        href={(res as { url?: string }).url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold pt-1"
                        style={{ color: ACCENT }}
                      >
                        Open in SharePoint →
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </motion.div>
  );
}
