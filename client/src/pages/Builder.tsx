import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench,
  Copy,
  Check,
  Clock,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  ArrowRight,
  FileText,
  Building2,
  Eye,
  EyeOff,
  GripVertical,
  Home,
  Shield,
  HardHat,
  Heart,
  Landmark,
  Database,
} from "lucide-react";
// Link removed: Builder only navigates cross-bundle (to /cookbook/) — use plain <a>
import { toast } from "sonner";
import { apiUrl } from "@/lib/apiUrl";
import {
  sendToTarget,
  sendRedactedToTarget,
  emitPiiFlagged,
  PiiDetectedError,
} from "@/lib/copilot-handoff";
import { scanForPii, type ScanMatch } from "@/lib/pre-send-scan";
import PiiWarningModal from "@/components/PiiWarningModal";
import { personas } from "@/lib/personas";
import type { Persona } from "@/lib/personas";
import { getDepartment } from "@/lib/departments";
import CritiquePanel from "@/components/CritiquePanel";
import RefineDiff from "@/components/RefineDiff";
import PreviewPanel from "@/components/PreviewPanel";
import { parseRefinedRtco } from "@/lib/refined-prompt";
import { accent as ACCENT, accentSoft as ACCENT_LIGHT, bg as BG, surface as SURFACE, ink as INK, inkMuted as INK_MUTED, hairline as HAIRLINE, hairlineColor as HAIRLINE_COLOR, onAccent as ON_ACCENT, withAlpha } from "@/builder-theme";

/* ─── Color System ─── */

// Desaturated cool-arc palette — hues 210/240/270/295/315, chroma 0.04–0.08.
// All five remain visually distinct with no warm hues.
const BLOCK_COLORS: Record<string, { border: string; text: string; bg: string }> = {
  role:        { border: "oklch(0.48 0.08 210)", text: "oklch(0.52 0.07 210)", bg: "oklch(0.96 0.02 210)" },
  task:        { border: "oklch(0.46 0.08 240)", text: "oklch(0.52 0.07 240)", bg: "oklch(0.96 0.02 240)" },
  context:     { border: "oklch(0.48 0.07 270)", text: "oklch(0.54 0.06 270)", bg: "oklch(0.96 0.02 270)" },
  output:      { border: "oklch(0.48 0.08 295)", text: "oklch(0.54 0.07 295)", bg: "oklch(0.96 0.02 295)" },
  constraints: { border: "oklch(0.50 0.07 315)", text: "oklch(0.56 0.06 315)", bg: "oklch(0.96 0.02 315)" },
};

/* ─── Block Definitions ─── */
interface BlockDef {
  id: string;
  label: string;
  subLabel?: string; // short plain-language descriptor under the block label
  previewLabel: string;
  placeholder: string;
  helpText?: string;
  multiline: boolean;
  rows?: number;
}

// RTCO core blocks. The previous Builder also offered three technique-gated
// optional blocks (examples, reasoning, steps). Those were removed alongside
// the top TECHNIQUES chip row — technique-specific refinements now happen
// inside the RefineDiff card grid, which speaks plain language and doesn't
// require the user to learn dev jargon ("Few-Shot", "CoT", "Task Chain").
const ALL_BLOCKS: BlockDef[] = [
  { id: "role", label: "Role", subLabel: "Who the AI should act as", previewLabel: "Role:", placeholder: "e.g. Budget Analyst, IT Help Desk Tech, HR Specialist", helpText: "What role should the AI play? Be specific — 'county budget analyst' beats 'analyst'.", multiline: false },
  { id: "task", label: "Task", subLabel: "What you need done", previewLabel: "Task:", placeholder: "What do you need done?", helpText: "What exactly should the AI do? Use action verbs: draft, summarize, analyze, create.", multiline: true, rows: 3 },
  { id: "context", label: "Context", subLabel: "Background the AI needs", previewLabel: "Context:", placeholder: "Background information, situation details, relevant data...", helpText: "What does the AI need to know? Department, audience, deadline, data.", multiline: true, rows: 3 },
  { id: "output", label: "Output Format", subLabel: "How the result should look", previewLabel: "Output:", placeholder: "e.g. bullet list, memo, table, structured report", helpText: "How should the result look? Bullet list, memo, table, email, 3 paragraphs.", multiline: false },
  { id: "constraints", label: "Constraints", subLabel: "Limits and rules to follow", previewLabel: "Constraints:", placeholder: "Limits, rules, requirements, word counts...", helpText: "What should the AI avoid? Word limits, tone rules, things NOT to include.", multiline: true, rows: 2 },
];

/* ─── Template Data ─── */
interface Template {
  id: string;
  label: string;
  category: string;
  icon: typeof Building2;
  role: string;
  task: string;
  context: string;
  output: string;
  constraints: string;
}

/**
 * Parse a labeled RTCO template string into per-block values.
 * Department templates and imported prompts arrive as one string like
 * "Role: ...\nTask: ...\nConstraints: ...\nOutput: ..." — without this they
 * were dumped whole into the Task block. Lines after a recognized label
 * (continuation lines) append to that section. If NO label is recognized the
 * whole string falls back to Task, preserving behavior for free-form imports.
 */
function parseRtcoTemplate(raw: string): Record<string, string> {
  const LABELS: Record<string, string> = {
    role: "role",
    task: "task",
    context: "context",
    output: "output",
    "output format": "output",
    constraints: "constraints",
  };
  const out: Record<string, string> = {};
  let current: string | null = null;
  let matched = false;
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Za-z][A-Za-z ]*?)\s*:\s*(.*)$/);
    const key = m ? LABELS[m[1].trim().toLowerCase()] : undefined;
    if (m && key) {
      matched = true;
      current = key;
      out[key] = out[key] ? `${out[key]}\n${m[2]}` : m[2];
    } else if (current) {
      out[current] = out[current] ? `${out[current]}\n${line}` : line;
    }
  }
  if (!matched) return { task: raw };
  for (const k of Object.keys(out)) out[k] = out[k].trim();
  return out;
}

interface CategoryGroup {
  name: string;
  icon: typeof Building2;
  templates: Template[];
}

const templates: Template[] = [
  // Resident Services
  { id: "utility-billing", label: "Utility Billing Response", category: "Resident Services", icon: Home, role: "Utility Billing Specialist for Manatee County", task: "Draft a response to a resident inquiry about their water/sewer bill", context: "The resident received a bill that is significantly higher than their average. They called 311 to dispute the charge. Account shows a spike in usage during the billing period.", output: "Professional letter with greeting, explanation of the charge, steps the resident can take (request a meter re-read, check for leaks), and contact information for further assistance", constraints: "Keep tone empathetic and professional. Do not disclose account details beyond what the resident already knows. Under 300 words." },
  { id: "311-report", label: "311 Report Summary", category: "Resident Services", icon: Home, role: "311 Call Center Supervisor", task: "Summarize weekly 311 service request data for department heads", context: "Week of [DATE RANGE]. Total calls: [N]. Top categories: [CATEGORY 1] ([X]%), [CATEGORY 2] ([X]%), [CATEGORY 3] ([X]%), [CATEGORY 4] ([X]%), [CATEGORY 5] ([X]%)", output: "Executive summary with a table of top 5 categories by volume, trend comparison to prior week, and 3 recommended actions", constraints: "Keep under 400 words. Flag any category with >20% week-over-week increase." },
  { id: "library-program", label: "Library Program Description", category: "Resident Services", icon: Home, role: "Library Program Coordinator for Manatee County Public Libraries", task: "Write a promotional description for a new community program", context: "The library is launching a 'Tech Tuesdays' program offering free one-hour technology workshops for seniors at all 6 branch locations starting May 2026", output: "Program description suitable for the county website and social media, including schedule, topics covered, registration info, and a call to action", constraints: "Friendly, welcoming tone. ADA-compliant language. Include both English and Spanish registration phone numbers. Under 200 words." },

  // Infrastructure & Safety
  { id: "road-maintenance", label: "Road Maintenance Report", category: "Infrastructure & Safety", icon: Shield, role: "Public Works Road Maintenance Supervisor", task: "Generate a quarterly road maintenance status report", context: "[QUARTER] data: [N] potholes repaired, [N] miles resurfaced, [N] drainage improvements completed. Budget spent: $[X] of $[Y] annual allocation.", output: "Formatted report with executive summary, work completed table, budget tracker, and upcoming next-quarter priorities", constraints: "Include map reference numbers for all completed projects. Flag any project over budget by more than 10%." },
  { id: "emergency-alert", label: "Emergency Alert Draft", category: "Infrastructure & Safety", icon: Shield, role: "Emergency Management Public Information Officer", task: "Draft a multi-channel emergency alert for residents", context: "Tropical Storm approaching Manatee County. Expected landfall in 48 hours. Category: Tropical Storm Warning. Anticipated impacts: 4-6 inches of rain, 45-60 mph winds, potential storm surge 2-4 feet in coastal areas.", output: "Three versions: (1) SMS/text alert under 160 characters, (2) social media post under 280 characters, (3) full website alert with preparation checklist", constraints: "Use plain language at 8th grade reading level. Include shelter locations and evacuation zone lookup URL. No speculation about storm path changes." },
  { id: "traffic-study", label: "Traffic Study Request", category: "Infrastructure & Safety", icon: Shield, role: "Transportation Planning Analyst for Manatee County", task: "Prepare a traffic study request memo for a proposed development", context: "Developer has submitted plans for a [N]-unit residential complex at the intersection of [ROAD 1] and [ROAD 2]. Current ADT at intersection: [N] vehicles. Level of Service: [LOS GRADE].", output: "Formal memo requesting a Traffic Impact Analysis including scope of study, required intersections, peak hour analysis periods, and developer obligations", constraints: "Reference Manatee County Land Development Code Chapter 8. Include FDOT coordination requirements for state roads." },

  // Development & Building
  { id: "permit-response", label: "Permit Application Response", category: "Development & Building", icon: HardHat, role: "Building Services Plan Reviewer for Manatee County", task: "Draft a response to a commercial building permit application", context: "Application #BLD-2026-04521 for a 12,000 sq ft retail building. First review identified 7 code deficiencies across structural, electrical, and accessibility categories.", output: "Formal review letter listing each deficiency with code reference, description of the issue, and required corrective action. Include resubmittal instructions.", constraints: "Reference specific Florida Building Code sections. Professional tone. Include 30-day resubmittal deadline and contact information for questions." },
  { id: "bid-summary", label: "Bid Summary", category: "Development & Building", icon: HardHat, role: "Procurement Analyst for Manatee County", task: "Summarize competitive bid responses for a county construction project", context: "RFP #[NUMBER] for [PROJECT DESCRIPTION]. [N] bids received ranging from $[LOW] to $[HIGH]. Evaluation criteria: price ([X]%), experience ([X]%), timeline ([X]%), local preference ([X]%).", output: "Bid comparison matrix with scoring, narrative summary of top 3 bidders, and staff recommendation", constraints: "Follow Manatee County Procurement Ordinance. Do not include proprietary pricing details that bidders marked confidential." },
  { id: "property-record", label: "Property Record Letter", category: "Development & Building", icon: HardHat, role: "Property Appraiser Records Specialist", task: "Draft a response to a public records request for property information", context: "Request received for all permits, liens, and code enforcement actions on parcel ID 1234-5678-9012 from 2020 to present.", output: "Cover letter with summary of records found, itemized list of documents being provided, and note of any exemptions applied", constraints: "Comply with Florida Public Records Law (Chapter 119). Redact any exempt information. Include fee calculation if applicable." },

  // Human Services
  { id: "assistance-letter", label: "Assistance Program Letter", category: "Human Services", icon: Heart, role: "Human Services Case Manager for Manatee County", task: "Draft an eligibility determination letter for a county assistance program", context: "Applicant applied for the [PROGRAM NAME]. Household income verified at [X]% AMI (Area Median Income). Program threshold is [X]% AMI.", output: "Formal notification letter with eligibility determination, benefit amount, program requirements, and appeal rights", constraints: "Use plain language. Include required legal notices. Provide both English and Spanish helpline numbers." },
  { id: "animal-services", label: "Animal Services Notice", category: "Human Services", icon: Heart, role: "Animal Services Officer for Manatee County", task: "Draft a notice to a pet owner regarding a compliance issue", context: "Complaint received about unlicensed dogs at a residential property. Officer confirmed 3 dogs on premises, none with current Manatee County pet licenses or rabies vaccination tags.", output: "Official notice letter with violation description, required corrective actions, compliance deadline, and penalty schedule", constraints: "Reference Manatee County Code of Ordinances Chapter 14. Include licensing fee schedule and vaccination clinic locations." },
  { id: "veteran-referral", label: "Veteran Referral", category: "Human Services", icon: Heart, role: "Veterans Services Coordinator for Manatee County", task: "Create a referral package for a veteran seeking multiple services", context: "Vietnam-era veteran, age 74, seeking assistance with property tax exemption, healthcare enrollment, and home modification for mobility issues.", output: "Referral document listing each service needed, the responsible agency, contact person, required documents, and next steps for the veteran", constraints: "Include both county and VA resources. Provide transportation assistance options. Use respectful, non-clinical language." },

  // Government Administration
  { id: "records-request", label: "Records Request Response", category: "Government Administration", icon: Landmark, role: "Public Records Coordinator for Manatee County", task: "Draft a response to a public records request", context: "Media organization submitted a broad request for all emails between county commissioners regarding the FY2027 budget from January through March 2026.", output: "Formal response letter with scope acknowledgment, estimated records volume, timeline for production, cost estimate, and any applicable exemptions", constraints: "Comply with Florida Statute 119. Cite specific exemptions if withholding any records. Provide 30-day production timeline." },
  { id: "public-comment", label: "Public Comment Summary", category: "Government Administration", icon: Landmark, role: "Board of County Commissioners Administrative Analyst", task: "Summarize public comments received during a comment period", context: "45-day public comment period for the proposed Comprehensive Plan amendment allowing mixed-use development in the Lakewood Ranch area. 234 comments received via email, online portal, and public meetings.", output: "Executive summary with comment statistics, top themes with representative quotes, sentiment breakdown, and staff response to major concerns", constraints: "Neutral, factual tone. Do not editorialize. Include both supporting and opposing viewpoints proportionally." },
  { id: "performance-report", label: "Performance Report", category: "Government Administration", icon: Landmark, role: "Performance Management Analyst for Manatee County", task: "Draft a quarterly department performance report", context: "[DEPARTMENT NAME] [QUARTER]. Key metrics: average permit review time [N] days (target: [N]), customer satisfaction [N]/5.0 (target: [N]), revenue $[X] (target: $[Y]).", output: "Performance dashboard narrative with KPI table, trend analysis, root cause for any missed targets, and improvement action items", constraints: "Align with the county's strategic plan pillars. Include year-over-year comparison. Flag any metric that missed target by more than 15%." },

  // IT & Data
  { id: "it-troubleshoot", label: "IT Troubleshooting Guide", category: "IT & Data", icon: Database, role: "IT Help Desk Technician for Manatee County", task: "Create a step-by-step troubleshooting guide for a common issue", context: "Multiple county employees report being unable to [DESCRIBE ISSUE]. Affecting approximately [N] users across [N] departments.", output: "Numbered troubleshooting steps from simplest to most complex, with screenshots placeholders, escalation criteria, and known workarounds", constraints: "Write for non-technical county staff. Include both Windows 10 and Windows 11 instructions. Mark any step that requires admin privileges." },
  { id: "meeting-summarizer", label: "Meeting Summarizer", category: "IT & Data", icon: Database, role: "Meeting Analyst for Manatee County", task: "Summarize a meeting recording transcript into an actionable format", context: "From a Microsoft Teams or Stream recording of a department staff meeting", output: "Structured summary with sections: Overview (2-3 sentences), Key Discussion Points (bullets), Decisions Made, Action Items (with owner and due date), Next Steps", constraints: "Keep under 400 words. Use direct, factual language. Attribute action items to specific individuals mentioned in the transcript." },
  { id: "spreadsheet-gen", label: "Spreadsheet Generator", category: "IT & Data", icon: Database, role: "Data Analyst for Manatee County government", task: "Design a spreadsheet structure for tracking department data", context: "Department needs to track employee training compliance across [N] required courses for [N]+ staff members with quarterly reporting to HR", output: "Column headers with data types, sample formulas for completion percentages, conditional formatting rules, and pivot table structure for quarterly reports", constraints: "Keep formulas simple enough for intermediate Excel users. Include data validation rules to prevent entry errors. Design for both Excel and Google Sheets compatibility." },

  // Business Analysis (BA/BRM)
  { id: "sbar-draft", label: "SBAR Draft", category: "IT & Data", icon: Database, role: "Business Analyst and Business Relationship Manager on the BA/BRM team in Manatee County IT Services", task: "Take the intake information below and produce a draft SBAR — Situation, Background, Assessment, Recommendation — for the Project Management Office.", context: "The county runs Microsoft 365 with Copilot, SharePoint Online, Entra ID single sign-on, and Halo ticketing. New vendor software requires a security assessment. Relevant policy: IT Policy R-18-159, AI Policy AI-001, and Florida public records law (F.S. Ch. 119). Intake — Department: [DEPARTMENT]. What they use today: [WHAT THEY USE TODAY]. Vendor if named: [VENDOR IF NAMED]. Sensitive data flags: [SENSITIVE DATA FLAGS]. Known constraints: [KNOWN CONSTRAINTS].", output: "Four sections — Situation, Background, Assessment, Recommendation. Bullet points, not paragraphs. Under 2 pages.", constraints: "Mark researched facts [RESEARCHED] and gaps [NEEDS INVESTIGATION]. Do not invent details about what the department wants. If it is a straightforward known-solution upgrade, say so. Write like a county business analyst — direct, no filler." },
];

function groupTemplatesByCategory(): CategoryGroup[] {
  const categoryIcons: Record<string, typeof Building2> = {
    "Resident Services": Home,
    "Infrastructure & Safety": Shield,
    "Development & Building": HardHat,
    "Human Services": Heart,
    "Government Administration": Landmark,
    "IT & Data": Database,
  };
  const order = ["Resident Services", "Infrastructure & Safety", "Development & Building", "Human Services", "Government Administration", "IT & Data"];
  const groups: Record<string, Template[]> = {};
  for (const t of templates) {
    if (!groups[t.category]) groups[t.category] = [];
    groups[t.category].push(t);
  }
  return order.filter((c) => groups[c]).map((c) => ({ name: c, icon: categoryIcons[c] || Building2, templates: groups[c] }));
}

/* ─── Department Banner ─── */
function DepartmentBanner({ category }: { category: string | null }) {
  // Shown only after a template is loaded — names the template's category.
  if (!category) return null;
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
      style={{ background: ACCENT_LIGHT, border: `1.5px solid ${ACCENT}` }}
    >
      <Building2 className="w-4 h-4" style={{ color: ACCENT }} />
      <span className="text-sm font-medium" style={{ color: ACCENT }}>
        Building for: <strong>{category}</strong>
      </span>
    </div>
  );
}

/* ─── Quality Scoring ─── */
function QualityIndicators({ blocks }: { blocks: Record<string, string> }) {
  const indicators = [
    { key: "role", label: "Role" },
    { key: "task", label: "Task" },
    { key: "context", label: "Context" },
    { key: "output", label: "Output" },
    { key: "constraints", label: "Constraints" },
    { key: "examples", label: "Examples" },
  ];
  const filled = indicators.filter((ind) => (blocks[ind.key] || "").trim().length > 0).length;
  const qualityLabels = ["Needs Work", "Needs Work", "Basic", "Good", "Strong", "Excellent", "Excellent"];
  const qualityColors = [
    INK_MUTED,
    INK_MUTED,
    INK_MUTED,
    "oklch(0.55 0.12 220)",
    "oklch(0.50 0.12 220)",
    ACCENT,
    ACCENT,
  ];

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5">
        {indicators.map((ind) => {
          const active = (blocks[ind.key] || "").trim().length > 0;
          const color = BLOCK_COLORS[ind.key];
          return (
            <motion.div
              key={ind.key}
              animate={{ scale: active ? 1 : 0.85 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              title={ind.label}
              className="w-3.5 h-3.5 rounded-full border-2 transition-colors"
              style={{
                borderColor: active ? color?.border || ACCENT : "oklch(0.85 0.01 250)",
                background: active ? color?.border || ACCENT : "transparent",
              }}
            />
          );
        })}
      </div>
      <motion.span
        key={filled}
        initial={{ opacity: 0, x: -4 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-xs font-bold"
        style={{ color: qualityColors[filled] }}
      >
        {qualityLabels[filled]}
      </motion.span>
    </div>
  );
}

/* ─── Token Counter ─── */
function estimateTokens(text: string): number {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.ceil(wordCount * 1.3);
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function Builder() {
  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3"
        style={{
          background: SURFACE,
          backdropFilter: "blur(8px)",
          borderBottom: HAIRLINE,
        }}
      >
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4" style={{ color: ACCENT }} />
          <span className="font-serif font-semibold text-sm" style={{ color: INK }}>
            Prompt Builder
          </span>
        </div>
      </header>

      <BuildMode />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BUILD MODE
   ═══════════════════════════════════════════════════════════════ */
function RecentPrompts({ onLoad }: { onLoad: (prompt: string) => void }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<{ prompt: string; timestamp: number }[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("cookbook-prompt-history") || "[]");
      setHistory(stored);
    } catch { /* corrupt */ }
  }, []);

  if (history.length === 0) return null;

  const relativeTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg w-full text-left transition-colors"
        style={{
          background: SURFACE,
          border: `1px solid ${HAIRLINE_COLOR}`,
          color: INK,
        }}
      >
        <Clock className="w-3.5 h-3.5" style={{ color: ACCENT }} />
        Recent Prompts ({history.length})
        <ChevronDown
          className="w-3.5 h-3.5 ml-auto transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", color: INK_MUTED }}
        />
      </button>
      {open && (
        <div className="mt-1 rounded-b-xl overflow-hidden" style={{ border: `1px solid ${HAIRLINE_COLOR}`, borderTop: "none" }}>
          {history.map((item, i) => (
            <button
              key={i}
              onClick={() => { onLoad(item.prompt); toast.success("Prompt loaded!"); }}
              className="flex items-center justify-between w-full px-4 py-2.5 text-left text-xs transition-colors hover:bg-[oklch(0.94_0.03_220)]"
              style={{ borderTop: i > 0 ? `1px solid ${HAIRLINE_COLOR}` : "none", color: INK }}
            >
              <span className="truncate flex-1 mr-3">{item.prompt.slice(0, 80)}...</span>
              <span className="text-[10px] shrink-0" style={{ color: INK_MUTED }}>{relativeTime(item.timestamp)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BuildMode() {
  const [blockValues, setBlockValues] = useState<Record<string, string>>({});
  const [hiddenBlocks, setHiddenBlocks] = useState<Set<string>>(new Set());
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [templatePanelOpen, setTemplatePanelOpen] = useState(false);
  const [activeCoachTab, setActiveCoachTab] = useState<"critique" | "refine" | "preview">("critique");
  const [copied, setCopied] = useState(false);
  const [copilotSent, setCopilotSent] = useState(false);
  const [chatgptSent, setChatgptSent] = useState(false);
  // P0-A: PII pre-flight modal state — populated when sendToTarget throws
  // PiiDetectedError, cleared on cancel / send-anyway / redact-and-send.
  const [piiModal, setPiiModal] = useState<{
    matches: ScanMatch[];
    redacted: string;
    target: "copilot" | "chatgpt_enterprise" | "copy";
  } | null>(null);

  const deptCategoryMap: Record<string, string> = {
    "resident-services": "Resident Services",
    "infrastructure-safety": "Infrastructure & Safety",
    "development-building": "Development & Building",
    "human-services": "Human Services",
    "government-admin": "Government Administration",
    "partner-agencies": "Government Administration",
    "parks-culture": "Resident Services",
  };

  const categoryGroups = useMemo(() => {
    const groups = groupTemplatesByCategory();
    // If department is set, move its matching category to the top
    try {
      const deptId = localStorage.getItem("cookbook-department");
      if (deptId) {
        const matchCat = deptCategoryMap[deptId];
        if (matchCat) {
          const idx = groups.findIndex((g) => g.name === matchCat);
          if (idx > 0) {
            const [match] = groups.splice(idx, 1);
            groups.unshift(match);
          }
        }
      }
    } catch { /* */ }
    return groups;
  }, []);

  // Auto-expand matching department category
  useEffect(() => {
    try {
      const deptId = localStorage.getItem("cookbook-department");
      if (deptId) {
        const matchCat = deptCategoryMap[deptId];
        if (matchCat) setExpandedCategories(new Set([matchCat]));
      }
    } catch { /* */ }
  }, []);

  // Check for imported prompt from TryItSection or other pages
  useEffect(() => {
    const imported = localStorage.getItem("cookbook-builder-import");
    if (imported) {
      localStorage.removeItem("cookbook-builder-import");
      setBlockValues((prev) => ({ ...prev, ...parseRtcoTemplate(imported) }));
      toast.success("Prompt imported! Edit the blocks to refine it.");
    } else {
      // Pre-fill with department template if no import and blocks are empty
      try {
        const deptId = localStorage.getItem("cookbook-department");
        if (deptId) {
          const dept = getDepartment(deptId);
          if (dept?.personalization.builderTemplate) {
            setBlockValues((prev) => {
              if (!prev.task && !prev.role) {
                return { ...prev, ...parseRtcoTemplate(dept.personalization.builderTemplate) };
              }
              return prev;
            });
          }
        }
      } catch { /* */ }
    }
  }, []);

  // Builder now shows all 5 core RTCO blocks at all times. Technique-specific
  // refinements (few-shot examples, chain-of-thought, etc.) happen via the
  // plain-language card grid in the Refine panel below.
  const visibleBlocks = ALL_BLOCKS;

  const setBlockValue = useCallback((id: string, value: string) => {
    setBlockValues((prev) => ({ ...prev, [id]: value }));
  }, []);

  const toggleBlockVisibility = useCallback((id: string) => {
    setHiddenBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const loadTemplate = useCallback((t: Template) => {
    setBlockValues({
      role: t.role,
      task: t.task,
      context: t.context,
      output: t.output,
      constraints: t.constraints,
    });
    setSelectedTemplate(t.id);
    setHiddenBlocks(new Set());
    setCollapsedBlocks(new Set());
  }, []);

  // Replace the draft with an accepted Refine-mode rewrite (best-effort parse).
  const handleApplyRefined = useCallback((rewritten: string) => {
    setBlockValues(parseRefinedRtco(rewritten));
    setSelectedTemplate(null);
    setHiddenBlocks(new Set());
    setCollapsedBlocks(new Set());
  }, []);

  const handleReset = useCallback(() => {
    setBlockValues({});
    setSelectedTemplate(null);
    setHiddenBlocks(new Set());
    setCollapsedBlocks(new Set());
  }, []);

  const toggleCategory = useCallback((cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  // Assemble preview text
  const assembledPrompt = useMemo(() => {
    const parts: string[] = [];
    for (const block of visibleBlocks) {
      const val = (blockValues[block.id] || "").trim();
      if (!val) continue;
      if (block.id === "role") {
        parts.push(`You are a ${val}.`);
      } else {
        parts.push(`${block.previewLabel} ${val}`);
      }
    }
    return parts.join("\n\n");
  }, [blockValues, visibleBlocks]);

  const tokenCount = useMemo(() => estimateTokens(assembledPrompt), [assembledPrompt]);

  const handleCopy = useCallback(() => {
    if (!assembledPrompt.trim()) return;
    // P0-A parity: Copy must enforce the same PII gate as Use in Copilot / ChatGPT.
    const scan = scanForPii(assembledPrompt);
    if (scan.flagged) {
      emitPiiFlagged(scan.matches, "blocked", "copy");
      setPiiModal({
        matches: scan.matches,
        redacted: scan.redacted,
        target: "copy",
      });
      return;
    }
    navigator.clipboard.writeText(assembledPrompt).then(() => {
      setCopied(true);
      toast.success("Prompt copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  }, [assembledPrompt]);

  /**
   * P0-A: unified send handler with PII pre-flight. On detection, opens
   * the PII warning modal; on clean, proceeds to clipboard + window.open.
   * Both Copilot and ChatGPT buttons share this path.
   */
  const handleSendToTarget = useCallback(
    (target: "copilot" | "chatgpt_enterprise") => {
      if (!assembledPrompt.trim()) return;
      sendToTarget(assembledPrompt, target)
        .then(() => {
          if (target === "copilot") {
            toast("Prompt copied — paste into Copilot", { duration: 3000 });
            setCopilotSent(true);
            setTimeout(() => setCopilotSent(false), 3000);
          } else {
            toast("Prompt copied — paste into ChatGPT Enterprise", { duration: 3000 });
            setChatgptSent(true);
            setTimeout(() => setChatgptSent(false), 3000);
          }
        })
        .catch((err) => {
          if (err instanceof PiiDetectedError) {
            // Open the warning modal — no clipboard write, no tab opened.
            setPiiModal({
              matches: err.matches,
              redacted: err.redacted,
              target: err.target,
            });
            return;
          }
          // Unexpected — surface as a toast but don't crash.
          console.error("[handleSendToTarget]", err);
          toast.error("Could not copy to clipboard");
        });
    },
    [assembledPrompt],
  );

  // Render the assembled prompt as light, color-coded sections (one per block).
  const renderPreview = () => {
    const sections: React.ReactNode[] = [];
    for (const block of visibleBlocks) {
      const val = (blockValues[block.id] || "").trim();
      if (!val) continue;
      const hidden = hiddenBlocks.has(block.id);
      const c = BLOCK_COLORS[block.id];
      const displayVal = block.id === "role" ? `You are a ${val}.` : val;
      sections.push(
        <div key={block.id} className="flex gap-3" style={{ opacity: hidden ? 0.45 : 1 }}>
          <div className="shrink-0 w-20 pt-1.5">
            <div
              className="text-[11px] font-bold uppercase tracking-wide"
              style={{ color: c?.text || INK }}
            >
              {block.label}
            </div>
            {block.subLabel && (
              <div className="text-[10px] mt-0.5 leading-tight" style={{ color: INK_MUTED }}>
                {block.subLabel}
              </div>
            )}
          </div>
          <div
            className="flex-1 rounded-lg px-3 py-2 text-sm leading-relaxed"
            style={{
              background: c?.bg || ACCENT_LIGHT,
              border: `1px solid ${c?.border || HAIRLINE_COLOR}`,
              color: INK,
              textDecoration: hidden ? "line-through" : "none",
            }}
          >
            {displayVal}
          </div>
        </div>
      );
    }
    if (sections.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-12 gap-2">
          <Eye className="w-5 h-5" style={{ color: INK_MUTED }} />
          <p className="text-sm" style={{ color: INK_MUTED }}>
            Your prompt will appear here, section by section, as you fill in the blocks.
          </p>
        </div>
      );
    }
    return sections;
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">

      {/* Directions — orientation stepper; quieter than the cards, flows with the page */}
      <div
        className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-x-2.5 gap-y-2 rounded-xl px-4 py-2.5 mb-6"
        style={{ background: ACCENT_LIGHT }}
      >
        <span className="font-serif font-semibold text-xs shrink-0 mr-1" style={{ color: ACCENT }}>
          How to use this
        </span>
        {[
          "Pick a template",
          "Fill the blocks",
          "Watch the preview",
          "Run Critique",
          "Copy to Copilot",
        ].map((label, i, arr) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5">
              <span
                className="flex items-center justify-center shrink-0 w-4 h-4 rounded-full text-[10px] font-bold"
                style={{ background: ACCENT, color: ON_ACCENT }}
              >
                {i + 1}
              </span>
              <span className="text-xs whitespace-nowrap" style={{ color: INK }}>
                {label}
              </span>
            </span>
            {i < arr.length - 1 && (
              <ChevronRight className="w-3 h-3 hidden sm:block" style={{ color: ACCENT }} />
            )}
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
        {/* Left: Builder */}
        <div className="space-y-3">
          <DepartmentBanner category={(selectedTemplate && templates.find((t) => t.id === selectedTemplate)?.category) || null} />
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-base" style={{ color: INK }}>Prompt Blocks</h3>
            <div className="flex items-center gap-3">
              <QualityIndicators blocks={blockValues} />
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                style={{ color: INK_MUTED, background: SURFACE, border: HAIRLINE }}
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>
          </div>

          {/* Block Cards */}
          {visibleBlocks.map((block) => {
            const colors = BLOCK_COLORS[block.id];
            const collapsed = collapsedBlocks.has(block.id);
            const hidden = hiddenBlocks.has(block.id);
            const hasContent = (blockValues[block.id] || "").trim().length > 0;

            return (
              <motion.div
                key={block.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-xl overflow-hidden"
                style={{
                  background: SURFACE,
                  border: HAIRLINE,
                  borderLeft: `4px solid ${colors?.border || ACCENT}`,
                }}
              >
                {/* Block header */}
                <div className="flex items-center gap-2 px-3 py-2">
                  <GripVertical className="w-3.5 h-3.5 cursor-grab" style={{ color: INK_MUTED }} />
                  <div
                    className="flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold"
                    style={{ background: colors?.bg || ACCENT_LIGHT, color: colors?.border || ACCENT }}
                  >
                    {block.label[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-xs font-bold"
                      style={{
                        color: INK,
                        fontFamily: "ui-monospace, monospace",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {block.label}
                    </div>
                    {block.subLabel && (
                      <div className="text-[10px] mt-0.5 leading-tight" style={{ color: INK_MUTED }}>
                        {block.subLabel}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => toggleBlockVisibility(block.id)}
                    className="p-1 rounded transition-opacity hover:opacity-70"
                    title={hidden ? "Show in preview" : "Hide from preview"}
                  >
                    {hidden ? (
                      <EyeOff className="w-3.5 h-3.5" style={{ color: INK_MUTED }} />
                    ) : (
                      <Eye className="w-3.5 h-3.5" style={{ color: INK_MUTED }} />
                    )}
                  </button>
                  <button
                    onClick={() => toggleCollapse(block.id)}
                    className="p-1 rounded transition-transform"
                  >
                    <ChevronDown
                      className="w-4 h-4 transition-transform duration-200"
                      style={{
                        color: INK_MUTED,
                        transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
                      }}
                    />
                  </button>
                </div>

                {/* Block content */}
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3">
                        {block.helpText && !hasContent && (
                          <p className="text-xs mb-2" style={{ color: INK }}>
                            {block.helpText}
                          </p>
                        )}
                        {block.multiline ? (
                          <textarea
                            value={blockValues[block.id] || ""}
                            onChange={(e) => setBlockValue(block.id, e.target.value)}
                            placeholder={block.placeholder}
                            rows={block.rows || 3}
                            className="w-full px-3 py-2.5 rounded-lg text-sm transition-all resize-none"
                            style={{
                              background: SURFACE,
                              border: `1.5px solid ${HAIRLINE_COLOR}`,
                              color: INK,
                              outline: "none",
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = ACCENT;
                              e.currentTarget.style.boxShadow = `0 0 0 3px ${withAlpha(ACCENT, 0.18)}`;
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = HAIRLINE_COLOR;
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          />
                        ) : (
                          <input
                            type="text"
                            value={blockValues[block.id] || ""}
                            onChange={(e) => setBlockValue(block.id, e.target.value)}
                            placeholder={block.placeholder}
                            className="w-full px-3 py-2.5 rounded-lg text-sm transition-all"
                            style={{
                              background: SURFACE,
                              border: `1.5px solid ${HAIRLINE_COLOR}`,
                              color: INK,
                              outline: "none",
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = ACCENT;
                              e.currentTarget.style.boxShadow = `0 0 0 3px ${withAlpha(ACCENT, 0.18)}`;
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = HAIRLINE_COLOR;
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {/* Template Gallery */}
          <div className="mt-6">
            <button
              onClick={() => setTemplatePanelOpen((p) => !p)}
              className="flex items-center gap-2 w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors"
              style={{
                background: templatePanelOpen ? ACCENT_LIGHT : SURFACE,
                border: `1px solid ${HAIRLINE_COLOR}`,
                color: INK,
              }}
            >
              <FileText className="w-4 h-4" style={{ color: ACCENT }} />
              Template Gallery ({templates.length})
              <ChevronDown
                className="w-4 h-4 ml-auto transition-transform duration-200"
                style={{ color: INK_MUTED, transform: templatePanelOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </button>
            <AnimatePresence initial={false}>
              {templatePanelOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-b-xl overflow-hidden" style={{ border: `1px solid ${HAIRLINE_COLOR}`, borderTop: "none" }}>
                    {categoryGroups.map((group, gi) => {
                      const CatIcon = group.icon;
                      const isExpanded = expandedCategories.has(group.name);
                      return (
                        <div key={group.name} style={{ borderTop: gi > 0 ? `1px solid ${HAIRLINE_COLOR}` : "none" }}>
                          <button
                            onClick={() => toggleCategory(group.name)}
                            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-bold transition-colors"
                            style={{
                              color: INK,
                              background: isExpanded ? ACCENT_LIGHT : SURFACE,
                            }}
                          >
                            <CatIcon className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                            {group.name}
                            <span className="text-[10px] font-medium ml-1 px-1.5 py-0.5 rounded-md" style={{ background: HAIRLINE_COLOR, color: INK_MUTED }}>
                              {group.templates.length}
                            </span>
                            <ChevronDown
                              className="w-3.5 h-3.5 ml-auto transition-transform duration-200"
                              style={{ color: INK_MUTED, transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                            />
                          </button>
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="overflow-hidden"
                              >
                                <div className="flex flex-wrap gap-2 px-4 py-2.5" style={{ background: SURFACE }}>
                                  {group.templates.map((t) => {
                                    const TIcon = t.icon;
                                    return (
                                      <button
                                        key={t.id}
                                        onClick={() => loadTemplate(t)}
                                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                                        style={{
                                          background: selectedTemplate === t.id ? ACCENT : SURFACE,
                                          color: selectedTemplate === t.id ? ON_ACCENT : INK,
                                          border: selectedTemplate === t.id ? `1.5px solid ${ACCENT}` : `1.5px solid ${HAIRLINE_COLOR}`,
                                        }}
                                      >
                                        <TIcon className="w-3 h-3" />
                                        {t.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Recent Prompts */}
          <RecentPrompts onLoad={(prompt) => setBlockValue("task", prompt)} />
        </div>

        {/* Right: Live Preview */}
        <div className="space-y-4">
          <div className="flex items-center mb-1">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: INK_MUTED }}>
              Live Preview
            </span>
          </div>

          {/* Coach tab strip */}
          <div className="mt-4">
            {/* Tab buttons */}
            <div className="flex gap-1 mb-3">
              <button
                onClick={() => setActiveCoachTab("critique")}
                className="flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: activeCoachTab === "critique" ? ACCENT : withAlpha(ACCENT, 0.06),
                  color: activeCoachTab === "critique" ? ON_ACCENT : INK_MUTED,
                  border: activeCoachTab === "critique" ? "none" : HAIRLINE,
                }}
              >
                Critique
              </button>
              <button
                onClick={() => setActiveCoachTab("refine")}
                className="flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: activeCoachTab === "refine" ? ACCENT : withAlpha(ACCENT, 0.06),
                  color: activeCoachTab === "refine" ? ON_ACCENT : INK_MUTED,
                  border: activeCoachTab === "refine" ? "none" : HAIRLINE,
                }}
              >
                Refine
              </button>
              <button
                onClick={() => setActiveCoachTab("preview")}
                className="flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: activeCoachTab === "preview" ? ACCENT : withAlpha(ACCENT, 0.06),
                  color: activeCoachTab === "preview" ? ON_ACCENT : INK_MUTED,
                  border: activeCoachTab === "preview" ? "none" : HAIRLINE,
                }}
              >
                Preview
              </button>
            </div>

            {/* Tab panels — use CSS display to preserve component state across tab switches */}
            <div style={{ display: activeCoachTab === "critique" ? undefined : "none" }}>
              <CritiquePanel
                prompt={assembledPrompt}
                onApplyToBlock={(field, text) => {
                  const prev = blockValues[field] || "";
                  setBlockValue(field, prev ? `${prev}\n\n${text}` : text);
                  toast.success(`Added to the ${field} block`);
                }}
              />
            </div>
            <div style={{ display: activeCoachTab === "refine" ? undefined : "none" }}>
              <RefineDiff prompt={assembledPrompt} onApply={handleApplyRefined} />
            </div>
            <div style={{ display: activeCoachTab === "preview" ? undefined : "none" }}>
              <PreviewPanel prompt={assembledPrompt} />
            </div>
          </div>

          {/* Live preview — light, sectioned: label left, content right */}
          <div
            className="rounded-xl p-4 min-h-[320px] space-y-2.5"
            style={{ background: SURFACE, border: HAIRLINE }}
          >
            {renderPreview()}
          </div>

          {/* Token count */}
          <div className="flex items-center">
            <span className="text-xs font-medium" style={{ color: INK_MUTED }}>
              ~{tokenCount} tokens
            </span>
          </div>

          {/* Actions — assemble-and-send (relocated from the former sticky top bar) */}
          <div className="pt-3 mt-1" style={{ borderTop: HAIRLINE }}>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!assembledPrompt.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs px-4 py-2.5 rounded-lg font-bold transition-all"
                style={{
                  background: assembledPrompt.trim() ? ACCENT : "oklch(0.92 0.005 250)",
                  color: assembledPrompt.trim() ? ON_ACCENT : INK_MUTED,
                  cursor: assembledPrompt.trim() ? "pointer" : "not-allowed",
                  opacity: assembledPrompt.trim() ? 1 : 0.7,
                }}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy Prompt"}
              </button>
              <motion.button
                animate={assembledPrompt.trim() && !copilotSent ? {
                  boxShadow: [`0 0 0 0px ${withAlpha(ACCENT, 0.4)}`, `0 0 0 6px ${withAlpha(ACCENT, 0)}`, `0 0 0 0px ${withAlpha(ACCENT, 0)}`]
                } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                onClick={() => handleSendToTarget("copilot")}
                disabled={!assembledPrompt.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs px-4 py-2.5 rounded-lg font-bold transition-all"
                style={{
                  background: assembledPrompt.trim() ? ACCENT : "oklch(0.92 0.005 250)",
                  color: assembledPrompt.trim() ? ON_ACCENT : INK_MUTED,
                  cursor: assembledPrompt.trim() ? "pointer" : "not-allowed",
                  opacity: assembledPrompt.trim() ? 1 : 0.7,
                }}
              >
                {copilotSent ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                Use in Copilot ↗
              </motion.button>
            </div>
            <div className="text-center mt-2">
              <button
                onClick={() => handleSendToTarget("chatgpt_enterprise")}
                disabled={!assembledPrompt.trim()}
                className="text-[11px] font-medium transition-opacity hover:opacity-80"
                style={{
                  color: assembledPrompt.trim() ? INK_MUTED : "oklch(0.68 0.01 250)",
                  cursor: assembledPrompt.trim() ? "pointer" : "not-allowed",
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                  background: "none",
                  border: "none",
                  padding: 0,
                }}
              >
                {chatgptSent ? "\u2713 Copied for ChatGPT" : "or copy for ChatGPT Enterprise"}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* P0-A: PII pre-flight warning modal — opens when sendToTarget throws PiiDetectedError */}
      {piiModal && (
        <PiiWarningModal
          matches={piiModal.matches}
          redacted={piiModal.redacted}
          onClose={() => setPiiModal(null)}
          onSendAnyway={() => {
            const target = piiModal.target;
            const matches = piiModal.matches;
            setPiiModal(null);
            if (target === "copy") {
              emitPiiFlagged(matches, "send_anyway", "copy");
              navigator.clipboard.writeText(assembledPrompt).then(() => {
                setCopied(true);
                toast.success("Prompt copied to clipboard!");
                setTimeout(() => setCopied(false), 2000);
              });
              return;
            }
            sendToTarget(assembledPrompt, target, undefined, { skipPiiScan: true })
              .then(() => {
                if (target === "copilot") {
                  toast("Prompt copied — paste into Copilot", { duration: 3000 });
                  setCopilotSent(true);
                  setTimeout(() => setCopilotSent(false), 3000);
                } else {
                  toast("Prompt copied — paste into ChatGPT Enterprise", { duration: 3000 });
                  setChatgptSent(true);
                  setTimeout(() => setChatgptSent(false), 3000);
                }
              })
              .catch((err) => {
                console.error("[send-anyway]", err);
                toast.error("Could not copy to clipboard");
              });
          }}
          onRedactAndSend={() => {
            const target = piiModal.target;
            const redacted = piiModal.redacted;
            const matches = piiModal.matches;
            setPiiModal(null);
            if (target === "copy") {
              emitPiiFlagged(matches, "redact_and_send", "copy");
              navigator.clipboard.writeText(redacted).then(() => {
                setCopied(true);
                toast.success("Redacted prompt copied to clipboard!");
                setTimeout(() => setCopied(false), 2000);
              });
              return;
            }
            sendRedactedToTarget(redacted, matches, target)
              .then(() => {
                if (target === "copilot") {
                  toast("Redacted prompt copied — paste into Copilot", { duration: 3000 });
                  setCopilotSent(true);
                  setTimeout(() => setCopilotSent(false), 3000);
                } else {
                  toast("Redacted prompt copied — paste into ChatGPT Enterprise", { duration: 3000 });
                  setChatgptSent(true);
                  setTimeout(() => setChatgptSent(false), 3000);
                }
              })
              .catch((err) => {
                console.error("[redact-and-send]", err);
                toast.error("Could not copy redacted prompt");
              });
          }}
        />
      )}
    </div>
  );
}
