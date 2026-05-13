import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, AlertTriangle, RotateCcw, Loader2, ShieldCheck, ShieldOff, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { apiUrl } from "@/lib/apiUrl";

// ─── Local type mirror of server/schemas/critique.ts ──────────────────────────
type RtcoStatus = "present" | "weak" | "missing";

interface Critique {
  rtco: {
    role: RtcoStatus;
    task: RtcoStatus;
    context: RtcoStatus;
    output: RtcoStatus;
  };
  anti_hallucination_clause: boolean;
  specificity_issues: string[];
  suggestions: string[];
  cited_chapters: number[];
}

// ─── Props ─────────────────────────────────────────────────────────────────────
interface CritiquePanelProps {
  prompt: string;
  onApplySuggestion?: (suggestion: string) => void;
}

// ─── Color helpers ─────────────────────────────────────────────────────────────
const ACCENT = "oklch(0.48 0.12 220)";

const RTCO_STATUS_STYLES: Record<RtcoStatus, { bg: string; border: string; text: string; label: string }> = {
  present: {
    bg: "oklch(0.94 0.04 155)",
    border: "oklch(0.42 0.14 155)",
    text: "oklch(0.32 0.12 155)",
    label: "Present",
  },
  weak: {
    bg: "oklch(0.95 0.04 75)",
    border: "oklch(0.58 0.14 75)",
    text: "oklch(0.42 0.12 75)",
    label: "Weak",
  },
  missing: {
    bg: "oklch(0.95 0.04 25)",
    border: "oklch(0.52 0.18 25)",
    text: "oklch(0.40 0.14 25)",
    label: "Missing",
  },
};

const RTCO_FIELD_COLORS: Record<keyof Critique["rtco"], string> = {
  role: "oklch(0.45 0.14 250)",
  task: "oklch(0.42 0.14 155)",
  context: "oklch(0.50 0.14 75)",
  output: "oklch(0.45 0.12 310)",
};

// ─── Sub-components ────────────────────────────────────────────────────────────
function RtcoPill({ field, status }: { field: keyof Critique["rtco"]; status: RtcoStatus }) {
  const styles = RTCO_STATUS_STYLES[status];
  const fieldColor = RTCO_FIELD_COLORS[field];
  const label = field.charAt(0).toUpperCase() + field.slice(1);

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
      style={{ background: styles.bg, border: `1.5px solid ${styles.border}` }}
    >
      <span style={{ color: fieldColor }}>{label}</span>
      <span
        className="px-1.5 py-0.5 rounded-full text-xs font-bold"
        style={{ background: styles.border, color: "oklch(0.98 0.01 75)" }}
      >
        {styles.label}
      </span>
    </div>
  );
}

function CopiedButton({ text, onApply }: { text: string; onApply?: (s: string) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Suggestion copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    });
  }, [text]);

  const handleApply = useCallback(() => {
    if (onApply) {
      onApply(text);
      toast.success("Suggestion added to Constraints block");
    } else {
      handleCopy();
    }
  }, [text, onApply, handleCopy]);

  return (
    <div className="flex items-start gap-3">
      <span
        className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full"
        style={{ background: ACCENT, marginTop: "6px" }}
      />
      <span
        className="flex-1 text-sm leading-relaxed"
        style={{ color: "oklch(0.28 0.025 38)" }}
      >
        {text}
      </span>
      <button
        onClick={handleApply}
        className="shrink-0 flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold transition-all"
        style={{
          background: onApply ? ACCENT : "oklch(0.93 0.01 70)",
          color: onApply ? "oklch(0.98 0.01 75)" : "oklch(0.40 0.04 50)",
          border: onApply ? "none" : "1px solid oklch(0.85 0.02 70)",
        }}
        title={onApply ? "Add to Constraints block" : "Copy to clipboard"}
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {onApply ? "Apply" : copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

// ─── Loading skeleton ──────────────────────────────────────────────────────────
function CritiqueSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-8 rounded-lg"
            style={{ width: "90px", background: "oklch(0.91 0.01 70)" }}
          />
        ))}
      </div>
      <div className="h-8 rounded-lg" style={{ background: "oklch(0.91 0.01 70)", width: "180px" }} />
      <div className="space-y-2">
        <div className="h-4 rounded" style={{ background: "oklch(0.91 0.01 70)", width: "70%" }} />
        <div className="h-4 rounded" style={{ background: "oklch(0.91 0.01 70)", width: "55%" }} />
      </div>
      <div className="space-y-2">
        <div className="h-12 rounded-lg" style={{ background: "oklch(0.91 0.01 70)" }} />
        <div className="h-12 rounded-lg" style={{ background: "oklch(0.91 0.01 70)" }} />
      </div>
    </div>
  );
}

// ─── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: "oklch(0.48 0.04 50)" }}>
        {title}
      </p>
      {children}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function CritiquePanel({ prompt, onApplySuggestion }: CritiquePanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Critique | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [breakerOpen, setBreakerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleCritique = useCallback(async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setBreakerOpen(false);

    try {
      const res = await fetch(apiUrl("/api/critique"), {
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
      const c = data as Critique;
      if (!c?.rtco || !Array.isArray(c?.suggestions)) {
        setError("Critique response was malformed.");
        setLoading(false);
        return;
      }

      setResult(c);
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
    handleCritique();
  }, [handleCritique]);

  const hasPrompt = prompt.trim().length > 0;

  return (
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
        className="flex items-center justify-between px-5 py-3"
        style={{ background: ACCENT }}
      >
        <h4 className="font-bold text-sm flex items-center gap-2" style={{ color: "oklch(0.98 0.01 75)" }}>
          <ShieldCheck className="w-4 h-4" />
          Critique My Prompt
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
            onClick={handleCritique}
            disabled={!hasPrompt || loading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
            style={{
              background: hasPrompt && !loading ? "oklch(0.98 0.01 75)" : "oklch(0.70 0.04 220)",
              color: hasPrompt && !loading ? ACCENT : "oklch(0.75 0.04 220)",
              cursor: hasPrompt && !loading ? "pointer" : "not-allowed",
              opacity: hasPrompt && !loading ? 1 : 0.6,
            }}
          >
            {loading ? (
              <><Loader2 className="w-3 h-3 animate-spin" /> Analyzing...</>
            ) : (
              <><ShieldCheck className="w-3 h-3" /> {result ? "Re-analyze" : "Analyze"}</>
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4" style={{ background: "oklch(0.975 0.008 220 / 0.25)" }}>
        {/* Empty state */}
        {!loading && !result && !error && !breakerOpen && (
          <p className="text-sm text-center py-4" style={{ color: "oklch(0.55 0.04 50)" }}>
            {hasPrompt
              ? "Click Analyze to get a structured critique of your prompt."
              : "Build your prompt above, then analyze it here."}
          </p>
        )}

        {/* Loading */}
        {loading && <CritiqueSkeleton />}

        {/* Circuit breaker open */}
        {breakerOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-xl p-4"
            style={{ background: "oklch(0.96 0.03 75)", border: "1px solid oklch(0.75 0.14 75)" }}
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "oklch(0.55 0.16 75)" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "oklch(0.38 0.10 75)" }}>
                Critique service is temporarily unavailable
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
            style={{ background: "oklch(0.96 0.02 25)", border: "1px solid oklch(0.70 0.14 25)" }}
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "oklch(0.52 0.18 25)" }} />
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "oklch(0.38 0.12 25)" }}>
                Analysis failed
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
              key="critique-results"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-5 overflow-hidden"
            >
              {/* RTCO checklist */}
              <Section title="RTCO Completeness">
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(result.rtco) as [keyof Critique["rtco"], RtcoStatus][]).map(
                    ([field, status]) => (
                      <RtcoPill key={field} field={field} status={status} />
                    )
                  )}
                </div>
              </Section>

              {/* Anti-hallucination clause */}
              <Section title="Anti-Hallucination Clause">
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold w-fit"
                  style={{
                    background: result.anti_hallucination_clause
                      ? "oklch(0.94 0.04 155)"
                      : "oklch(0.95 0.04 25)",
                    border: `1.5px solid ${result.anti_hallucination_clause ? "oklch(0.42 0.14 155)" : "oklch(0.52 0.18 25)"}`,
                    color: result.anti_hallucination_clause
                      ? "oklch(0.32 0.12 155)"
                      : "oklch(0.40 0.14 25)",
                  }}
                >
                  {result.anti_hallucination_clause ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : (
                    <ShieldOff className="w-4 h-4" />
                  )}
                  {result.anti_hallucination_clause ? "Clause present" : "Clause missing"}
                </div>
              </Section>

              {/* Specificity issues */}
              {result.specificity_issues.length > 0 && (
                <Section title="Specificity Issues">
                  <ul className="space-y-1.5">
                    {result.specificity_issues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "oklch(0.40 0.08 25)" }}>
                        <span
                          className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full"
                          style={{ background: "oklch(0.52 0.18 25)" }}
                        />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {result.specificity_issues.length === 0 && (
                <Section title="Specificity Issues">
                  <p className="text-sm" style={{ color: "oklch(0.42 0.14 155)" }}>
                    No specificity issues found.
                  </p>
                </Section>
              )}

              {/* Suggestions */}
              <Section title="Suggestions">
                <div className="space-y-3">
                  {result.suggestions.map((s, i) => (
                    <CopiedButton key={i} text={s} onApply={onApplySuggestion} />
                  ))}
                </div>
              </Section>

              {/* Cited chapters */}
              {result.cited_chapters.length > 0 && (
                <Section title="Related Chapters">
                  <div className="flex flex-wrap gap-2">
                    {result.cited_chapters.map((ch) => (
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
                </Section>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
