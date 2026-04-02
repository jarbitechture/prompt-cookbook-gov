import {
  ArrowLeft,
  ArrowRight,
  Share2,
  BookOpen,
  Lightbulb,
  User,
  AlertTriangle,
  Shield,
  Zap,
  GraduationCap,
  FileText,
  Copy,
  Check,
  Star,
  ShieldCheck,
  ChefHat,
  ChevronDown,
  Heart,
  Wrench,
  Info,
  Sparkles,
  Clock,
  Printer,
} from "lucide-react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import type { Chapter } from "@/lib/cookbookData";
import { chapters } from "@/lib/cookbookData";
import TryItSection from "./TryItSection";
import ImageLightbox from "./ImageLightbox";
import { toast } from "sonner";

interface ChapterDetailProps {
  chapter: Chapter;
  onBack: () => void;
}

const partThemes: Record<string, {
  accent: string;
  accentLight: string;
  headerBg: string;
  headerBorder: string;
  icon: typeof BookOpen;
  sectionLabel: string;
  catalogPrefix: string;
}> = {
  part1: {
    accent: "oklch(0.52 0.10 42)",
    accentLight: "oklch(0.96 0.015 55)",
    headerBg: "linear-gradient(135deg, oklch(0.97 0.012 65) 0%, oklch(0.99 0.005 70) 100%)",
    headerBorder: "oklch(0.90 0.025 60)",
    icon: BookOpen,
    sectionLabel: "Foundation",
    catalogPrefix: "FND",
  },
  part2: {
    accent: "oklch(0.48 0.12 220)",
    accentLight: "oklch(0.96 0.012 220)",
    headerBg: "linear-gradient(135deg, oklch(0.97 0.008 220) 0%, oklch(0.99 0.003 210) 100%)",
    headerBorder: "oklch(0.90 0.018 220)",
    icon: Zap,
    sectionLabel: "Template",
    catalogPrefix: "TPL",
  },
  part3: {
    accent: "oklch(0.50 0.14 155)",
    accentLight: "oklch(0.96 0.015 155)",
    headerBg: "linear-gradient(135deg, oklch(0.97 0.010 155) 0%, oklch(0.99 0.004 150) 100%)",
    headerBorder: "oklch(0.90 0.020 155)",
    icon: Shield,
    sectionLabel: "Strategy",
    catalogPrefix: "STR",
  },
  part4: {
    accent: "oklch(0.52 0.12 280)",
    accentLight: "oklch(0.96 0.012 280)",
    headerBg: "linear-gradient(135deg, oklch(0.97 0.008 280) 0%, oklch(0.99 0.003 270) 100%)",
    headerBorder: "oklch(0.90 0.015 280)",
    icon: GraduationCap,
    sectionLabel: "Governance",
    catalogPrefix: "GOV",
  },
};

const diffBadges: Record<string, { label: string; classes: string }> = {
  beginner: { label: "Beginner", classes: "bg-emerald-100 text-emerald-700" },
  intermediate: { label: "Intermediate", classes: "bg-amber-100 text-amber-700" },
  advanced: { label: "Advanced", classes: "bg-rose-100 text-rose-700" },
};

const riskLabels: Record<string, { label: string; color: string; bg: string }> = {
  green: { label: "Low Risk", color: "oklch(0.45 0.12 150)", bg: "oklch(0.94 0.03 150)" },
  yellow: { label: "Mid Risk", color: "oklch(0.50 0.14 75)", bg: "oklch(0.94 0.04 75)" },
  red: { label: "High Risk", color: "oklch(0.48 0.16 25)", bg: "oklch(0.94 0.04 25)" },
};

const fadeTransition: Transition = { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] };
const delayedTransition = (delay: number): Transition => ({ duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay });

const BOOKMARKS_KEY = "cookbook-bookmarks";

function getBookmarks(): string[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function toggleBookmark(id: string): boolean {
  const current = getBookmarks();
  const idx = current.indexOf(id);
  if (idx >= 0) {
    current.splice(idx, 1);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(current));
    return false;
  }
  current.push(id);
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(current));
  return true;
}

function getCatalogId(part: string, chapterNumber: number): string {
  const theme = partThemes[part];
  const prefix = theme?.catalogPrefix ?? "UNK";
  const partChapters = chapters.filter((c) => c.part === part);
  const partIndex = partChapters.findIndex((c) => c.number === chapterNumber);
  const num = partIndex >= 0 ? partIndex + 1 : chapterNumber;
  return `${prefix}-${String(num).padStart(2, "0")}`;
}

// Detect Before/After pairs in prompt examples
function extractBeforeAfter(examples: string[]): { before: string; after: string } | null {
  for (let i = 0; i < examples.length - 1; i++) {
    const a = examples[i];
    const b = examples[i + 1];
    if (/^(before|weak|inefficient|unsafe|bad|without|prohibited)/i.test(a.trim()) ||
        /^(after|improved|efficient|safe|good|with|allowed)/i.test(b.trim())) {
      return { before: a, after: b };
    }
  }
  const combined = examples.find(e => /before:/i.test(e) && /after:/i.test(e));
  if (combined) {
    const beforeMatch = combined.match(/before:\s*(.+?)(?=\nafter:|$)/is);
    const afterMatch = combined.match(/after:\s*(.+?)$/is);
    if (beforeMatch && afterMatch) {
      return { before: beforeMatch[1].trim(), after: afterMatch[1].trim() };
    }
  }
  return null;
}

// Extract a label from a prompt example string (e.g. "Text-to-Text: ..." -> "TEXT-TO-TEXT")
function extractPromptLabel(example: string): string | null {
  const match = example.match(/^([^:]{3,40}):\s/);
  if (match) return match[1].toUpperCase();
  return null;
}

// ─── Content paragraph classification ───

type ParagraphType = "tip" | "steps" | "comparison" | "warning" | "stat" | "normal";

interface ClassifiedParagraph {
  type: ParagraphType;
  heading: string | null;
  body: string;
  raw: string;
}

function classifyParagraph(text: string): ParagraphType {
  if (/\b(Tip:|Kitchen Tip:)/i.test(text)) return "tip";
  if (/\b(Warning:|Important:|Safety:)/i.test(text)) return "warning";
  if (/^Step \d/i.test(text) || /(?:^|\n)\s*\d+\.\s/m.test(text)) return "steps";
  if (/(Before:|After:|Vague\b.*\bSpecific\b|Weak\b.*\bStrong\b)/i.test(text)) return "comparison";
  if (/Quality score:/i.test(text)) return "stat";
  return "normal";
}

function extractHeading(text: string): { heading: string | null; body: string } {
  // Check if text starts with a short sentence ending in colon or period
  const match = text.match(/^(.{8,58}?[:.])(\s+)/);
  if (match) {
    const candidate = match[1];
    // Avoid picking up numbered lists or full sentences as headings
    if (!/^\d+\./.test(candidate) && candidate.length < 60) {
      return { heading: candidate.replace(/[:.]\s*$/, ""), body: text.slice(match[0].length) };
    }
  }
  return { heading: null, body: text };
}

function parseBodyContent(paragraphs: string[]): ClassifiedParagraph[] {
  return paragraphs.map((text) => {
    const type = classifyParagraph(text);
    const { heading, body } = type === "normal" ? extractHeading(text) : { heading: null, body: text };
    return { type, heading, body, raw: text };
  });
}

// Parse numbered steps from text
function parseSteps(text: string): string[] {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const steps: string[] = [];
  let current = "";
  for (const line of lines) {
    if (/^\d+\.\s/.test(line)) {
      if (current) steps.push(current);
      current = line.replace(/^\d+\.\s*/, "");
    } else if (/^Step \d+/i.test(line)) {
      if (current) steps.push(current);
      current = line.replace(/^Step \d+[:.]\s*/i, "");
    } else {
      current += " " + line;
    }
  }
  if (current) steps.push(current);
  // If we couldn't parse steps, just return the text as-is in one item
  return steps.length > 0 ? steps : [text];
}

// Split comparison text into before/after halves
function splitComparison(text: string): { left: string; leftLabel: string; right: string; rightLabel: string } {
  const beforeAfterMatch = text.match(/Before:\s*(.+?)(?:\n|$)\s*After:\s*(.+?)(?:\n|$)/is);
  if (beforeAfterMatch) return { left: beforeAfterMatch[1].trim(), leftLabel: "Before", right: beforeAfterMatch[2].trim(), rightLabel: "After" };
  const vagueSpecific = text.match(/Vague[:\s]*(.+?)(?:\n|$)\s*Specific[:\s]*(.+?)(?:\n|$)/is);
  if (vagueSpecific) return { left: vagueSpecific[1].trim(), leftLabel: "Vague", right: vagueSpecific[2].trim(), rightLabel: "Specific" };
  const weakStrong = text.match(/Weak[:\s]*(.+?)(?:\n|$)\s*Strong[:\s]*(.+?)(?:\n|$)/is);
  if (weakStrong) return { left: weakStrong[1].trim(), leftLabel: "Weak", right: weakStrong[2].trim(), rightLabel: "Strong" };
  // Fallback: show the whole text on the left
  return { left: text, leftLabel: "Before", right: "", rightLabel: "After" };
}

// Detect if a prompt example looks like AI-generated output
function looksLikeAIOutput(text: string): boolean {
  return text.length > 200 || (text.includes("\n") && text.split("\n").length > 4);
}

const chapterBanners: Record<string, string> = {
  ch01: "/chapters/ch1-Specificity_small.png",
  ch23: "/chapters/ch5-task_chaining_small.png",
  ch25: "/chapters/ch3-persona-pattern_small.png",
  ch27: "/chapters/ch8-Negative_prompting_small.png",
  ch28: "/chapters/ch11-Image_Prompting_small.png",
  ch29: "/chapters/ch12-testing-your-prompt_small.png",
};

export default function ChapterDetail({ chapter, onBack }: ChapterDetailProps) {
  const theme = partThemes[chapter.part] || partThemes.part1;
  const diff = diffBadges[chapter.difficulty];
  const risk = riskLabels[chapter.riskTier];
  const ThemeIcon = theme.icon;
  const [copiedPrompt, setCopiedPrompt] = useState<number | null>(null);
  const [copiedGuide, setCopiedGuide] = useState(false);
  const [chefNotesOpen, setChefNotesOpen] = useState(false);
  const [savedSections, setSavedSections] = useState<Set<number>>(new Set());
  const [isBookmarked, setIsBookmarked] = useState(() => getBookmarks().includes(chapter.id));

  useEffect(() => {
    setIsBookmarked(getBookmarks().includes(chapter.id));
  }, [chapter.id]);

  const currentIndex = chapters.findIndex((c) => c.id === chapter.id);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  const catalogId = getCatalogId(chapter.part, chapter.number);
  const chefsNote = chapter.content.length > 0 ? chapter.content[0] : null;
  const bodyContent = chapter.content.slice(1);
  const beforeAfter = extractBeforeAfter(chapter.promptExamples);

  // Estimate reading time: ~200 words per minute
  const wordCount = chapter.content.join(" ").split(/\s+/).length + chapter.promptExamples.join(" ").split(/\s+/).length;
  const readingMinutes = Math.max(5, Math.ceil(wordCount / 200));
  const sectionCount = 3 + (chapter.promptExamples.length > 0 ? 1 : 0) + (chapter.keyTakeaways.length > 0 ? 1 : 0);
  const templateCount = chapter.tryItVariables.length;

  const handleShare = () => {
    const url = `${window.location.origin}/#${chapter.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Guide link copied!", { description: url, duration: 2500 });
    });
  };

  const handleCopyGuide = () => {
    const text = [
      `${chapter.title}`,
      chapter.subtitle,
      "",
      ...chapter.content,
      "",
      "Prompt Examples:",
      ...chapter.promptExamples.map((p, i) => `${i + 1}. ${p}`),
      "",
      "Key Takeaways:",
      ...chapter.keyTakeaways.map((t, i) => `${i + 1}. ${t}`),
    ].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopiedGuide(true);
      toast.success("Guide content copied!");
      setTimeout(() => setCopiedGuide(false), 2000);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBookmarkToggle = useCallback(() => {
    const nowBookmarked = toggleBookmark(chapter.id);
    setIsBookmarked(nowBookmarked);
    toast.success(nowBookmarked ? "Guide saved!" : "Removed from saved guides", { duration: 1500 });
  }, [chapter.id]);

  const handleCopyPrompt = (text: string, idx: number) => {
    const cleaned = text.replace(/^(SAFE|UNSAFE|PROHIBITED|ALLOWED|EFFICIENT|INEFFICIENT|Chain for [^:]+|UC\d|Before|After|Example [^:]+|Combined prompt|Constrained prompt|Efficient prompt):\s*/i, "");
    navigator.clipboard.writeText(cleaned).then(() => {
      setCopiedPrompt(idx);
      toast.success("Prompt copied!");
      setTimeout(() => setCopiedPrompt(null), 2000);
    });
  };

  const handleSaveSection = (idx: number) => {
    setSavedSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
    toast.success(savedSections.has(idx) ? "Section unsaved" : "Section saved", { duration: 1200 });
  };

  const handleNavigate = (ch: Chapter) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.location.hash = ch.id;
  };

  const isHighRisk = chapter.riskTier === "red";
  const isSafety = chapter.id === "ch02";
  const showRiskCallout = isHighRisk || isSafety;
  const showGoodToKnow = chapter.riskTier === "green" && !isSafety && chapter.keyTakeaways.length > 0;
  const showYellowCallout = chapter.riskTier === "yellow";

  return (
    <motion.div
      className="chapter-detail max-w-3xl mx-auto pb-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ─── ACTION BAR ─── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={fadeTransition}
        className="flex items-center justify-between mb-8 flex-wrap gap-2"
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: theme.accent }}
          data-print="hide"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </button>
        <div className="flex items-center gap-2 no-print">
          <button
            onClick={handleCopyGuide}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:shadow-sm"
            style={{
              border: "1px solid oklch(0.88 0.015 70)",
              color: "oklch(0.48 0.04 48)",
              background: "oklch(0.99 0.003 70)",
            }}
          >
            {copiedGuide ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedGuide ? "Copied" : "Copy this guide"}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:shadow-sm"
            style={{
              border: "1px solid oklch(0.88 0.015 70)",
              color: "oklch(0.48 0.04 48)",
              background: "oklch(0.99 0.003 70)",
            }}
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:shadow-sm"
            style={{
              border: "1px solid oklch(0.88 0.015 70)",
              color: "oklch(0.48 0.04 48)",
              background: "oklch(0.99 0.003 70)",
            }}
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
          <button
            onClick={handleBookmarkToggle}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:shadow-sm"
            style={{
              border: `1px solid ${isBookmarked ? "oklch(0.78 0.14 15)" : "oklch(0.88 0.015 70)"}`,
              color: isBookmarked ? "oklch(0.48 0.16 15)" : "oklch(0.48 0.04 48)",
              background: isBookmarked ? "oklch(0.96 0.03 15)" : "oklch(0.99 0.003 70)",
            }}
          >
            <Heart
              className="w-3.5 h-3.5 transition-all"
              style={{
                fill: isBookmarked ? "oklch(0.55 0.20 15)" : "none",
                color: isBookmarked ? "oklch(0.55 0.20 15)" : "oklch(0.48 0.04 48)",
              }}
            />
            {isBookmarked ? "Saved" : "Save"}
          </button>
        </div>
      </motion.div>

      {/* ─── HEADER ─── */}
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={delayedTransition(0.05)}
        className="mb-8"
      >
        {/* Title */}
        <h1
          className="text-3xl sm:text-4xl font-bold leading-tight mb-3"
          style={{ color: "oklch(0.15 0.025 38)" }}
        >
          {chapter.icon}{" "}
          <span className="opacity-30 text-2xl sm:text-3xl mr-1">Ch. {chapter.number}</span>{" "}
          {chapter.title}
        </h1>

        {/* Subtitle */}
        <p
          className="text-lg leading-relaxed mb-5 max-w-2xl italic"
          style={{ color: "oklch(0.48 0.03 48)" }}
        >
          {chapter.subtitle}
        </p>

        {/* Metadata badges row */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background: "oklch(0.94 0.01 48)", color: "oklch(0.45 0.03 48)" }}
          >
            <Clock className="w-3 h-3" />
            {readingMinutes} min
          </span>
          <span
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background: "oklch(0.94 0.01 48)", color: "oklch(0.45 0.03 48)" }}
          >
            <BookOpen className="w-3 h-3" />
            {sectionCount} sections
          </span>
          {templateCount > 0 && (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ background: "oklch(0.94 0.01 48)", color: "oklch(0.45 0.03 48)" }}
            >
              <FileText className="w-3 h-3" />
              {templateCount} template{templateCount !== 1 ? "s" : ""}
            </span>
          )}
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${diff.classes}`}>
            <Star className="w-3 h-3 inline -mt-0.5 mr-1" />
            {diff.label}
          </span>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: risk.bg, color: risk.color }}
          >
            {risk.label}
          </span>
          {/* Catalog ID removed — added visual noise without user value */}
        </div>

        {/* Chapter banner illustration */}
        {chapterBanners[chapter.id] && (
          <div className="mb-5">
            <ImageLightbox
              src={chapterBanners[chapter.id]}
              alt={`${chapter.title} technique illustration`}
              className="h-32 w-auto rounded-xl object-cover"
              style={{ border: `1px solid ${theme.headerBorder}` }}
            />
          </div>
        )}

        {/* Part label */}
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: theme.accentLight, color: theme.accent, border: `1px solid ${theme.headerBorder}` }}
          >
            <ThemeIcon className="w-3 h-3" />
            {theme.sectionLabel} &middot; {chapter.partLabel}
          </span>
        </div>

        {/* Supported tools */}
        {chapter.supportedTools && chapter.supportedTools.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: "oklch(0.52 0.08 155)" }} />
            <span className="text-xs font-medium" style={{ color: "oklch(0.48 0.04 48)" }}>
              Tested with:
            </span>
            {chapter.supportedTools.map((tool) => (
              <span
                key={tool}
                className="text-xs px-2 py-0.5 rounded-md font-medium"
                style={{ background: "oklch(0.94 0.01 155)", color: "oklch(0.40 0.08 155)" }}
              >
                {tool}
              </span>
            ))}
          </div>
        )}

        {/* Quality score moved to Chef's Notes */}
      </motion.header>

      {/* Source citation removed — was cluttering every page with registry references */}

      {/* ─── INTRODUCTION CALLOUT (first paragraph) ─── */}
      {chefsNote && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={delayedTransition(0.12)}
          className="mb-8 rounded-xl p-5"
          style={{
            background: "oklch(0.97 0.02 55)",
            borderLeft: "4px solid oklch(0.62 0.10 48)",
            border: "1px solid oklch(0.92 0.02 55)",
            borderLeftWidth: "4px",
            borderLeftColor: "oklch(0.62 0.10 48)",
          }}
        >
          <p
            className="text-[0.9375rem] leading-[1.8] italic"
            style={{ color: "oklch(0.30 0.025 38)" }}
          >
            {chefsNote}
          </p>
        </motion.div>
      )}

      {/* ─── CONTENT SECTIONS ─── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={delayedTransition(0.15)}
        className="mb-10"
      >
        {/* Risk/safety callouts */}
        {showRiskCallout && (
          <div
            className="flex items-start gap-3 rounded-xl p-4 mb-6"
            style={{
              background: isHighRisk ? "oklch(0.97 0.02 25)" : "oklch(0.97 0.015 75)",
              border: `1px solid ${isHighRisk ? "oklch(0.90 0.04 25)" : "oklch(0.90 0.025 75)"}`,
              borderLeft: `4px solid ${isHighRisk ? "oklch(0.52 0.18 25)" : "oklch(0.58 0.16 75)"}`,
            }}
          >
            <AlertTriangle
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              style={{ color: isHighRisk ? "oklch(0.52 0.18 25)" : "oklch(0.58 0.16 75)" }}
            />
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: isHighRisk ? "oklch(0.40 0.12 25)" : "oklch(0.42 0.10 60)" }}>
                {isHighRisk ? "Critical Compliance Information" : "Important Safety Guidelines"}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "oklch(0.45 0.03 48)" }}>
                {isHighRisk
                  ? "These boundaries are non-negotiable. Violations could create legal liability for Manatee County."
                  : "These rules apply to all county employees using AI tools. Review them before your first prompt."}
              </p>
            </div>
          </div>
        )}

        {showYellowCallout && (
          <div
            className="flex items-start gap-3 rounded-xl p-4 mb-6"
            style={{
              background: "oklch(0.97 0.025 75)",
              border: "1px solid oklch(0.90 0.04 75)",
              borderLeft: "4px solid oklch(0.58 0.16 75)",
            }}
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "oklch(0.58 0.16 75)" }} />
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: "oklch(0.42 0.12 65)" }}>
                What to Remember
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "oklch(0.45 0.03 48)" }}>
                This topic involves moderate risk. Double-check AI outputs and apply department-specific review before acting on results.
              </p>
            </div>
          </div>
        )}

        {showGoodToKnow && (
          <div
            className="flex items-start gap-3 rounded-xl p-4 mb-6"
            style={{
              background: "oklch(0.96 0.025 150)",
              border: "1px solid oklch(0.90 0.04 150)",
              borderLeft: "4px solid oklch(0.50 0.14 150)",
            }}
          >
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "oklch(0.48 0.14 150)" }} />
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: "oklch(0.35 0.10 150)" }}>
                Good to know:
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "oklch(0.38 0.04 48)" }}>
                {chapter.keyTakeaways[0]}
              </p>
            </div>
          </div>
        )}

        {/* Body paragraphs with smart rendering */}
        <div className="space-y-6">
          {bodyContent.map((paragraph, i) => {
            // Classify paragraph for special rendering
            const isTip = /^(Tip:|Kitchen Tip:|💡|Best practice:)/i.test(paragraph);
            const isSafety = /^(Warning:|Important:|Safety:|⚠️|🚨)/i.test(paragraph);
            const isComparison = /(Before:|After:|Vague:|Specific:|Weak:|Strong:|→)/i.test(paragraph) && paragraph.includes("→");

            // Extract heading: first sentence if short enough and ends with colon/period
            const headingMatch = paragraph.match(/^([^.!?:]{10,58}[:.!?])\s+(.+)/s);
            const heading = headingMatch ? headingMatch[1].replace(/[:.]+$/, "") : null;
            const bodyText = headingMatch ? headingMatch[2] : paragraph;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={delayedTransition(0.2 + i * 0.06)}
              >
                {isTip ? (
                  /* Yellow tip callout */
                  <div
                    className="rounded-lg px-4 py-3"
                    style={{
                      background: "oklch(0.97 0.03 75)",
                      borderLeft: "4px solid oklch(0.65 0.18 75)",
                    }}
                  >
                    <p className="text-sm leading-relaxed" style={{ color: "oklch(0.30 0.04 55)" }}>
                      <span className="font-bold" style={{ color: "oklch(0.50 0.16 75)" }}>
                        Good to know:{" "}
                      </span>
                      {paragraph.replace(/^(Tip:|Kitchen Tip:|💡|Best practice:)\s*/i, "")}
                    </p>
                  </div>
                ) : isSafety ? (
                  /* Red safety callout */
                  <div
                    className="rounded-lg px-4 py-3"
                    style={{
                      background: "oklch(0.97 0.02 25)",
                      borderLeft: "4px solid oklch(0.55 0.18 25)",
                    }}
                  >
                    <p className="text-sm leading-relaxed" style={{ color: "oklch(0.30 0.04 30)" }}>
                      <span className="font-bold" style={{ color: "oklch(0.48 0.16 25)" }}>
                        What to remember:{" "}
                      </span>
                      {paragraph.replace(/^(Warning:|Important:|Safety:|⚠️|🚨)\s*/i, "")}
                    </p>
                  </div>
                ) : (
                  /* Normal paragraph with optional heading */
                  <>
                    {heading && (
                      <div className="flex items-center justify-between mb-2">
                        <h2
                          className="text-base font-bold"
                          style={{ color: "oklch(0.22 0.025 38)" }}
                        >
                          {heading}
                        </h2>
                        <button
                          onClick={() => handleSaveSection(i)}
                          className="no-print flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-all hover:shadow-sm"
                          style={{
                            color: savedSections.has(i) ? "oklch(0.55 0.18 75)" : "oklch(0.55 0.04 48)",
                            background: savedSections.has(i) ? "oklch(0.96 0.04 75)" : "transparent",
                          }}
                        >
                          <Star
                            className="w-3 h-3"
                            style={{ fill: savedSections.has(i) ? "oklch(0.65 0.18 75)" : "none" }}
                          />
                          {savedSections.has(i) ? "Saved" : "Save"}
                        </button>
                      </div>
                    )}
                    <p
                      className="text-[0.9375rem] leading-[1.8]"
                      style={{ color: "oklch(0.28 0.02 38)" }}
                    >
                      {heading ? bodyText : paragraph}
                    </p>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* ─── CHEF'S NOTES ─── */}
      {chefsNote && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={delayedTransition(0.22)}
          className="mb-10"
        >
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, oklch(0.16 0.03 42), oklch(0.20 0.04 50))",
              border: "1px solid oklch(0.30 0.05 42)",
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: "1px solid oklch(0.28 0.04 42)" }}>
              <ChefHat className="w-5 h-5" style={{ color: "oklch(0.78 0.14 55)" }} />
              <span className="text-sm font-bold" style={{ color: "oklch(0.92 0.03 70)" }}>
                Chef&apos;s Notes
              </span>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* The insight — first paragraph as the main takeaway */}
              <div className="pl-4" style={{ borderLeft: "3px solid oklch(0.68 0.14 55)" }}>
                <p className="text-sm leading-relaxed" style={{ color: "oklch(0.88 0.02 70)" }}>
                  {chefsNote}
                </p>
              </div>

              {/* Try this now — actionable suggestion from first key takeaway */}
              {chapter.keyTakeaways.length > 0 && (
                <div
                  className="rounded-lg px-4 py-3"
                  style={{ background: "oklch(0.24 0.04 50 / 0.5)" }}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "oklch(0.72 0.12 55)" }}>
                    Try this now
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "oklch(0.82 0.02 70)" }}>
                    {chapter.keyTakeaways[0]}
                  </p>
                </div>
              )}

              {/* Quick stat if quality score exists */}
              {chapter.qualityScore !== null && (
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: i < Math.round(chapter.qualityScore! / 2)
                            ? "oklch(0.72 0.14 55)"
                            : "oklch(0.30 0.03 50)",
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px]" style={{ color: "oklch(0.60 0.04 55)" }}>
                    Quality: {chapter.qualityScore}/10
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.section>
      )}

      <div className="section-divider" />

      {/* ─── PROMPT EXAMPLES ─── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={delayedTransition(0.25)}
        className="mb-10"
      >
        <h2
          className="text-base font-bold mb-5 flex items-center gap-2.5 uppercase tracking-wider"
          style={{ color: "oklch(0.25 0.03 38)" }}
        >
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0"
            style={{ background: theme.accent, color: "oklch(0.98 0.008 70)" }}
          >
            <FileText className="w-3.5 h-3.5" />
          </span>
          <span style={{ fontSize: "0.8125rem", letterSpacing: "0.06em" }}>Example Prompts</span>
        </h2>

        {/* Before/After comparison */}
        {beforeAfter && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={delayedTransition(0.28)}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6"
          >
            <div
              className="rounded-xl p-4"
              style={{
                background: "oklch(0.96 0.03 25 / 0.5)",
                border: "1.5px solid oklch(0.85 0.06 25)",
              }}
            >
              <div
                className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"
                style={{ color: "oklch(0.50 0.14 25)" }}
              >
                <span
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold"
                  style={{ background: "oklch(0.90 0.06 25)", color: "oklch(0.40 0.14 25)" }}
                >
                  ✗
                </span>
                BEFORE
              </div>
              <p className="text-xs leading-relaxed font-mono" style={{ color: "oklch(0.35 0.05 25)" }}>
                {beforeAfter.before.replace(/^(before|weak):\s*/i, "")}
              </p>
            </div>
            <div
              className="rounded-xl p-4"
              style={{
                background: "oklch(0.96 0.03 155 / 0.5)",
                border: "1.5px solid oklch(0.85 0.06 155)",
              }}
            >
              <div
                className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"
                style={{ color: "oklch(0.40 0.14 155)" }}
              >
                <span
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold"
                  style={{ background: "oklch(0.88 0.06 155)", color: "oklch(0.35 0.14 155)" }}
                >
                  ✓
                </span>
                AFTER
              </div>
              <p className="text-xs leading-relaxed font-mono" style={{ color: "oklch(0.25 0.06 155)" }}>
                {beforeAfter.after.replace(/^(after|improved):\s*/i, "")}
              </p>
            </div>
          </motion.div>
        )}

        {/* Individual prompt blocks */}
        <div className="space-y-5">
          {chapter.promptExamples.map((example, i) => {
            const label = extractPromptLabel(example);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={delayedTransition(0.3 + i * 0.08)}
                className="relative group/prompt"
              >
                {label && (
                  <div
                    className="text-[10px] font-bold uppercase tracking-[0.08em] mb-1.5 pl-1"
                    style={{ color: "oklch(0.55 0.06 48)" }}
                  >
                    {label}
                  </div>
                )}
                <div className="prompt-block">{example}</div>
                <button
                  onClick={() => handleCopyPrompt(example, i)}
                  className="no-print absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover/prompt:opacity-100 transition-opacity"
                  style={{ background: "oklch(0.28 0.02 40)", color: "oklch(0.75 0.05 55)" }}
                  title="Copy this prompt"
                >
                  {copiedPrompt === i ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => {
                    const cleaned = example.replace(/^(SAFE|UNSAFE|PROHIBITED|ALLOWED|EFFICIENT|INEFFICIENT|Chain for [^:]+|UC\d|Before|After|Example [^:]+|Combined prompt|Constrained prompt|Efficient prompt):\s*/i, "");
                    localStorage.setItem("cookbook-builder-import", cleaned);
                    window.location.href = "/builder";
                  }}
                  className="no-print inline-flex items-center gap-1 text-xs font-medium mt-2 transition-opacity hover:opacity-80"
                  style={{ color: theme.accent, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  <Wrench className="w-3 h-3" />
                  Try it in the Prompt Builder
                </button>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      <div className="section-divider" />

      {/* ─── KEY TAKEAWAYS ─── */}
      {chapter.keyTakeaways.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={delayedTransition(0.35)}
          className="mb-10"
        >
          <div
            className="takeaways-box rounded-2xl p-6 relative overflow-hidden"
            style={{
              background: theme.accentLight,
              border: `1.5px solid ${theme.headerBorder}`,
            }}
          >
            {/* Decorative corner accent */}
            <div
              className="absolute top-0 right-0 w-24 h-24 opacity-10 rounded-bl-full"
              style={{ background: theme.accent }}
            />

            <div className="relative">
              <h2
                className="text-base font-bold mb-5 flex items-center gap-2.5"
                style={{ color: "oklch(0.22 0.025 38)" }}
              >
                <Lightbulb className="w-5 h-5" style={{ color: theme.accent }} />
                Key Takeaways
              </h2>
              <div className="space-y-3.5">
                {chapter.keyTakeaways.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={delayedTransition(0.4 + i * 0.06)}
                    className="flex items-start gap-3"
                  >
                    <span
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold flex-shrink-0 mt-0.5"
                      style={{ background: theme.accent, color: "oklch(0.98 0.008 70)" }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed" style={{ color: "oklch(0.30 0.02 38)" }}>
                      {item}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* ─── TRY IT ─── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={delayedTransition(0.45)}
        className="mb-6"
      >
        <TryItSection
          template={chapter.tryItTemplate}
          variables={chapter.tryItVariables}
          accentColor={theme.accent}
        />
      </motion.div>

      {/* Try in Prompt Builder link */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={delayedTransition(0.48)}
        className="mb-12 flex justify-center"
      >
        <button
          onClick={() => {
            localStorage.setItem("cookbook-builder-import", chapter.tryItTemplate);
            window.location.href = "/builder";
          }}
          className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:shadow-md active:scale-[0.98]"
          style={{
            background: theme.accent,
            color: "oklch(0.98 0.008 70)",
            boxShadow: `0 4px 16px oklch(0.18 0.02 38 / 0.12)`,
          }}
        >
          <Wrench className="w-4 h-4" />
          Remix in Prompt Builder
        </button>
      </motion.div>

      {/* ─── PREV / NEXT NAVIGATION ─── */}
      <motion.nav
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={delayedTransition(0.52)}
        className="rounded-2xl overflow-hidden mb-6"
        style={{
          background: "oklch(0.98 0.005 55)",
          border: "1px solid oklch(0.92 0.015 55)",
        }}
      >
        <div className="flex">
          <div className="flex-1">
            {prevChapter ? (
              <button
                onClick={() => handleNavigate(prevChapter)}
                className="w-full text-left px-5 py-4 transition-colors hover:bg-white/60 group"
              >
                <span
                  className="text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1"
                  style={{ color: "oklch(0.58 0.04 48)" }}
                >
                  <ArrowLeft className="w-3 h-3" />
                  Previous
                </span>
                <span
                  className="block text-sm font-semibold mt-1 group-hover:underline"
                  style={{ color: "oklch(0.30 0.03 38)" }}
                >
                  Ch. {prevChapter.number}: {prevChapter.title}
                </span>
              </button>
            ) : (
              <div className="px-5 py-4" />
            )}
          </div>
          <div className="w-px self-stretch" style={{ background: "oklch(0.92 0.015 55)" }} />
          <div className="flex-1">
            {nextChapter ? (
              <button
                onClick={() => handleNavigate(nextChapter)}
                className="w-full text-right px-5 py-4 transition-colors hover:bg-white/60 group"
              >
                <span
                  className="text-[10px] uppercase tracking-wider font-semibold flex items-center justify-end gap-1"
                  style={{ color: "oklch(0.58 0.04 48)" }}
                >
                  Next
                  <ArrowRight className="w-3 h-3" />
                </span>
                <span
                  className="block text-sm font-semibold mt-1 group-hover:underline"
                  style={{ color: "oklch(0.30 0.03 38)" }}
                >
                  Ch. {nextChapter.number}: {nextChapter.title}
                </span>
              </button>
            ) : (
              <div className="px-5 py-4" />
            )}
          </div>
        </div>
      </motion.nav>

      {/* Back to Menu button at bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={delayedTransition(0.56)}
        className="flex justify-center no-print"
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80 px-4 py-2 rounded-lg"
          style={{
            color: theme.accent,
            border: `1px solid ${theme.headerBorder}`,
            background: theme.accentLight,
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </button>
      </motion.div>
    </motion.div>
  );
}
