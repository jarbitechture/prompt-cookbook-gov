/**
 * PiiWarningModal.tsx — P0-A demo-block patch (2026-05-14)
 *
 * Surfaces the PII pre-flight scan results from copilot-handoff.ts and
 * gives the user two safe paths forward:
 *
 *   - "Redact and send"  → call sendRedactedToTarget(redacted, ...)
 *   - "Send anyway"      → re-call sendToTarget(prompt, target, mode,
 *                          { skipPiiScan: true })
 *
 * Mirrors the visual shape of RefineDiff's AcceptModal so the cookbook
 * feels like one consistent system (header bar, body card, footer
 * buttons, backdrop click-to-close).
 */
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, X } from "lucide-react";
import type { ScanMatch, PiiPattern } from "@/lib/pre-send-scan";

const ACCENT_WARN = "oklch(0.55 0.16 35)"; // amber/orange — matches the warning palette
const ACCENT_WARN_DEEP = "oklch(0.40 0.16 30)";

const PATTERN_LABELS: Record<PiiPattern, string> = {
  ssn:                 "Social Security number",
  us_phone:            "US phone number",
  email:               "Email address",
  credit_card:         "Credit card number",
  dollar_amount_large: "Large dollar amount",
};

interface PiiWarningModalProps {
  /** Match list from the PiiDetectedError. */
  matches: ScanMatch[];
  /** The redacted version of the original prompt. */
  redacted: string;
  /** "Redact and send" — caller hooks this into sendRedactedToTarget. */
  onRedactAndSend: () => void;
  /** "Send anyway" — caller hooks this into sendToTarget with skipPiiScan. */
  onSendAnyway: () => void;
  /** Backdrop click / X / cancel. */
  onClose: () => void;
}

export default function PiiWarningModal({
  matches,
  redacted,
  onRedactAndSend,
  onSendAnyway,
  onClose,
}: PiiWarningModalProps) {
  // Distinct pattern types, ordered by first appearance.
  const distinctPatterns = useMemo<PiiPattern[]>(() => {
    const seen = new Set<PiiPattern>();
    const out: PiiPattern[] = [];
    for (const m of matches) {
      if (!seen.has(m.pattern)) {
        seen.add(m.pattern);
        out.push(m.pattern);
      }
    }
    return out;
  }, [matches]);

  return (
    <AnimatePresence>
      <motion.div
        key="pii-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: "oklch(0.10 0.01 30 / 0.55)" }}
        onClick={onClose}
      >
        <motion.div
          key="pii-modal-card"
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.18 }}
          className="relative rounded-xl overflow-hidden w-full max-w-2xl mx-4"
          style={{
            background: "oklch(0.998 0.002 70)",
            border: `1px solid ${ACCENT_WARN}`,
            boxShadow: "0 8px 32px oklch(0.10 0.02 30 / 0.22)",
          }}
          onClick={(e) => e.stopPropagation()}
          role="alertdialog"
          aria-labelledby="pii-modal-title"
          aria-describedby="pii-modal-desc"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ background: ACCENT_WARN }}
          >
            <h4
              id="pii-modal-title"
              className="font-bold text-sm flex items-center gap-2"
              style={{ color: "oklch(0.99 0.01 75)" }}
            >
              <ShieldAlert className="w-4 h-4" />
              Potential PII detected
            </h4>
            <button
              onClick={onClose}
              className="rounded p-1 transition-opacity hover:opacity-70"
              style={{ color: "oklch(0.95 0.02 75)" }}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-4">
            <p
              id="pii-modal-desc"
              className="text-xs"
              style={{ color: "oklch(0.30 0.04 40)" }}
            >
              The prompt you are about to send to a public-cloud AI service
              appears to contain personal data. Sending PII outside county
              systems may violate Manatee County records policy and the AI
              Governance Handbook (v1.0).
            </p>

            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-wider mb-2"
                style={{ color: ACCENT_WARN_DEEP }}
              >
                What we found
              </p>
              <ul className="space-y-1 text-xs" style={{ color: "oklch(0.32 0.04 40)" }}>
                {distinctPatterns.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ background: ACCENT_WARN }}
                    />
                    {PATTERN_LABELS[p]}
                    <span
                      className="text-[10px]"
                      style={{ color: "oklch(0.55 0.04 50)" }}
                    >
                      ({matches.filter((m) => m.pattern === p).length}
                      {matches.filter((m) => m.pattern === p).length === 1
                        ? " match"
                        : " matches"}
                      )
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-wider mb-2"
                style={{ color: "oklch(0.40 0.04 50)" }}
              >
                Redacted preview
              </p>
              <textarea
                readOnly
                value={redacted}
                rows={6}
                className="w-full text-xs rounded-lg p-3 resize-none focus:outline-none"
                style={{
                  background: "oklch(0.97 0.006 30)",
                  border: "1px solid oklch(0.88 0.04 30)",
                  color: "oklch(0.28 0.025 38)",
                  fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                }}
              />
            </div>

            {/* Footer */}
            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <button
                onClick={onClose}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80"
                style={{
                  background: "oklch(0.93 0.01 70)",
                  color: "oklch(0.40 0.04 50)",
                  border: "1px solid oklch(0.85 0.02 70)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={onSendAnyway}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80"
                style={{
                  background: "oklch(0.95 0.02 30)",
                  color: ACCENT_WARN_DEEP,
                  border: `1px solid ${ACCENT_WARN}`,
                }}
              >
                Send anyway
              </button>
              <button
                onClick={onRedactAndSend}
                className="text-xs px-3 py-1.5 rounded-lg font-bold transition-opacity hover:opacity-80"
                style={{
                  background: ACCENT_WARN,
                  color: "oklch(0.99 0.01 75)",
                }}
              >
                Redact and send
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
