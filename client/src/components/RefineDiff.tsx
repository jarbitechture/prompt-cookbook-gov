import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  RotateCcw,
  Loader2,
  Wand2,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  X,
  MessageSquareQuote,
  Brain,
  UserCircle,
  ClipboardList,
  Ban,
  Crosshair,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { diffWordsWithSpace } from "diff";
import { toast } from "sonner";
import { apiUrl } from "@/lib/apiUrl";
import { accent, accentSoft, surface, ink, inkMuted, hairline, hairlineColor, withAlpha } from "@/builder-theme";

// ─── Refine technique cards ───────────────────────────────────────────────────
// Server contract: keys must match server/lib/technique-map.ts (TechniqueKey).
type TechniqueKey =
  | "add-examples"
  | "show-reasoning"
  | "set-role"
  | "specify-output"
  | "add-constraints"
  | "more-specific";

interface TechniqueCard {
  key: TechniqueKey;
  title: string;
  description: string;
  icon: LucideIcon;
}

const TECHNIQUE_CARDS: readonly TechniqueCard[] = [
  {
    key: "add-examples",
    title: "Add Examples",
    description: "Show the AI 1–2 examples of what good output looks like.",
    icon: MessageSquareQuote,
  },
  {
    key: "show-reasoning",
    title: "Show Reasoning Steps",
    description: "Have the AI think through the problem step-by-step.",
    icon: Brain,
  },
  {
    key: "set-role",
    title: "Set the Role",
    description: "Tell the AI who to act as — e.g., a county budget analyst.",
    icon: UserCircle,
  },
  {
    key: "specify-output",
    title: "Specify the Output",
    description: "Lock down the format, length, and tone of the response.",
    icon: ClipboardList,
  },
  {
    key: "add-constraints",
    title: "Add What to Avoid",
    description: "Tell the AI what NOT to do — jargon, speculation, etc.",
    icon: Ban,
  },
  {
    key: "more-specific",
    title: "Make it More Specific",
    description: "Replace vague language with concrete details.",
    icon: Crosshair,
  },
];

// ─── Local type mirror of server/schemas/refine.ts ────────────────────────────
interface RefineResult {
  rewritten: string;
  applied_techniques: number[];
  notes: string;
}

// ─── Props ─────────────────────────────────────────────────────────────────────
interface RefineDiffProps {
  prompt: string;
}

// ─── Loading skeleton ──────────────────────────────────────────────────────────
function RefineSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-4 rounded" style={{ background: hairlineColor, width: "40%" }} />
          <div className="h-24 rounded-lg" style={{ background: hairlineColor }} />
        </div>
        <div className="space-y-2">
          <div className="h-4 rounded" style={{ background: hairlineColor, width: "40%" }} />
          <div className="h-24 rounded-lg" style={{ background: hairlineColor }} />
        </div>
      </div>
      <div className="h-4 rounded" style={{ background: hairlineColor, width: "65%" }} />
    </div>
  );
}

// ─── Side-by-side diff renderer ────────────────────────────────────────────────
function DiffView({ original, rewritten }: { original: string; rewritten: string }) {
  const chunks = diffWordsWithSpace(original, rewritten);

  const leftTokens = chunks.filter((c) => !c.added);
  const rightTokens = chunks.filter((c) => !c.removed);

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Original — left pane */}
      <div>
        <p
          className="text-xs font-bold uppercase tracking-wider mb-2"
          style={{ color: inkMuted }}
        >
          Original
        </p>
        <div
          className="rounded-lg p-3 text-sm leading-relaxed min-h-[80px]"
          style={{
            background: surface,
            border: hairline,
            color: ink,
          }}
        >
          {leftTokens.map((chunk, i) =>
            chunk.removed ? (
              <span
                key={i}
                style={{
                  background: withAlpha(accent, 0.12),
                  color: inkMuted,
                  textDecoration: "line-through",
                  borderRadius: "2px",
                  padding: "0 1px",
                }}
              >
                {chunk.value}
              </span>
            ) : (
              <span key={i}>{chunk.value}</span>
            )
          )}
        </div>
      </div>

      {/* Rewritten — right pane */}
      <div>
        <p
          className="text-xs font-bold uppercase tracking-wider mb-2"
          style={{ color: inkMuted }}
        >
          Rewritten
        </p>
        <div
          className="rounded-lg p-3 text-sm leading-relaxed min-h-[80px]"
          style={{
            background: accentSoft,
            border: `1px solid ${hairlineColor}`,
            color: ink,
          }}
        >
          {rightTokens.map((chunk, i) =>
            chunk.added ? (
              <span
                key={i}
                style={{
                  background: accentSoft,
                  color: accent,
                  fontWeight: 700,
                  borderRadius: "2px",
                  padding: "0 1px",
                }}
              >
                {chunk.value}
              </span>
            ) : (
              <span key={i}>{chunk.value}</span>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Accept modal ──────────────────────────────────────────────────────────────
function AcceptModal({
  rewritten,
  onClose,
}: {
  rewritten: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(rewritten).then(() => {
      setCopied(true);
      toast.success("Refined prompt copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    });
  }, [rewritten]);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-40 flex items-center justify-center"
        style={{ background: "oklch(0.10 0.01 220 / 0.55)" }}
        onClick={onClose}
      >
        {/* Modal card — stop propagation so clicking inside doesn't close */}
        <motion.div
          key="modal-card"
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.18 }}
          className="relative rounded-xl overflow-hidden w-full max-w-2xl mx-4"
          style={{
            background: surface,
            border: `1px solid ${hairlineColor}`,
            boxShadow: "0 8px 32px oklch(0.10 0.02 220 / 0.18)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal header */}
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ background: accent }}
          >
            <h4
              className="font-bold text-sm flex items-center gap-2"
              style={{ color: "oklch(0.98 0.01 75)" }}
            >
              <Wand2 className="w-4 h-4" />
              Refined Prompt — Ready to Copy
            </h4>
            <button
              onClick={onClose}
              className="rounded p-1 transition-opacity hover:opacity-70"
              style={{ color: "oklch(0.92 0.02 75)" }}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal body */}
          <div className="px-5 py-4 space-y-4">
            <p className="text-xs" style={{ color: inkMuted }}>
              The refined prompt is ready. Copy it, then paste it into your tool
              of choice — or replace your current draft by clearing the blocks
              and pasting into the Task block.
            </p>

            <textarea
              readOnly
              value={rewritten}
              rows={10}
              className="w-full text-sm rounded-lg p-3 resize-none focus:outline-none"
              style={{
                background: accentSoft,
                border: `1px solid ${hairlineColor}`,
                color: ink,
                fontFamily: "inherit",
              }}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80"
                style={{
                  background: surface,
                  color: inkMuted,
                  border: hairline,
                }}
              >
                Close
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
                style={{
                  background: accent,
                  color: "oklch(0.98 0.01 75)",
                }}
              >
                {copied ? (
                  <><Check className="w-3 h-3" /> Copied!</>
                ) : (
                  <><Copy className="w-3 h-3" /> Copy to Clipboard</>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function RefineDiff({ prompt }: RefineDiffProps) {
  // The single technique that is currently loading, if any. Used to dim
  // siblings during a refine call.
  const [loadingTechnique, setLoadingTechnique] = useState<TechniqueKey | null>(null);
  // The technique that produced the current result, for re-apply / context.
  const [activeTechnique, setActiveTechnique] = useState<TechniqueKey | null>(null);
  const [result, setResult] = useState<RefineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [breakerOpen, setBreakerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);

  const hasPrompt = prompt.trim().length > 0;
  const loading = loadingTechnique !== null;

  const handleRefine = useCallback(
    async (technique: TechniqueKey) => {
      if (!hasPrompt || loading) return;
      setLoadingTechnique(technique);
      setError(null);
      setResult(null);
      setBreakerOpen(false);

      try {
        const res = await fetch(apiUrl("/api/refine"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, technique }),
        });

        if (res.status === 503) {
          setBreakerOpen(true);
          return;
        }

        if (!res.ok) {
          let msg = `Server error (${res.status})`;
          try {
            const body = await res.json();
            if (body?.error) msg = body.error;
          } catch {
            // non-JSON body from proxy/gateway — use generic message
          }
          setError(msg);
          return;
        }

        let data: unknown;
        try {
          data = await res.json();
        } catch {
          setError("Received invalid response from server.");
          return;
        }

        // Server response shape: { result: RefineResult, flags: [...] }
        const r = (data as { result?: RefineResult }).result;
        if (
          !r ||
          typeof r.rewritten !== "string" ||
          !Array.isArray(r.applied_techniques)
        ) {
          setError("Refine response was malformed.");
          return;
        }

        setResult(r);
        setActiveTechnique(technique);
        setCollapsed(false);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "Network error. Is the server running?");
        } else {
          setError("Unexpected error.");
        }
      } finally {
        setLoadingTechnique(null);
      }
    },
    [hasPrompt, loading, prompt]
  );

  const handleRetry = useCallback(() => {
    if (activeTechnique === null) return;
    setError(null);
    setBreakerOpen(false);
    handleRefine(activeTechnique);
  }, [activeTechnique, handleRefine]);

  const handleReject = useCallback(() => {
    setResult(null);
    setActiveTechnique(null);
    setCollapsed(false);
  }, []);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="rounded-xl overflow-hidden"
        style={{
          border: `1px solid ${hairlineColor}`,
          background: surface,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 gap-3"
          style={{ background: accent }}
        >
          <h4
            className="font-bold text-sm flex items-center gap-2 shrink-0"
            style={{ color: "oklch(0.98 0.01 75)" }}
          >
            <Wand2 className="w-4 h-4" />
            Refine your prompt
          </h4>

          {/* Collapse toggle (only when result is present) */}
          {result && (
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-opacity hover:opacity-80 shrink-0"
              style={{ color: "oklch(0.92 0.02 75)" }}
              aria-label={collapsed ? "Expand refine output" : "Collapse refine output"}
            >
              {collapsed ? (
                <><ChevronDown className="w-3 h-3" /> Expand</>
              ) : (
                <><ChevronUp className="w-3 h-3" /> Collapse</>
              )}
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-5 py-4" style={{ background: withAlpha(accentSoft, 0.35) }}>
          {/* Card grid — always visible, even when a result is showing */}
          <p
            className="text-xs font-bold uppercase tracking-wider mb-3"
            style={{ color: inkMuted }}
          >
            {result ? "Try another improvement" : "Pick a way to improve your prompt"}
          </p>

          <div
            className="grid gap-3 mb-4"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))" }}
            role="group"
            aria-label="Refine techniques"
          >
            {TECHNIQUE_CARDS.map((card) => {
              const Icon = card.icon;
              const isLoadingThis = loadingTechnique === card.key;
              const isDimmed = loading && !isLoadingThis;
              const isActive = activeTechnique === card.key && result !== null;
              const disabled = !hasPrompt || loading;

              return (
                <motion.button
                  key={card.key}
                  type="button"
                  whileHover={!disabled ? { y: -2 } : undefined}
                  whileTap={!disabled ? { scale: 0.98 } : undefined}
                  onClick={() => handleRefine(card.key)}
                  disabled={disabled}
                  aria-label={`${card.title} — ${card.description}`}
                  aria-pressed={isActive}
                  className="flex flex-col items-start gap-2 rounded-xl p-4 text-left transition-all focus:outline-none focus-visible:ring-2"
                  style={{
                    background: isActive
                      ? accentSoft
                      : surface,
                    border: isActive
                      ? `1.5px solid ${accent}`
                      : `1.5px solid ${hairlineColor}`,
                    color: ink,
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: isDimmed ? 0.45 : 1,
                    boxShadow: isActive
                      ? `0 2px 12px ${accent}33`
                      : "0 1px 2px oklch(0.18 0.02 38 / 0.04)",
                    minHeight: "92px",
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span
                      className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
                      style={{ background: accentSoft, color: accent }}
                    >
                      {isLoadingThis ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </span>
                    <span
                      className="font-bold text-sm leading-tight"
                      style={{ color: ink }}
                    >
                      {card.title}
                    </span>
                  </div>
                  <p
                    className="text-xs leading-snug"
                    style={{ color: inkMuted }}
                  >
                    {card.description}
                  </p>
                </motion.button>
              );
            })}
          </div>

          {/* Empty hint */}
          {!hasPrompt && !loading && !result && !error && !breakerOpen && (
            <p className="text-sm text-center py-2" style={{ color: inkMuted }}>
              Build your prompt above, then pick a card to refine it.
            </p>
          )}

          {/* Loading skeleton */}
          {loading && <RefineSkeleton />}

          {/* Circuit breaker open */}
          {breakerOpen && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 rounded-xl p-4"
              style={{
                background: withAlpha(accentSoft, 0.6),
                border: hairline,
              }}
            >
              <AlertTriangle
                className="w-4 h-4 mt-0.5 shrink-0"
                style={{ color: accent }}
              />
              <div>
                <p className="text-sm font-semibold" style={{ color: ink }}>
                  Refine service is temporarily unavailable
                </p>
                <p className="text-xs mt-1" style={{ color: inkMuted }}>
                  The circuit breaker is open. Try again in a moment.
                </p>
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1.5 text-xs mt-2 px-3 py-1.5 rounded-lg font-semibold"
                  style={{ background: accent, color: "oklch(0.98 0.01 75)" }}
                >
                  <RotateCcw className="w-3 h-3" /> Retry
                </button>
              </div>
            </motion.div>
          )}

          {/* Error state */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 rounded-xl p-4"
              style={{
                background: withAlpha(accentSoft, 0.6),
                border: hairline,
              }}
            >
              <AlertTriangle
                className="w-4 h-4 mt-0.5 shrink-0"
                style={{ color: accent }}
              />
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: ink }}>
                  Refine failed
                </p>
                <p className="text-xs mt-1" style={{ color: inkMuted }}>
                  {error}
                </p>
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1.5 text-xs mt-2 px-3 py-1.5 rounded-lg font-semibold"
                  style={{ background: accent, color: "oklch(0.98 0.01 75)" }}
                >
                  <RotateCcw className="w-3 h-3" /> Retry
                </button>
              </div>
            </motion.div>
          )}

          {/* Results */}
          <AnimatePresence>
            {result && !collapsed && (
              <motion.div
                key="refine-results"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="space-y-5 overflow-hidden"
              >
                {/* Side-by-side diff */}
                <DiffView original={prompt} rewritten={result.rewritten} />

                {/* Notes */}
                {result.notes && (
                  <div>
                    <p
                      className="text-xs font-bold uppercase tracking-wider mb-1.5"
                      style={{ color: inkMuted }}
                    >
                      What changed
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: inkMuted }}>
                      {result.notes}
                    </p>
                  </div>
                )}

                {/* Accept / Reject */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => setShowAcceptModal(true)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
                    style={{ background: accent, color: "oklch(0.98 0.01 75)" }}
                  >
                    <Check className="w-3 h-3" /> Accept &amp; Copy
                  </button>
                  <button
                    onClick={handleReject}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                    style={{
                      background: surface,
                      color: inkMuted,
                      border: hairline,
                    }}
                  >
                    <X className="w-3 h-3" /> Reject
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Accept modal — rendered outside the card to escape stacking contexts */}
      {showAcceptModal && result && (
        <AcceptModal
          rewritten={result.rewritten}
          onClose={() => setShowAcceptModal(false)}
        />
      )}
    </>
  );
}
