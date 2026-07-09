import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  RotateCcw,
  Loader2,
  Wand2,
  Check,
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
import { toast } from "sonner";
import { apiUrl } from "@/lib/apiUrl";
import { accent, accentSoft, surface, ink, inkMuted, hairline, hairlineColor, onAccent, withAlpha } from "@/builder-theme";

// Refine technique cards.
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

// Local type mirror of server/schemas/refine.ts
interface RefineResult {
  rewritten: string;
  applied_techniques: number[];
  notes: string;
}

interface RefineDiffProps {
  prompt: string;
  /** Replace the Builder's blocks with the accepted refinement. */
  onApply?: (rewritten: string) => void;
}

// Loading state — single column, sets the wait expectation.
function RefineSkeleton() {
  return (
    <div className="space-y-3">
      <p className="flex items-center justify-center gap-2 text-sm" style={{ color: inkMuted }}>
        <Loader2 className="w-4 h-4 animate-spin" />
        Refining your prompt…
      </p>
      <div className="space-y-2 animate-pulse">
        <div className="h-4 rounded" style={{ background: hairlineColor, width: "55%" }} />
        <div className="h-20 rounded-lg" style={{ background: hairlineColor }} />
        <div className="h-4 rounded" style={{ background: hairlineColor, width: "70%" }} />
      </div>
    </div>
  );
}

// Main component
export default function RefineDiff({ prompt, onApply }: RefineDiffProps) {
  // The single technique currently loading, if any.
  const [loadingTechnique, setLoadingTechnique] = useState<TechniqueKey | null>(null);
  // The technique that produced the current result.
  const [activeTechnique, setActiveTechnique] = useState<TechniqueKey | null>(null);
  const [result, setResult] = useState<RefineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [breakerOpen, setBreakerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  // When a result exists the technique grid collapses; this re-opens it.
  const [cardsExpanded, setCardsExpanded] = useState(false);

  const hasPrompt = prompt.trim().length > 0;
  const loading = loadingTechnique !== null;
  const showCards = !result || cardsExpanded;
  const activeTitle = TECHNIQUE_CARDS.find((c) => c.key === activeTechnique)?.title ?? "updated";

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
        setCardsExpanded(false);
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
    setCardsExpanded(false);
  }, []);

  // Accept: replace the Builder's blocks with the refinement, copy it, reset.
  const handleAccept = useCallback(() => {
    if (!result) return;
    onApply?.(result.rewritten);
    navigator.clipboard.writeText(result.rewritten).catch(() => {
      /* clipboard unavailable — the blocks were still updated */
    });
    toast.success("Refined prompt applied to your blocks");
    setResult(null);
    setActiveTechnique(null);
    setCollapsed(false);
    setCardsExpanded(false);
  }, [result, onApply]);

  return (
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
          style={{ color: onAccent }}
        >
          <Wand2 className="w-4 h-4" />
          Refine your prompt
        </h4>

        {result && (
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-opacity hover:opacity-80 shrink-0"
            style={{ color: withAlpha(onAccent, 0.85) }}
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
        {/* Result summary row — appears once a refinement exists */}
        {result && (
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: ink }}>
              <Check className="w-3.5 h-3.5" style={{ color: accent }} />
              Refined — {activeTitle}
            </span>
            <button
              onClick={() => setCardsExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded transition-opacity hover:opacity-80"
              style={{ color: accent }}
            >
              {cardsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Try another improvement
            </button>
          </div>
        )}

        {/* Technique picker — full when no result, collapsible once one exists */}
        {showCards && (
          <>
            {!result && (
              <p
                className="text-xs font-bold uppercase tracking-wider mb-3"
                style={{ color: inkMuted }}
              >
                Pick a way to improve your prompt
              </p>
            )}

            <div
              className="grid gap-2.5 mb-4"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))" }}
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
                    className="flex flex-col items-start gap-1.5 rounded-xl p-3 text-left transition-all focus:outline-none"
                    style={{
                      background: isActive ? accentSoft : surface,
                      border: isActive
                        ? `1.5px solid ${accent}`
                        : `1.5px solid ${hairlineColor}`,
                      color: ink,
                      cursor: disabled ? "not-allowed" : "pointer",
                      opacity: isDimmed ? 0.45 : 1,
                    }}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span
                        className="flex items-center justify-center w-6 h-6 rounded-lg shrink-0"
                        style={{ background: accentSoft, color: accent }}
                      >
                        {isLoadingThis ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Icon className="w-3.5 h-3.5" />
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
          </>
        )}

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
                style={{ background: accent, color: onAccent }}
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
                style={{ background: accent, color: onAccent }}
              >
                <RotateCcw className="w-3 h-3" /> Retry
              </button>
            </div>
          </motion.div>
        )}

        {/* Result — plain "what changed" first, then the refined prompt in a
            height-capped scroll box so the panel never runs the page down. */}
        <AnimatePresence>
          {result && !collapsed && (
            <motion.div
              key="refine-results"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-4 overflow-hidden"
            >
              {result.notes && (
                <div
                  className="rounded-lg px-3 py-2.5"
                  style={{ background: surface, border: hairline }}
                >
                  <p
                    className="text-xs font-bold uppercase tracking-wider mb-1"
                    style={{ color: inkMuted }}
                  >
                    What changed
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: ink }}>
                    {result.notes}
                  </p>
                </div>
              )}

              <div>
                <p
                  className="text-xs font-bold uppercase tracking-wider mb-1.5"
                  style={{ color: inkMuted }}
                >
                  Refined prompt
                </p>
                <div
                  className="rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap max-h-[220px] overflow-y-auto"
                  style={{
                    background: accentSoft,
                    border: `1px solid ${hairlineColor}`,
                    color: ink,
                  }}
                >
                  {result.rewritten}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleAccept}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
                  style={{ background: accent, color: onAccent }}
                >
                  <Check className="w-3 h-3" /> Use this prompt
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
                  <X className="w-3 h-3" /> Discard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
