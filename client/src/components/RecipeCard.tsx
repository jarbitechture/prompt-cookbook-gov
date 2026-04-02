import { useState } from "react";
import { Check, Clock, FileText, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import type { Chapter } from "@/lib/cookbookData";
import { toast } from "sonner";

export interface RecipeCardProps {
  chapter: Chapter;
  onClick: () => void;
  index?: number;
}

const sectionConfig: Record<string, { accent: string; label: string; bg: string; rule: string }> = {
  part1: { accent: "oklch(0.38 0.14 245)", label: "Start Here", bg: "oklch(0.96 0.025 245)", rule: "oklch(0.38 0.14 245)" },
  part2: { accent: "oklch(0.48 0.14 55)", label: "Everyday Use", bg: "oklch(0.97 0.025 55)", rule: "oklch(0.48 0.14 55)" },
  part3: { accent: "oklch(0.38 0.14 155)", label: "Going Deeper", bg: "oklch(0.96 0.025 155)", rule: "oklch(0.38 0.14 155)" },
  part4: { accent: "oklch(0.38 0.12 300)", label: "Governance", bg: "oklch(0.96 0.02 300)", rule: "oklch(0.38 0.12 300)" },
};

const difficultyConfig: Record<string, { label: string; color: string }> = {
  beginner:     { label: "Beginner",     color: "oklch(0.38 0.12 155)" },
  intermediate: { label: "Intermediate", color: "oklch(0.48 0.14 75)" },
  advanced:     { label: "Advanced",     color: "oklch(0.48 0.16 25)" },
};

export default function RecipeCard({ chapter, onClick, index = 0 }: RecipeCardProps) {
  const section = sectionConfig[chapter.part] || sectionConfig.part1;
  const diff = difficultyConfig[chapter.difficulty] || difficultyConfig.beginner;
  const [copied, setCopied] = useState(false);

  const readTime = Math.max(1, Math.round(chapter.content.length * 0.5));
  const promptCount = chapter.tryItVariables.length;

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/#${chapter.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success("Link copied!", { description: url, duration: 2500 });
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => toast.error("Could not copy link"));
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.025, ease: [0.25, 0.1, 0.25, 1] }}
      className="recipe-card group relative flex flex-col cursor-pointer"
      style={{
        background: "oklch(0.998 0.002 70)",
        borderRadius: "12px",
        border: "1px solid oklch(0.91 0.010 70)",
        boxShadow: "0 1px 4px oklch(0.18 0.02 38 / 0.06)",
        width: "100%",
        maxWidth: "340px",
        overflow: "hidden",
      }}
      whileHover={{
        y: -4,
        boxShadow: "0 12px 32px oklch(0.18 0.02 38 / 0.10), 0 2px 6px oklch(0.18 0.02 38 / 0.05)",
      }}
      onClick={onClick}
    >
      {/* Section color strip */}
      <div style={{ height: "3px", background: section.rule }} />

      <div className="p-5 flex flex-col flex-1">
        {/* Top row: chapter number + section label */}
        <div className="flex items-center justify-between mb-4">
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded"
            style={{ background: section.bg, color: section.accent }}
          >
            {section.label}
          </span>
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-bold"
              style={{ color: diff.color }}
            >
              {diff.label}
            </span>
            <span
              className="font-serif font-bold text-lg leading-none"
              style={{ color: "oklch(0.85 0.015 70)" }}
            >
              {chapter.number}
            </span>
          </div>
        </div>

        {/* Icon + Title row */}
        <div className="flex items-start gap-3 mb-2">
          <span className="text-3xl leading-none flex-shrink-0 mt-0.5" role="img" aria-hidden="true">
            {chapter.icon}
          </span>
          <h3
            className="font-serif font-bold text-base leading-snug"
            style={{ color: "oklch(0.15 0.025 38)" }}
          >
            {chapter.title}
          </h3>
        </div>

        {/* Subtitle */}
        <p
          className="text-[0.8125rem] leading-relaxed flex-1 mb-4 ml-9"
          style={{ color: "oklch(0.44 0.025 48)" }}
        >
          {chapter.subtitle}
        </p>

        {/* Footer: metadata + actions */}
        <div
          className="flex items-center justify-between pt-3"
          style={{ borderTop: "1px solid oklch(0.93 0.008 70)" }}
        >
          {/* Metadata */}
          <div className="flex items-center gap-3 text-[11px]" style={{ color: "oklch(0.55 0.03 50)" }}>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {readTime}m
            </span>
            <span className="inline-flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {promptCount} prompts
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleShare}
              className="p-1.5 rounded-md transition-colors hover:bg-[oklch(0.94_0.01_70)]"
              style={{ color: "oklch(0.58 0.04 50)" }}
              title="Copy link"
            >
              {copied ? <Check className="w-3.5 h-3.5" style={{ color: "oklch(0.45 0.14 155)" }} /> : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              )}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
              style={{ background: section.accent, color: "#fff" }}
            >
              Open
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
