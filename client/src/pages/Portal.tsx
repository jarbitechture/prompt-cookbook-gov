import { motion } from "framer-motion";
import { Wrench, Shield } from "lucide-react";
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

          {/* v1 rollout: Builder is the only surface live. Cookbook / Lab / Resources
              ship in a later release; their tiles + this single CTA both restore from a
              single revert when v2 is ready. */}
          <div className="flex justify-center mb-10">
            <a
              href="/builder/"
              style={{ display: "block", textDecoration: "none", maxWidth: 420, width: "100%" }}
            >
              <motion.div
                className="rounded-xl border p-7 text-left cursor-pointer"
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
                  className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4"
                  style={{ background: "oklch(0.95 0.04 220)" }}
                >
                  <Wrench size={24} style={{ color: ACCENT_BUILDER }} aria-hidden="true" />
                </div>
                <h2
                  className="font-serif font-bold text-xl mb-2"
                  style={{ color: TEXT_PRIMARY }}
                >
                  Prompt Builder
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: TEXT_SECONDARY }}>
                  Assemble county-safe prompts from the RTCO framework, run them
                  through the on-premises governed AI proxy, and copy directly
                  into Copilot or ChatGPT Enterprise.
                </p>
                <div
                  className="mt-5 text-sm font-medium"
                  style={{ color: ACCENT_BUILDER }}
                >
                  Open builder →
                </div>
              </motion.div>
            </a>
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
