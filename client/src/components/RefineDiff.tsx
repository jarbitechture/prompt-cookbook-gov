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
} from "lucide-react";
import { diffWordsWithSpace } from "diff";
import { toast } from "sonner";
import { apiUrl } from "@/lib/apiUrl";
import { chapters } from "@/lib/cookbookData";

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

// ─── Color constants (match CritiquePanel exactly) ────────────────────────────
const ACCENT = "oklch(0.48 0.12 220)";

// ─── Loading skeleton ──────────────────────────────────────────────────────────
function RefineSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-4 rounded" style={{ background: "oklch(0.91 0.01 70)", width: "40%" }} />
          <div className="h-24 rounded-lg" style={{ background: "oklch(0.91 0.01 70)" }} />
        </div>
        <div className="space-y-2">
          <div className="h-4 rounded" style={{ background: "oklch(0.91 0.01 70)", width: "40%" }} />
          <div className="h-24 rounded-lg" style={{ background: "oklch(0.91 0.01 70)" }} />
        </div>
      </div>
      <div className="h-4 rounded" style={{ background: "oklch(0.91 0.01 70)", width: "65%" }} />
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
          style={{ color: "oklch(0.48 0.04 50)" }}
        >
          Original
        </p>
        <div
          className="rounded-lg p-3 text-sm leading-relaxed min-h-[80px]"
          style={{
            background: "oklch(0.97 0.01 25)",
            border: "1px solid oklch(0.88 0.04 25)",
            color: "oklch(0.28 0.025 38)",
          }}
        >
          {leftTokens.map((chunk, i) =>
            chunk.removed ? (
              <span
                key={i}
                style={{
                  background: "oklch(0.93 0.05 25)",
                  color: "oklch(0.42 0.18 25)",
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
          style={{ color: "oklch(0.48 0.04 50)" }}
        >
          Rewritten
        </p>
        <div
          className="rounded-lg p-3 text-sm leading-relaxed min-h-[80px]"
          style={{
            background: "oklch(0.96 0.03 155)",
            border: "1px solid oklch(0.80 0.06 155)",
            color: "oklch(0.28 0.025 38)",
          }}
        >
          {rightTokens.map((chunk, i) =>
            chunk.added ? (
              <span
                key={i}
                style={{
                  background: "oklch(0.88 0.06 155)",
                  color: "oklch(0.32 0.14 155)",
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
            background: "oklch(0.998 0.002 70)",
            border: "1px solid oklch(0.88 0.02 220)",
            boxShadow: "0 8px 32px oklch(0.10 0.02 220 / 0.18)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal header */}
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ background: ACCENT }}
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
            <p className="text-xs" style={{ color: "oklch(0.50 0.04 50)" }}>
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
                background: "oklch(0.97 0.006 220)",
                border: "1px solid oklch(0.85 0.04 220)",
                color: "oklch(0.28 0.025 38)",
                fontFamily: "inherit",
              }}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80"
                style={{
                  background: "oklch(0.93 0.01 70)",
                  color: "oklch(0.40 0.04 50)",
                  border: "1px solid oklch(0.85 0.02 70)",
                }}
              >
                Close
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
                style={{
                  background: ACCENT,
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
  const [selectedChapterId, setSelectedChapterId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RefineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [breakerOpen, setBreakerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);

  const hasPrompt = prompt.trim().length > 0;
  const canApply = hasPrompt && selectedChapterId !== undefined && !loading;

  const handleRefine = useCallback(async () => {
    if (!canApply) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setBreakerOpen(false);

    try {
      const res = await fetch(apiUrl("/api/refine"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, chapter_id: selectedChapterId }),
      });

      if (res.status === 503) {
        setBreakerOpen(true);
        setLoading(false);
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
        setLoading(false);
        return;
      }

      let data: unknown;
      try {
        data = await res.json();
      } catch {
        setError("Received invalid response from server.");
        setLoading(false);
        return;
      }

      const r = data as RefineResult;
      if (typeof r?.rewritten !== "string" || !Array.isArray(r?.applied_techniques)) {
        setError("Refine response was malformed.");
        setLoading(false);
        return;
      }

      setResult(r);
      setCollapsed(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Network error. Is the server running?");
      } else {
        setError("Unexpected error.");
      }
    } finally {
      setLoading(false);
    }
  }, [canApply, prompt, selectedChapterId]);

  const handleRetry = useCallback(() => {
    setError(null);
    setBreakerOpen(false);
    handleRefine();
  }, [handleRefine]);

  const handleReject = useCallback(() => {
    setResult(null);
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
          border: "1px solid oklch(0.88 0.02 220)",
          background: "oklch(0.998 0.002 70)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 gap-3"
          style={{ background: ACCENT }}
        >
          <h4
            className="font-bold text-sm flex items-center gap-2 shrink-0"
            style={{ color: "oklch(0.98 0.01 75)" }}
          >
            <Wand2 className="w-4 h-4" />
            Refine with Technique
          </h4>

          <div className="flex items-center gap-2 flex-1 justify-end">
            {/* Chapter selector */}
            <select
              value={selectedChapterId ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedChapterId(v === "" ? undefined : Number(v));
              }}
              className="text-xs rounded-lg px-2 py-1.5 font-medium flex-1 max-w-[260px]"
              style={{
                background: "oklch(0.98 0.01 75)",
                color: ACCENT,
                border: "none",
                cursor: "pointer",
              }}
              aria-label="Select a chapter technique"
            >
              <option value="">— Select a chapter technique —</option>
              {chapters.map((ch) => (
                <option key={ch.number} value={ch.number}>
                  Chapter {ch.number}: {ch.title}
                </option>
              ))}
            </select>

            {/* Collapse toggle (only when result is present) */}
            {result && (
              <button
                onClick={() => setCollapsed((c) => !c)}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-opacity hover:opacity-80 shrink-0"
                style={{ color: "oklch(0.92 0.02 75)" }}
              >
                {collapsed ? (
                  <><ChevronDown className="w-3 h-3" /> Expand</>
                ) : (
                  <><ChevronUp className="w-3 h-3" /> Collapse</>
                )}
              </button>
            )}

            {/* Apply button */}
            <button
              onClick={handleRefine}
              disabled={!canApply}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold transition-all shrink-0"
              style={{
                background: canApply ? "oklch(0.98 0.01 75)" : "oklch(0.70 0.04 220)",
                color: canApply ? ACCENT : "oklch(0.75 0.04 220)",
                cursor: canApply ? "pointer" : "not-allowed",
                opacity: canApply ? 1 : 0.6,
              }}
            >
              {loading ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Refining...</>
              ) : (
                <><Wand2 className="w-3 h-3" /> {result ? "Re-apply" : "Apply technique"}</>
              )}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4" style={{ background: "oklch(0.975 0.008 220 / 0.25)" }}>
          {/* Empty state */}
          {!loading && !result && !error && !breakerOpen && (
            <p className="text-sm text-center py-4" style={{ color: "oklch(0.55 0.04 50)" }}>
              {!hasPrompt
                ? "Build your prompt above, then select a chapter technique to refine it."
                : selectedChapterId === undefined
                ? "Select a chapter technique from the dropdown, then click Apply."
                : "Click Apply technique to see a side-by-side diff."}
            </p>
          )}

          {/* Loading */}
          {loading && <RefineSkeleton />}

          {/* Circuit breaker open */}
          {breakerOpen && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 rounded-xl p-4"
              style={{
                background: "oklch(0.96 0.03 75)",
                border: "1px solid oklch(0.75 0.14 75)",
              }}
            >
              <AlertTriangle
                className="w-4 h-4 mt-0.5 shrink-0"
                style={{ color: "oklch(0.55 0.16 75)" }}
              />
              <div>
                <p className="text-sm font-semibold" style={{ color: "oklch(0.38 0.10 75)" }}>
                  Refine service is temporarily unavailable
                </p>
                <p className="text-xs mt-1" style={{ color: "oklch(0.50 0.08 75)" }}>
                  The circuit breaker is open. Try again in a moment.
                </p>
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1.5 text-xs mt-2 px-3 py-1.5 rounded-lg font-semibold"
                  style={{ background: "oklch(0.75 0.14 75)", color: "oklch(0.98 0.01 75)" }}
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
                background: "oklch(0.96 0.02 25)",
                border: "1px solid oklch(0.70 0.14 25)",
              }}
            >
              <AlertTriangle
                className="w-4 h-4 mt-0.5 shrink-0"
                style={{ color: "oklch(0.52 0.18 25)" }}
              />
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: "oklch(0.38 0.12 25)" }}>
                  Refine failed
                </p>
                <p className="text-xs mt-1" style={{ color: "oklch(0.50 0.08 25)" }}>
                  {error}
                </p>
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1.5 text-xs mt-2 px-3 py-1.5 rounded-lg font-semibold"
                  style={{ background: "oklch(0.52 0.18 25)", color: "oklch(0.98 0.01 75)" }}
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
                      style={{ color: "oklch(0.48 0.04 50)" }}
                    >
                      Technique Notes
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "oklch(0.38 0.04 50)" }}>
                      {result.notes}
                    </p>
                  </div>
                )}

                {/* Applied techniques */}
                {result.applied_techniques.length > 0 && (
                  <div>
                    <p
                      className="text-xs font-bold uppercase tracking-wider mb-2"
                      style={{ color: "oklch(0.48 0.04 50)" }}
                    >
                      Applied Chapters
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.applied_techniques.map((ch) => (
                        <span
                          key={ch}
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{
                            background: "oklch(0.93 0.03 220)",
                            border: "1px solid oklch(0.78 0.08 220)",
                            color: "oklch(0.38 0.10 220)",
                          }}
                        >
                          Ch. {ch}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Accept / Reject */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => setShowAcceptModal(true)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
                    style={{ background: ACCENT, color: "oklch(0.98 0.01 75)" }}
                  >
                    <Check className="w-3 h-3" /> Accept &amp; Copy
                  </button>
                  <button
                    onClick={handleReject}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                    style={{
                      background: "oklch(0.93 0.01 70)",
                      color: "oklch(0.40 0.04 50)",
                      border: "1px solid oklch(0.85 0.02 70)",
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
