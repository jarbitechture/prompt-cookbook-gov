import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, AlertTriangle, RotateCcw, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { apiUrl } from "@/lib/apiUrl";
import { accent, accentSoft, surface, ink, inkMuted, hairline, hairlineColor, withAlpha } from "@/builder-theme";

// ─── Local type mirror of server/schemas/preview.ts ───────────────────────────
interface Preview {
  interpretation: string;
  gaps: string[];
  unclear: string[];
}

// ─── Props ─────────────────────────────────────────────────────────────────────
interface PreviewPanelProps {
  prompt: string;
}

// ─── Loading skeleton ──────────────────────────────────────────────────────────
function PreviewSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 rounded" style={{ background: hairlineColor, width:"80%" }} />
      <div className="h-4 rounded" style={{ background: hairlineColor, width:"65%" }} />
      <div className="h-4 rounded" style={{ background: hairlineColor, width:"72%" }} />
      <div className="space-y-2 mt-4">
        <div className="h-3 rounded" style={{ background: hairlineColor, width:"50%" }} />
        <div className="h-3 rounded" style={{ background: hairlineColor, width:"40%" }} />
      </div>
    </div>
  );
}

// ─── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: inkMuted }}>
        {title}
      </p>
      {children}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function PreviewPanel({ prompt }: PreviewPanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [breakerOpen, setBreakerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handlePreview = useCallback(async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setBreakerOpen(false);

    try {
      const res = await fetch(apiUrl("/api/preview"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
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

      // Light runtime validation — trust server schema but guard critical fields
      const p = data as Preview;
      if (typeof p?.interpretation !== "string" || !Array.isArray(p?.gaps) || !Array.isArray(p?.unclear)) {
        setError("Preview response was malformed.");
        setLoading(false);
        return;
      }

      setResult(p);
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
  }, [prompt, loading]);

  const handleRetry = useCallback(() => {
    setError(null);
    setBreakerOpen(false);
    handlePreview();
  }, [handlePreview]);

  const hasPrompt = prompt.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="rounded-xl overflow-hidden"
      style={{
        border: hairline,
        background: surface,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ background: accent }}
      >
        <h4 className="font-bold text-sm flex items-center gap-2" style={{ color: "oklch(0.98 0.01 75)" }}>
          <Eye className="w-4 h-4" />
          Preview How This Lands
        </h4>
        <div className="flex items-center gap-2">
          {result && (
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-opacity hover:opacity-80"
              style={{ color: "oklch(0.92 0.02 75)" }}
            >
              {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              {collapsed ? "Expand" : "Collapse"}
            </button>
          )}
          <button
            onClick={handlePreview}
            disabled={!hasPrompt || loading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
            style={{
              background: hasPrompt && !loading ? "oklch(0.98 0.01 75)" : withAlpha(accent, 0.4),
              color: hasPrompt && !loading ? accent : inkMuted,
              cursor: hasPrompt && !loading ? "pointer" : "not-allowed",
              opacity: hasPrompt && !loading ? 1 : 0.6,
            }}
          >
            {loading ? (
              <><Loader2 className="w-3 h-3 animate-spin" /> Previewing...</>
            ) : (
              <><Eye className="w-3 h-3" /> {result ? "Re-preview" : "Preview"}</>
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4" style={{ background: withAlpha(accentSoft, 0.25) }}>
        {/* Persistent disclaimer banner — always visible */}
        <div
          className="flex items-start gap-2 rounded-lg px-3 py-2.5 mb-4 text-xs"
          style={{
            background: withAlpha(accentSoft, 0.6),
            border: hairline,
            color: inkMuted,
          }}
        >
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: accent }} />
          <span>
            This is a simulation — actual results from Copilot or ChatGPT will vary.
          </span>
        </div>

        {/* Empty state */}
        {!loading && !result && !error && !breakerOpen && (
          <p className="text-sm text-center py-4" style={{ color: inkMuted }}>
            {hasPrompt
              ? "Click Preview to simulate how an AI model will interpret your prompt."
              : "Build your prompt above, then preview it here."}
          </p>
        )}

        {/* Loading */}
        {loading && <PreviewSkeleton />}

        {/* Circuit breaker open */}
        {breakerOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-xl p-4"
            style={{ background: withAlpha(accentSoft, 0.6), border: hairline }}
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: accent }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: ink }}>
                Preview service is temporarily unavailable
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
            style={{ background: withAlpha(accentSoft, 0.6), border: hairline }}
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: accent }} />
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: ink }}>
                Preview failed
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
              key="preview-results"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-5 overflow-hidden"
            >
              {/* Interpretation */}
              <Section title="Interpretation">
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: ink }}
                >
                  {result.interpretation}
                </p>
              </Section>

              {/* Gaps */}
              <Section title="Gaps">
                {result.gaps.length === 0 ? (
                  <p className="text-sm" style={{ color: inkMuted }}>
                    No gaps found.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {result.gaps.map((gap, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm" style={{ color: ink }}>
                        <span
                          className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full"
                          style={{ background: accent }}
                        />
                        {gap}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              {/* Unclear */}
              <Section title="Unclear">
                {result.unclear.length === 0 ? (
                  <p className="text-sm" style={{ color: inkMuted }}>
                    Nothing unclear.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {result.unclear.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm" style={{ color: inkMuted }}>
                        <span
                          className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full"
                          style={{ background: accent }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
