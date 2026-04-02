import { useState, useMemo, useRef, useCallback } from "react";
import { Copy, Check, RotateCcw, Beaker, Play, Loader2, Wrench, Square } from "lucide-react";
import type { TryItVariable } from "@/lib/cookbookData";
import { toast } from "sonner";

interface TryItSectionProps {
  template: string;
  variables: TryItVariable[];
  accentColor?: string;
}

export default function TryItSection({ template, variables, accentColor = "oklch(0.55 0.12 45)" }: TryItSectionProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [response, setResponse] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const preview = useMemo(() => {
    let result = template;
    variables.forEach((v) => {
      const val = values[v.name] || `{{${v.name}}}`;
      result = result.replace(new RegExp(`\\{\\{${v.name}\\}\\}`, "g"), val);
    });
    return result;
  }, [template, variables, values]);

  const allFilled = variables.every((v) => values[v.name]?.trim());
  const filledCount = variables.filter((v) => values[v.name]?.trim()).length;

  const handleCopy = () => {
    navigator.clipboard.writeText(preview).then(() => {
      setCopied(true);
      toast.success("Prompt copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReset = () => {
    setValues({});
    setResponse("");
  };

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  const handleRun = useCallback(async () => {
    if (!allFilled || streaming) return;
    setResponse("");
    setStreaming(true);
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/try-it", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: preview }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        toast.error("Failed to run prompt. Is the server running?");
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) { setStreaming(false); return; }

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              const token = parsed.content || parsed.choices?.[0]?.delta?.content || parsed.token || parsed.text || "";
              accumulated += token;
              setResponse(accumulated);
            } catch {
              if (data.trim()) {
                accumulated += data;
                setResponse(accumulated);
              }
            }
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        toast.error("Error running prompt.");
      }
    } finally {
      setStreaming(false);
    }
  }, [allFilled, streaming, preview]);

  const handleOpenInBuilder = () => {
    // Store the assembled prompt in localStorage for the Builder to pick up
    localStorage.setItem("cookbook-builder-import", preview);
    window.location.href = "/builder";
  };

  return (
    <div
      className="try-it-section rounded-xl overflow-hidden"
      style={{
        border: `1px solid oklch(0.88 0.02 75)`,
      }}
      id="prompt-sandbox"
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ background: accentColor }}
      >
        <h4 className="font-bold text-sm flex items-center gap-2" style={{ color: "oklch(0.98 0.01 75)" }}>
          <Beaker className="w-4 h-4" />
          Try It — Build Your Prompt
        </h4>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: "oklch(0.92 0.02 75)" }}>
            {filledCount}/{variables.length} fields
          </span>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-opacity hover:opacity-80"
            style={{ color: "oklch(0.95 0.01 75)" }}
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>

      <div className="p-5" style={{ background: "oklch(0.975 0.008 75)" }}>
        {/* Variable inputs */}
        <div className="try-it-inputs grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {variables.map((v) => (
            <div key={v.name}>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "oklch(0.38 0.04 45)" }}>
                {v.label}
              </label>
              <input
                type="text"
                value={values[v.name] || ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [v.name]: e.target.value }))}
                placeholder={v.placeholder}
                className="w-full px-3 py-2 rounded-lg text-sm transition-all"
                style={{
                  background: "oklch(1 0 0)",
                  border: values[v.name] ? `1.5px solid ${accentColor}` : "1.5px solid oklch(0.88 0.015 75)",
                  color: "oklch(0.22 0.03 40)",
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = accentColor;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${accentColor}22`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = values[v.name] ? accentColor : "oklch(0.88 0.015 75)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              {v.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {v.suggestions.slice(0, 4).map((s) => (
                    <button
                      key={s}
                      onClick={() => setValues((prev) => ({ ...prev, [v.name]: s }))}
                      className="text-xs px-2.5 py-1 rounded-full transition-all"
                      style={{
                        background: values[v.name] === s ? accentColor : "oklch(0.94 0.01 75)",
                        color: values[v.name] === s ? "oklch(0.98 0.01 75)" : "oklch(0.42 0.04 50)",
                        border: values[v.name] === s ? "none" : "1px solid oklch(0.88 0.015 75)",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Live preview */}
        <div className="try-it-preview">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(0.45 0.04 45)" }}>
              Live Preview
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!allFilled}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                style={{
                  background: allFilled ? "oklch(0.92 0.01 70)" : "oklch(0.88 0.01 75)",
                  color: allFilled ? "oklch(0.35 0.04 45)" : "oklch(0.58 0.03 55)",
                  cursor: allFilled ? "pointer" : "not-allowed",
                  opacity: allFilled ? 1 : 0.5,
                  border: "1px solid oklch(0.85 0.02 70)",
                }}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <div
            className="rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
            style={{
              background: "oklch(0.16 0.02 240)",
              color: "oklch(0.85 0.02 75)",
              fontFamily: "'Courier New', monospace",
              border: "1px solid oklch(0.25 0.03 240)",
            }}
          >
            {preview}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          {streaming ? (
            <button
              onClick={handleStop}
              className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-all"
              style={{
                background: "oklch(0.50 0.16 25)",
                color: "oklch(0.98 0.01 75)",
              }}
            >
              <Square className="w-3.5 h-3.5" /> Stop
            </button>
          ) : (
            <button
              onClick={handleRun}
              disabled={!allFilled}
              className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-all"
              style={{
                background: allFilled ? accentColor : "oklch(0.88 0.01 75)",
                color: allFilled ? "oklch(0.98 0.01 75)" : "oklch(0.58 0.03 55)",
                cursor: allFilled ? "pointer" : "not-allowed",
                opacity: allFilled ? 1 : 0.5,
              }}
            >
              {streaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Run Prompt
            </button>
          )}
          <button
            onClick={handleOpenInBuilder}
            disabled={!allFilled}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition-all"
            style={{
              background: "oklch(0.94 0.01 75)",
              color: allFilled ? "oklch(0.35 0.04 45)" : "oklch(0.58 0.03 55)",
              border: "1px solid oklch(0.85 0.02 70)",
              cursor: allFilled ? "pointer" : "not-allowed",
              opacity: allFilled ? 1 : 0.5,
            }}
          >
            <Wrench className="w-3.5 h-3.5" /> Open in Builder
          </button>
        </div>

        {!allFilled && !response && (
          <p className="text-xs mt-3" style={{ color: "oklch(0.52 0.04 50)" }}>
            Fill in all fields to run the prompt or open it in the Builder.
          </p>
        )}

        {/* AI Response */}
        {(response || streaming) && (
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(0.45 0.04 45)" }}>
                AI Response
              </span>
              {streaming && <Loader2 className="w-3 h-3 animate-spin" style={{ color: accentColor }} />}
            </div>
            <div
              className="rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
              style={{
                background: "oklch(0.998 0.002 70)",
                border: `1px solid oklch(0.90 0.02 75)`,
                color: "oklch(0.25 0.03 40)",
                minHeight: "80px",
              }}
            >
              {response || (streaming ? "Generating..." : "")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
