import { motion } from "framer-motion";
import { Link } from "wouter";
import { BookOpen, Wrench, Shield, Clock } from "lucide-react";
import {
  PAGE_BG,
  CARD_BG,
  CARD_BORDER,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  ACCENT_COOKBOOK,
  ACCENT_BUILDER,
} from "@/lib/theme";

const CARD_HOVER_SHADOW = "0 4px 24px oklch(0.0 0.0 0 / 0.10)";

export default function Portal() {
  return (
    <div
      id="main-content"
      className="min-h-screen flex flex-col"
      style={{ background: PAGE_BG }}
    >
      {/* Brand bar */}
      <header
        className="w-full border-b"
        style={{ background: CARD_BG, borderColor: CARD_BORDER }}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <Shield
            size={20}
            style={{ color: ACCENT_COOKBOOK }}
            aria-hidden="true"
          />
          <span
            className="font-serif font-semibold text-sm tracking-wide"
            style={{ color: TEXT_SECONDARY }}
          >
            Manatee County Government · Information Technology Services
          </span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="max-w-2xl mx-auto"
        >
          <h1
            className="font-serif text-4xl font-bold mb-3"
            style={{ color: TEXT_PRIMARY }}
          >
            Manatee County AI Tools
          </h1>
          <p
            className="text-lg mb-12"
            style={{ color: TEXT_SECONDARY }}
          >
            A governed family of AI tools for county staff.
          </p>

          {/* Product cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
            {/* Cookbook card */}
            <Link href="/cookbook">
              <motion.div
                className="rounded-xl border p-6 text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  background: CARD_BG,
                  borderColor: CARD_BORDER,
                  "--ring-color": ACCENT_COOKBOOK,
                } as React.CSSProperties}
                whileHover={{
                  y: -2,
                  boxShadow: CARD_HOVER_SHADOW,
                  borderColor: ACCENT_COOKBOOK,
                }}
                transition={{ duration: 0.18 }}
              >
                <div
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4"
                  style={{ background: `oklch(0.96 0.04 55)` }}
                >
                  <BookOpen size={20} style={{ color: ACCENT_COOKBOOK }} aria-hidden="true" />
                </div>
                <h2
                  className="font-serif font-bold text-lg mb-1"
                  style={{ color: TEXT_PRIMARY }}
                >
                  Prompt Cookbook
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: TEXT_SECONDARY }}>
                  Step-by-step prompting guides, real government examples, and a
                  practice lab for county staff.
                </p>
                <div
                  className="mt-4 text-sm font-medium"
                  style={{ color: ACCENT_COOKBOOK }}
                >
                  Open cookbook →
                </div>
              </motion.div>
            </Link>

            {/* Builder card */}
            <Link href="/builder">
              <motion.div
                className="rounded-xl border p-6 text-left cursor-pointer"
                style={{
                  background: CARD_BG,
                  borderColor: CARD_BORDER,
                }}
                whileHover={{
                  y: -2,
                  boxShadow: CARD_HOVER_SHADOW,
                  borderColor: ACCENT_BUILDER,
                }}
                transition={{ duration: 0.18 }}
              >
                <div
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4"
                  style={{ background: `oklch(0.95 0.04 220)` }}
                >
                  <Wrench size={20} style={{ color: ACCENT_BUILDER }} aria-hidden="true" />
                </div>
                <h2
                  className="font-serif font-bold text-lg mb-1"
                  style={{ color: TEXT_PRIMARY }}
                >
                  Prompt Builder
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: TEXT_SECONDARY }}>
                  Assemble prompts from department templates using the RTCO
                  framework, then copy directly into your AI tool.
                </p>
                <div
                  className="mt-4 text-sm font-medium"
                  style={{ color: ACCENT_BUILDER }}
                >
                  Open builder →
                </div>
              </motion.div>
            </Link>
          </div>

          {/* Coming soon placeholder */}
          <div
            className="rounded-xl border border-dashed px-6 py-5 text-center"
            style={{ borderColor: CARD_BORDER }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock size={15} style={{ color: TEXT_MUTED }} aria-hidden="true" />
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: TEXT_MUTED }}
              >
                Coming soon
              </span>
            </div>
            <p className="text-sm" style={{ color: TEXT_MUTED }}>
              Additional tools are under development and will appear here.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Governance footer */}
      <footer
        className="w-full border-t"
        style={{ background: CARD_BG, borderColor: CARD_BORDER }}
      >
        <div
          className="max-w-5xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <Shield size={15} style={{ color: TEXT_MUTED }} aria-hidden="true" />
            <span className="text-xs font-semibold" style={{ color: TEXT_MUTED }}>
              Manatee County Government
            </span>
          </div>
          <p className="text-xs text-center" style={{ color: TEXT_MUTED }}>
            All tools use the governed civic-ai proxy. Every interaction is logged for audit.
          </p>
        </div>
      </footer>
    </div>
  );
}
