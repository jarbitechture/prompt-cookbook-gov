/**
 * Type declarations for roi-sidecar.js (Task #9).
 *
 * Mirrors the public API of roi-sidecar.js so TypeScript consumers
 * (server/lib/roi-emit.ts, server/lib/llm-endpoints.ts) pass `tsc --noEmit`
 * without requiring allowJs / checkJs on the main tsconfig.
 */

/** All valid ROI event kinds (schema 1.2.0 + cookbook Task #9 kinds). */
export declare const EventKind: {
  readonly LLM_CALL: "llm_call";
  readonly TOOL_INVOCATION: "tool_invocation";
  readonly GPT_PICK: "gpt_pick";
  readonly PROJECT_ACCESS: "project_access";
  readonly FILE_INTERACTION: "file_interaction";
  readonly RAG_HIT: "rag_hit";
  readonly LICENSE_LIFECYCLE: "license_lifecycle";
  readonly HEADCOUNT_ATTESTATION: "headcount_attestation";
  readonly FEEDBACK: "feedback";
  readonly ESCALATION: "escalation";
  readonly TRAINING_INTERACTION: "training_interaction";
  readonly SESSION_START: "session_start";
  readonly PROMPT_RECEIVED: "prompt_received";
  readonly STREAM_COMPLETE: "stream_complete";
  readonly CITATION_SURFACED: "citation_surfaced";
  readonly FOLLOWUP_ACTION: "followup_action";
  readonly PROMPT_CRITIQUE: "prompt_critique";
  readonly PROMPT_REFINE: "prompt_refine";
  readonly PROMPT_PREVIEW: "prompt_preview";
};

/** Generate a W3C-compatible trace_id (32 lowercase hex chars). */
export declare function newTraceId(): string;

/** Generate a W3C-compatible span_id (16 lowercase hex chars). */
export declare function newSpanId(): string;

/** Start the background fallback-drain loop (idempotent). */
export declare function startDrainLoop(): void;

/** Stop the background fallback-drain loop. */
export declare function stopDrainLoop(): void;

/** Return current circuit-breaker + drain statistics. */
export declare function breakerStatus(): Promise<{
  state: "closed" | "open" | "half_open";
  consecutive_failures: number;
  dropped_events_total: number;
  fallback_count: number;
  last_drain_ts: number | null;
  last_drain_count: number;
  drained_total: number;
}>;

/** Partial event shape accepted by emitEvent and withRoiEvent context. */
export interface RoiEventPartial {
  event_kind: string;
  workflow: string;
  user_id: string;
  dept: string;
  role_band: string;
  task_type: string;
  tool: string;
  success: boolean;
  surface?: string;
  duration_s?: number;
  started_at?: string;
  prompt_tokens?: number | null;
  output_tokens?: number | null;
  trace_id?: string | null;
  span_id?: string | null;
  parent_event_id?: string | null;
  [key: string]: unknown;
}

/**
 * Fire-and-forget ROI event emission (Task #9).
 * Fills defaults and calls void dispatch(event) — never blocks caller.
 */
export declare function emitEvent(partial: RoiEventPartial): void;

/**
 * Wrap an async handler in a single blocking ROI event emission.
 * NOTE: awaits dispatch — do NOT use for fire-and-forget paths.
 */
export declare function withRoiEvent<T>(
  ctx: {
    workflow: string;
    user_id: string;
    dept: string;
    role_band: string;
    task_type: string;
    tool: string;
    surface?: string;
    event_kind?: string;
    trace_id?: string | null;
    span_id?: string | null;
    parent_event_id?: string | null;
  },
  fn: (usage: { prompt_tokens?: number; output_tokens?: number }) => Promise<T>
): Promise<T>;
