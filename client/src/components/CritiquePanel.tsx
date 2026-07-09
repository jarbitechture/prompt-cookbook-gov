import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, RotateCcw, Loader2, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { apiUrl } from "@/lib/apiUrl";
import { accent, accentSoft, surface, ink, inkMuted, hairline, hairlineColor, onAccent, withAlpha } from "@/builder-theme";

// ─── Local type mirror of server/schemas/critique.ts ──────────────────────────
type RtcoStatus = "present" | "weak" | "missing";
type SuggestionField = "role" | "task" | "context" | "output" | "constraints";

interface Suggestion {
  /** The RTCO block this suggestion's snippet should be added to. */
  field: SuggestionField;
  /** A snippet the user can paste straight into that block. */
  text: string;
}

interface Critique {
  rtco: {
    role: RtcoStatus;
    task: RtcoStatus;
    context: RtcoStatus;
    output: RtcoStatus;
  };
  anti_hallucination_clause: boolean;
  specificity_issues: string[];
  suggestions: Suggestion[];
  cited_chapters: number[];
}

// ─── Props ─────────────────────────────────────────────────────────────────────
interface CritiquePanelProps {
  prompt: string;
  /** Append a snippet to a specific Builder block. */
  onApplyToBlock?: (field: SuggestionField, text: string) => void;
}

// ─── Color helpers ─────────────────────────────────────────────────────────────
const RTCO_STATUS_STYLES: Record<RtcoStatus, { bg: string; border: string; text: string; label: string }> = {
  present: {
    bg: accentSoft,
    border: accent,
    text: ink,
    label: "Present",
  },
  weak: {
    bg: withAlpha(accentSoft, 0.6),
    border: hairlineColor,
    text: inkMuted,
    label: "Weak",
  },
  missing: {
    bg: surface,
    border: accent,
    text: ink,
    label: "Missing",
  },
};

const RTCO_FIELD_COLORS: Record<keyof Critique["rtco"], string> = {
  role:    "oklch(0.52 0.07 210)",
  task:    "oklch(0.52 0.07 240)",
  context: "oklch(0.52 0.07 270)",
  output:  "oklch(0.52 0.07 295)",
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
        style={{ background: styles.border, color: onAccent }}
      >
        {styles.label}
      </span>
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
            style={{ width: "90px", background: hairlineColor }}
          />
        ))}
      </div>
      <div className="h-8 rounded-lg" style={{ background: hairlineColor, width:"180px" }} />
      <div className="space-y-2">
        <div className="h-4 rounded" style={{ background: hairlineColor, width:"70%" }} />
        <div className="h-4 rounded" style={{ background: hairlineColor, width:"55%" }} />
      </div>
      <div className="space-y-2">
        <div className="h-12 rounded-lg" style={{ background: hairlineColor }} />
        <div className="h-12 rounded-lg" style={{ background: hairlineColor }} />
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
const ANTI_HALLUCINATION_CLAUSE =
  "If any fact is unavailable, say so — do not guess or invent details.";

/**
 * Detect whether a prompt already carries an anti-hallucination instruction.
 * Lets the Critique panel reflect reality once the clause is in the prompt —
 * added via the button or typed by the user — instead of nagging on a stale
 * (or weak-model) `anti_hallucination_clause: false` score.
 */
function promptHasAntiHallucinationLine(p: string): boolean {
  return /\b(?:do ?not|don't|never)\s+(?:guess|invent|make ?up|fabricate)\b|if (?:you(?:'re| are)? )?unsure|if any (?:fact|data|detail)|only use the (?:document|data|information)|cite (?:your )?sources?/i.test(p);
}

export default function CritiquePanel({ prompt, onApplyToBlock }: CritiquePanelProps) {
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

      // Server response shape: { result: Critique, flags: [...] }
      const c = (data as { result?: Critique }).result;
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
        border: hairline,
        background: surface,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ background: accent }}
      >
        <h4 className="font-bold text-sm flex items-center gap-2" style={{ color: onAccent }}>
          <ShieldCheck className="w-4 h-4" />
          Critique
        </h4>
        <div className="flex items-center gap-2">
          {result && (
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-opacity hover:opacity-80"
              style={{ color: withAlpha(onAccent, 0.85) }}
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
              background: hasPrompt && !loading ? onAccent : withAlpha(accent, 0.4),
              color: hasPrompt && !loading ? accent : inkMuted,
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
      <div className="px-5 py-4" style={{ background: withAlpha(accentSoft, 0.25) }}>
        {/* Empty state */}
        {!loading && !result && !error && !breakerOpen && (
          <p className="text-sm text-center py-4" style={{ color: inkMuted }}>
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
            style={{ background: withAlpha(accentSoft, 0.6), border: hairline }}
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: accent }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: ink }}>
                Critique service is temporarily unavailable
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
            style={{ background: withAlpha(accentSoft, 0.6), border: hairline }}
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: accent }} />
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: ink }}>
                Analysis failed
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

              {/* Anti-hallucination line — actionable reframe (item 7) */}
              <Section title="Anti-Hallucination Line">
                {(result.anti_hallucination_clause || promptHasAntiHallucinationLine(prompt)) ? (
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold w-fit"
                    style={{ background: accentSoft, border: `1.5px solid ${accent}`, color: ink }}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Included — your prompt tells the AI not to invent facts
                  </div>
                ) : (
                  <div
                    className="rounded-lg px-3 py-2.5"
                    style={{ background: withAlpha(accentSoft, 0.5), border: hairline }}
                  >
                    <p className="text-sm" style={{ color: ink }}>
                      Not added yet. A short line telling the AI not to invent facts
                      keeps county prompts safer — most prompts don't have one.
                    </p>
                    {onApplyToBlock && (
                      <button
                        onClick={() => onApplyToBlock("constraints", ANTI_HALLUCINATION_CLAUSE)}
                        className="mt-2 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-90"
                        style={{ background: accent, color: onAccent }}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Add it to Constraints
                      </button>
                    )}
                  </div>
                )}
              </Section>

              {/* Specificity issues */}
              {result.specificity_issues.length > 0 && (
                <Section title="Specificity Issues">
                  <ul className="space-y-1.5">
                    {result.specificity_issues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm" style={{ color: ink }}>
                        <span
                          className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full"
                          style={{ background: accent }}
                        />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {result.specificity_issues.length === 0 && (
                <Section title="Specificity Issues">
                  <p className="text-sm" style={{ color: inkMuted }}>
                    No specificity issues found.
                  </p>
                </Section>
              )}

              {/* Suggestions — each tagged with the block it improves; Apply
                  routes the snippet to that block, not always Constraints. */}
              <Section title="Suggestions">
                <div className="space-y-2.5">
                  {result.suggestions.map((s, i) => {
                    const fieldLabel = s.field.charAt(0).toUpperCase() + s.field.slice(1);
                    return (
                      <div key={i} className="flex items-start gap-2.5">
                        <span
                          className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full"
                          style={{ background: accent }}
                        />
                        <span className="flex-1 text-sm leading-relaxed" style={{ color: ink }}>
                          {s.text}
                        </span>
                        {onApplyToBlock && (
                          <button
                            onClick={() => onApplyToBlock(s.field, s.text)}
                            className="shrink-0 text-xs px-2.5 py-1 rounded-lg font-semibold transition-opacity hover:opacity-90"
                            style={{ background: accent, color: onAccent }}
                            title={`Add this to the ${fieldLabel} block`}
                          >
                            Add to {fieldLabel}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
