import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench,
  Copy,
  Check,
  Clock,
  ChevronRight,
  ChevronDown,
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
  PiiDetectedError,
} from "@/lib/copilot-handoff";
import type { ScanMatch } from "@/lib/pre-send-scan";
import PiiWarningModal from "@/components/PiiWarningModal";
import { personas } from "@/lib/personas";
import type { Persona } from "@/lib/personas";
import { getDepartment } from "@/lib/departments";
import { getWelcomeSeen, setWelcomeSeen } from "@/lib/welcomeStorage";
import CritiquePanel from "@/components/CritiquePanel";
import RefineDiff from "@/components/RefineDiff";
import PreviewPanel from "@/components/PreviewPanel";

/* ─── Color System ─── */
const ACCENT = "oklch(0.48 0.12 220)";
const ACCENT_LIGHT = "oklch(0.94 0.03 220)";

const BLOCK_COLORS: Record<string, { border: string; text: string; bg: string }> = {
  role:        { border: "oklch(0.45 0.14 250)", text: "oklch(0.55 0.14 250)", bg: "oklch(0.95 0.03 250)" },
  task:        { border: "oklch(0.42 0.14 155)", text: "oklch(0.50 0.14 155)", bg: "oklch(0.95 0.03 155)" },
  context:     { border: "oklch(0.50 0.14 75)",  text: "oklch(0.58 0.14 75)",  bg: "oklch(0.96 0.03 75)" },
  output:      { border: "oklch(0.45 0.12 310)", text: "oklch(0.55 0.12 310)", bg: "oklch(0.95 0.03 310)" },
  constraints: { border: "oklch(0.50 0.16 25)",  text: "oklch(0.58 0.16 25)",  bg: "oklch(0.96 0.03 25)" },
};

const PREVIEW_LABEL_COLORS: Record<string, string> = {
  role: "oklch(0.65 0.14 250)",
  task: "oklch(0.60 0.14 155)",
  context: "oklch(0.68 0.14 75)",
  output: "oklch(0.65 0.12 310)",
  constraints: "oklch(0.68 0.16 25)",
};

/* ─── Block Definitions ─── */
interface BlockDef {
  id: string;
  label: string;
  subLabel?: string; // kitchen-metaphor sub-label for core RTCO blocks
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
  { id: "role", label: "Role", subLabel: "🎩 Who should the AI act as? (the chef's hat)", previewLabel: "Role:", placeholder: "e.g. Budget Analyst, IT Help Desk Tech, HR Specialist", helpText: "What role should the AI play? Be specific — 'county budget analyst' beats 'analyst'.", multiline: false },
  { id: "task", label: "Task", subLabel: "📋 What needs done? (the recipe)", previewLabel: "Task:", placeholder: "What do you need done?", helpText: "What exactly should the AI do? Use action verbs: draft, summarize, analyze, create.", multiline: true, rows: 3 },
  { id: "context", label: "Context", subLabel: "🥫 Background the AI needs (the pantry)", previewLabel: "Context:", placeholder: "Background information, situation details, relevant data...", helpText: "What does the AI need to know? Department, audience, deadline, data.", multiline: true, rows: 3 },
  { id: "output", label: "Output Format", subLabel: "🍽️ How should the result look? (the plating)", previewLabel: "Output:", placeholder: "e.g. bullet list, memo, table, structured report", helpText: "How should the result look? Bullet list, memo, table, email, 3 paragraphs.", multiline: false },
  { id: "constraints", label: "Constraints", subLabel: "🚫 What to avoid (allergies & dietary restrictions)", previewLabel: "Constraints:", placeholder: "Limits, rules, requirements, word counts...", helpText: "What should the AI avoid? Word limits, tone rules, things NOT to include.", multiline: true, rows: 2 },
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

interface CategoryGroup {
  name: string;
  icon: typeof Building2;
  templates: Template[];
}

const templates: Template[] = [
  // Resident Services
  { id: "utility-billing", label: "Utility Billing Response", category: "Resident Services", icon: Home, role: "Utility Billing Specialist for Manatee County", task: "Draft a response to a resident inquiry about their water/sewer bill", context: "The resident received a bill that is significantly higher than their average. They called 311 to dispute the charge. Account shows a spike in usage during the billing period.", output: "Professional letter with greeting, explanation of the charge, steps the resident can take (request a meter re-read, check for leaks), and contact information for further assistance", constraints: "Keep tone empathetic and professional. Do not disclose account details beyond what the resident already knows. Under 300 words." },
  { id: "311-report", label: "311 Report Summary", category: "Resident Services", icon: Home, role: "311 Call Center Supervisor", task: "Summarize weekly 311 service request data for department heads", context: "Week of March 23-29, 2026. Total calls: 847. Top categories: road maintenance (23%), water/sewer (18%), code enforcement (15%), animal services (12%), parks (9%)", output: "Executive summary with a table of top 5 categories by volume, trend comparison to prior week, and 3 recommended actions", constraints: "Keep under 400 words. Flag any category with >20% week-over-week increase." },
  { id: "library-program", label: "Library Program Description", category: "Resident Services", icon: Home, role: "Library Program Coordinator for Manatee County Public Libraries", task: "Write a promotional description for a new community program", context: "The library is launching a 'Tech Tuesdays' program offering free one-hour technology workshops for seniors at all 6 branch locations starting May 2026", output: "Program description suitable for the county website and social media, including schedule, topics covered, registration info, and a call to action", constraints: "Friendly, welcoming tone. ADA-compliant language. Include both English and Spanish registration phone numbers. Under 200 words." },

  // Infrastructure & Safety
  { id: "road-maintenance", label: "Road Maintenance Report", category: "Infrastructure & Safety", icon: Shield, role: "Public Works Road Maintenance Supervisor", task: "Generate a quarterly road maintenance status report", context: "Q1 2026 data: 142 potholes repaired, 8.3 miles resurfaced, 23 drainage improvements completed. Budget spent: $1.2M of $4.8M annual allocation.", output: "Formatted report with executive summary, work completed table, budget tracker, and upcoming Q2 priorities", constraints: "Include map reference numbers for all completed projects. Flag any project over budget by more than 10%." },
  { id: "emergency-alert", label: "Emergency Alert Draft", category: "Infrastructure & Safety", icon: Shield, role: "Emergency Management Public Information Officer", task: "Draft a multi-channel emergency alert for residents", context: "Tropical Storm approaching Manatee County. Expected landfall in 48 hours. Category: Tropical Storm Warning. Anticipated impacts: 4-6 inches of rain, 45-60 mph winds, potential storm surge 2-4 feet in coastal areas.", output: "Three versions: (1) SMS/text alert under 160 characters, (2) social media post under 280 characters, (3) full website alert with preparation checklist", constraints: "Use plain language at 8th grade reading level. Include shelter locations and evacuation zone lookup URL. No speculation about storm path changes." },
  { id: "traffic-study", label: "Traffic Study Request", category: "Infrastructure & Safety", icon: Shield, role: "Transportation Planning Analyst for Manatee County", task: "Prepare a traffic study request memo for a proposed development", context: "Developer has submitted plans for a 250-unit residential complex at the intersection of SR 64 and 75th Street West. Current ADT at intersection: 18,400 vehicles. Level of Service: D.", output: "Formal memo requesting a Traffic Impact Analysis including scope of study, required intersections, peak hour analysis periods, and developer obligations", constraints: "Reference Manatee County Land Development Code Chapter 8. Include FDOT coordination requirements for state roads." },

  // Development & Building
  { id: "permit-response", label: "Permit Application Response", category: "Development & Building", icon: HardHat, role: "Building Services Plan Reviewer for Manatee County", task: "Draft a response to a commercial building permit application", context: "Application #BLD-2026-04521 for a 12,000 sq ft retail building. First review identified 7 code deficiencies across structural, electrical, and accessibility categories.", output: "Formal review letter listing each deficiency with code reference, description of the issue, and required corrective action. Include resubmittal instructions.", constraints: "Reference specific Florida Building Code sections. Professional tone. Include 30-day resubmittal deadline and contact information for questions." },
  { id: "bid-summary", label: "Bid Summary", category: "Development & Building", icon: HardHat, role: "Procurement Analyst for Manatee County", task: "Summarize competitive bid responses for a county construction project", context: "RFP #MCG-2026-089 for renovation of the downtown government center lobby. 5 bids received ranging from $340K to $612K. Evaluation criteria: price (40%), experience (30%), timeline (20%), local preference (10%).", output: "Bid comparison matrix with scoring, narrative summary of top 3 bidders, and staff recommendation", constraints: "Follow Manatee County Procurement Ordinance. Do not include proprietary pricing details that bidders marked confidential." },
  { id: "property-record", label: "Property Record Letter", category: "Development & Building", icon: HardHat, role: "Property Appraiser Records Specialist", task: "Draft a response to a public records request for property information", context: "Request received for all permits, liens, and code enforcement actions on parcel ID 1234-5678-9012 from 2020 to present.", output: "Cover letter with summary of records found, itemized list of documents being provided, and note of any exemptions applied", constraints: "Comply with Florida Public Records Law (Chapter 119). Redact any exempt information. Include fee calculation if applicable." },

  // Human Services
  { id: "assistance-letter", label: "Assistance Program Letter", category: "Human Services", icon: Heart, role: "Human Services Case Manager for Manatee County", task: "Draft an eligibility determination letter for a county assistance program", context: "Applicant applied for the Emergency Rental Assistance Program. Household income verified at 47% AMI (Area Median Income). Program threshold is 80% AMI.", output: "Formal notification letter with eligibility determination, benefit amount, program requirements, and appeal rights", constraints: "Use plain language. Include required legal notices. Provide both English and Spanish helpline numbers." },
  { id: "animal-services", label: "Animal Services Notice", category: "Human Services", icon: Heart, role: "Animal Services Officer for Manatee County", task: "Draft a notice to a pet owner regarding a compliance issue", context: "Complaint received about unlicensed dogs at a residential property. Officer confirmed 3 dogs on premises, none with current Manatee County pet licenses or rabies vaccination tags.", output: "Official notice letter with violation description, required corrective actions, compliance deadline, and penalty schedule", constraints: "Reference Manatee County Code of Ordinances Chapter 14. Include licensing fee schedule and vaccination clinic locations." },
  { id: "veteran-referral", label: "Veteran Referral", category: "Human Services", icon: Heart, role: "Veterans Services Coordinator for Manatee County", task: "Create a referral package for a veteran seeking multiple services", context: "Vietnam-era veteran, age 74, seeking assistance with property tax exemption, healthcare enrollment, and home modification for mobility issues.", output: "Referral document listing each service needed, the responsible agency, contact person, required documents, and next steps for the veteran", constraints: "Include both county and VA resources. Provide transportation assistance options. Use respectful, non-clinical language." },

  // Government Administration
  { id: "records-request", label: "Records Request Response", category: "Government Administration", icon: Landmark, role: "Public Records Coordinator for Manatee County", task: "Draft a response to a public records request", context: "Media organization submitted a broad request for all emails between county commissioners regarding the FY2027 budget from January through March 2026.", output: "Formal response letter with scope acknowledgment, estimated records volume, timeline for production, cost estimate, and any applicable exemptions", constraints: "Comply with Florida Statute 119. Cite specific exemptions if withholding any records. Provide 30-day production timeline." },
  { id: "public-comment", label: "Public Comment Summary", category: "Government Administration", icon: Landmark, role: "Board of County Commissioners Administrative Analyst", task: "Summarize public comments received during a comment period", context: "45-day public comment period for the proposed Comprehensive Plan amendment allowing mixed-use development in the Lakewood Ranch area. 234 comments received via email, online portal, and public meetings.", output: "Executive summary with comment statistics, top themes with representative quotes, sentiment breakdown, and staff response to major concerns", constraints: "Neutral, factual tone. Do not editorialize. Include both supporting and opposing viewpoints proportionally." },
  { id: "performance-report", label: "Performance Report", category: "Government Administration", icon: Landmark, role: "Performance Management Analyst for Manatee County", task: "Draft a quarterly department performance report", context: "Building Services Department Q1 2026. Key metrics: average permit review time 12.3 days (target: 10), customer satisfaction 4.2/5.0 (target: 4.0), revenue $2.1M (target: $1.8M).", output: "Performance dashboard narrative with KPI table, trend analysis, root cause for any missed targets, and improvement action items", constraints: "Align with the county's strategic plan pillars. Include year-over-year comparison. Flag any metric that missed target by more than 15%." },

  // IT & Data
  { id: "it-troubleshoot", label: "IT Troubleshooting Guide", category: "IT & Data", icon: Database, role: "IT Help Desk Technician for Manatee County", task: "Create a step-by-step troubleshooting guide for a common issue", context: "Multiple county employees report being unable to connect to the VPN after the recent Windows update. Affecting approximately 40 users across 3 departments.", output: "Numbered troubleshooting steps from simplest to most complex, with screenshots placeholders, escalation criteria, and known workarounds", constraints: "Write for non-technical county staff. Include both Windows 10 and Windows 11 instructions. Mark any step that requires admin privileges." },
  { id: "meeting-summarizer", label: "Meeting Summarizer", category: "IT & Data", icon: Database, role: "Meeting Analyst for Manatee County", task: "Summarize a meeting recording transcript into an actionable format", context: "From a Microsoft Teams or Stream recording of a department staff meeting", output: "Structured summary with sections: Overview (2-3 sentences), Key Discussion Points (bullets), Decisions Made, Action Items (with owner and due date), Next Steps", constraints: "Keep under 400 words. Use direct, factual language. Attribute action items to specific individuals mentioned in the transcript." },
  { id: "spreadsheet-gen", label: "Spreadsheet Generator", category: "IT & Data", icon: Database, role: "Data Analyst for Manatee County government", task: "Design a spreadsheet structure for tracking department data", context: "Department needs to track employee training compliance across 12 required courses for 200+ staff members with quarterly reporting to HR", output: "Column headers with data types, sample formulas for completion percentages, conditional formatting rules, and pivot table structure for quarterly reports", constraints: "Keep formulas simple enough for intermediate Excel users. Include data validation rules to prevent entry errors. Design for both Excel and Google Sheets compatibility." },
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
function DepartmentBanner() {
  const [dept, setDept] = useState<ReturnType<typeof getDepartment>>(undefined);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cookbook-department");
      if (stored) setDept(getDepartment(stored));
    } catch { /* localStorage unavailable */ }
  }, []);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
      style={{
        background: dept ? ACCENT_LIGHT : "oklch(0.96 0.01 70)",
        border: dept ? `1.5px solid ${dept.color}` : "1.5px solid oklch(0.90 0.01 70)",
      }}
    >
      <span className="text-xl">{dept ? dept.icon : "🏛️"}</span>
      <div className="flex-1">
        <span className="text-sm font-medium" style={{ color: dept ? ACCENT : "oklch(0.45 0.04 50)" }}>
          Building for: <strong>{dept ? dept.name : "All Departments"}</strong>
        </span>
        {dept && (
          <span className="text-xs block mt-0.5" style={{ color: "oklch(0.55 0.04 50)" }}>
            {dept.description}
          </span>
        )}
      </div>
      {!dept && (
        <a href="/cookbook/" className="text-xs font-bold px-3 py-1 rounded-lg" style={{ color: ACCENT, background: "oklch(0.96 0.03 220)", textDecoration: "none" }}>
          Set department in Cookbook &rarr;
        </a>
      )}
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
    "oklch(0.55 0.16 25)",
    "oklch(0.55 0.16 25)",
    "oklch(0.58 0.14 55)",
    "oklch(0.55 0.12 155)",
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
                borderColor: active ? color?.border || ACCENT : "oklch(0.82 0.02 70)",
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
    <div className="min-h-screen" style={{ background: "oklch(0.97 0.008 75)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3"
        style={{
          background: "oklch(0.97 0.008 75 / 0.95)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid oklch(0.90 0.02 75)",
        }}
      >
        <div className="flex items-center gap-3">
          <a href="/cookbook/" className="flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: "oklch(0.50 0.04 50)", textDecoration: "none" }}>
            <span>←</span>
            <span>Cookbook</span>
          </a>
          <ChevronRight className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.03 55)" }} />
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="font-serif font-bold text-sm" style={{ color: "oklch(0.25 0.03 40)" }}>
              Prompt Builder
            </span>
          </div>
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
          background: "oklch(0.998 0.002 70)",
          border: "1px solid oklch(0.90 0.01 70)",
          color: "oklch(0.40 0.04 45)",
        }}
      >
        <Clock className="w-3.5 h-3.5" style={{ color: ACCENT }} />
        Recent Prompts ({history.length})
        <ChevronDown
          className="w-3.5 h-3.5 ml-auto transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", color: "oklch(0.55 0.03 55)" }}
        />
      </button>
      {open && (
        <div className="mt-1 rounded-b-xl overflow-hidden" style={{ border: "1px solid oklch(0.90 0.01 70)", borderTop: "none" }}>
          {history.map((item, i) => (
            <button
              key={i}
              onClick={() => { onLoad(item.prompt); toast.success("Prompt loaded!"); }}
              className="flex items-center justify-between w-full px-4 py-2.5 text-left text-xs transition-colors hover:bg-[oklch(0.96_0.01_70)]"
              style={{ borderTop: i > 0 ? "1px solid oklch(0.94 0.01 70)" : "none", color: "oklch(0.35 0.04 45)" }}
            >
              <span className="truncate flex-1 mr-3">{item.prompt.slice(0, 80)}...</span>
              <span className="text-[10px] shrink-0" style={{ color: "oklch(0.55 0.03 55)" }}>{relativeTime(item.timestamp)}</span>
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
  const [copied, setCopied] = useState(false);
  const [copilotSent, setCopilotSent] = useState(false);
  const [chatgptSent, setChatgptSent] = useState(false);
  // P0-A: PII pre-flight modal state — populated when sendToTarget throws
  // PiiDetectedError, cleared on cancel / send-anyway / redact-and-send.
  const [piiModal, setPiiModal] = useState<{
    matches: ScanMatch[];
    redacted: string;
    target: "copilot" | "chatgpt_enterprise";
  } | null>(null);
  // Welcome hero: lazy init so auto-filled pages never flash the hero then animate it out.
  // Init order: import present → false; welcome-seen → false; dept template → false; else true
  const [showWelcome, setShowWelcome] = useState(() => {
    try {
      if (localStorage.getItem("cookbook-builder-import")) return false;
      if (getWelcomeSeen()) return false;
      const deptId = localStorage.getItem("cookbook-department");
      if (deptId) {
        const dept = getDepartment(deptId);
        if (dept?.personalization.builderTemplate) return false;
      }
    } catch { /* localStorage unavailable */ }
    return true;
  });

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
      setShowWelcome(false);
      setBlockValues((prev) => ({ ...prev, task: imported }));
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
                setShowWelcome(false);
                return { ...prev, task: dept.personalization.builderTemplate };
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
    setShowWelcome(false);
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
    setShowWelcome(false);
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

  const handleReset = useCallback(() => {
    setBlockValues({});
    setSelectedTemplate(null);
    setHiddenBlocks(new Set());
    setCollapsedBlocks(new Set());
    setShowWelcome(true);
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

  // Render preview with color-coded labels
  const renderPreview = () => {
    const parts: React.ReactNode[] = [];
    for (const block of visibleBlocks) {
      const val = (blockValues[block.id] || "").trim();
      if (!val) continue;
      const hidden = hiddenBlocks.has(block.id);
      const color = PREVIEW_LABEL_COLORS[block.id] || "oklch(0.75 0.02 70)";
      const textColor = hidden ? "oklch(0.40 0.02 240)" : "oklch(0.82 0.02 70)";
      if (parts.length > 0) parts.push(<span key={`sep-${block.id}`}>{"\n\n"}</span>);
      parts.push(
        <span key={block.id} style={{ textDecoration: hidden ? "line-through" : "none", opacity: hidden ? 0.4 : 1 }}>
          <span style={{ color, fontWeight: 700 }}>
            {block.id === "role" ? "You are a " : `${block.previewLabel} `}
          </span>
          <span style={{ color: textColor }}>
            {block.id === "role" ? `${val}.` : val}
          </span>
        </span>
      );
    }
    if (parts.length === 0) {
      return <span style={{ color: "oklch(0.45 0.03 240)" }}>Your assembled prompt will appear here as you fill in the blocks...</span>;
    }
    return parts;
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">

      {/* Welcome Hero — shown when no draft exists */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8 rounded-2xl px-8 py-10 text-center"
            style={{
              background: "linear-gradient(135deg, oklch(0.97 0.015 220) 0%, oklch(0.98 0.01 75) 100%)",
              border: `1.5px solid ${ACCENT_LIGHT}`,
              boxShadow: `0 4px 24px ${ACCENT}18`,
            }}
          >
            <div className="text-5xl mb-4">🥘</div>
            <h2 className="font-serif font-bold text-2xl mb-2" style={{ color: "oklch(0.22 0.04 40)" }}>
              Mise en place for your Copilot prompt
            </h2>
            <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: "oklch(0.48 0.04 50)" }}>
              Measure your role, task, and context. Coach the draft. Then take it where you cook.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  setWelcomeSeen(true);
                  setShowWelcome(false);
                  setTemplatePanelOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: ACCENT, color: "oklch(0.98 0.01 75)", boxShadow: `0 2px 12px ${ACCENT}44` }}
              >
                <FileText className="w-4 h-4" />
                Start with department template ▼
              </button>
              <button
                onClick={() => { setWelcomeSeen(true); setShowWelcome(false); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-80"
                style={{
                  background: "oklch(0.998 0.002 70)",
                  color: "oklch(0.38 0.04 50)",
                  border: "1.5px solid oklch(0.88 0.015 75)",
                }}
              >
                Start blank →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DepartmentBanner />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
        {/* Left: Builder */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-base" style={{ color: "oklch(0.25 0.04 45)" }}>Prompt Blocks</h3>
            <div className="flex items-center gap-3">
              <QualityIndicators blocks={blockValues} />
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                style={{ color: "oklch(0.50 0.04 50)", background: "oklch(0.94 0.01 70)" }}
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
                  background: "oklch(1 0 0)",
                  border: `1px solid oklch(0.90 0.01 70)`,
                  borderLeft: `4px solid ${colors?.border || ACCENT}`,
                  boxShadow: "0 1px 4px oklch(0.18 0.02 38 / 0.04)",
                }}
              >
                {/* Block header */}
                <div className="flex items-center gap-2 px-4 py-2.5">
                  <GripVertical className="w-3.5 h-3.5 cursor-grab" style={{ color: "oklch(0.75 0.02 70)" }} />
                  <div
                    className="flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold"
                    style={{ background: colors?.bg || ACCENT_LIGHT, color: colors?.border || ACCENT }}
                  >
                    {block.label[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold" style={{ color: hasContent ? colors?.border || ACCENT : "oklch(0.38 0.04 45)" }}>
                      {block.label}
                    </div>
                    {block.subLabel && (
                      <div className="text-[10px] mt-0.5 leading-tight" style={{ color: "oklch(0.58 0.04 55)" }}>
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
                      <EyeOff className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.03 55)" }} />
                    ) : (
                      <Eye className="w-3.5 h-3.5" style={{ color: "oklch(0.50 0.04 50)" }} />
                    )}
                  </button>
                  <button
                    onClick={() => toggleCollapse(block.id)}
                    className="p-1 rounded transition-transform"
                  >
                    <ChevronDown
                      className="w-4 h-4 transition-transform duration-200"
                      style={{
                        color: "oklch(0.55 0.03 55)",
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
                      <div className="px-4 pb-3">
                        {block.helpText && !hasContent && (
                          <p className="text-[11px] mb-2 italic" style={{ color: "oklch(0.55 0.04 50)" }}>
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
                              background: "oklch(0.985 0.005 70)",
                              border: hasContent ? `1.5px solid ${colors?.text || "oklch(0.88 0.015 75)"}` : "1.5px solid oklch(0.90 0.01 70)",
                              color: "oklch(0.22 0.03 40)",
                              outline: "none",
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = colors?.border || ACCENT;
                              e.currentTarget.style.boxShadow = `0 0 0 3px ${colors?.border || ACCENT}18`;
                            }}
                            onBlur={(e) => {
                              const active = (blockValues[block.id] || "").trim();
                              e.currentTarget.style.borderColor = active ? (colors?.text || "oklch(0.88 0.015 75)") : "oklch(0.90 0.01 70)";
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
                              background: "oklch(0.985 0.005 70)",
                              border: hasContent ? `1.5px solid ${colors?.text || "oklch(0.88 0.015 75)"}` : "1.5px solid oklch(0.90 0.01 70)",
                              color: "oklch(0.22 0.03 40)",
                              outline: "none",
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = colors?.border || ACCENT;
                              e.currentTarget.style.boxShadow = `0 0 0 3px ${colors?.border || ACCENT}18`;
                            }}
                            onBlur={(e) => {
                              const active = (blockValues[block.id] || "").trim();
                              e.currentTarget.style.borderColor = active ? (colors?.text || "oklch(0.88 0.015 75)") : "oklch(0.90 0.01 70)";
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
                background: templatePanelOpen ? "oklch(0.96 0.01 70)" : "oklch(0.998 0.002 70)",
                border: "1px solid oklch(0.90 0.01 70)",
                color: "oklch(0.30 0.04 45)",
              }}
            >
              <FileText className="w-4 h-4" style={{ color: ACCENT }} />
              Template Gallery ({templates.length})
              <ChevronDown
                className="w-4 h-4 ml-auto transition-transform duration-200"
                style={{ color: "oklch(0.55 0.03 55)", transform: templatePanelOpen ? "rotate(180deg)" : "rotate(0deg)" }}
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
                  <div className="rounded-b-xl overflow-hidden" style={{ border: "1px solid oklch(0.90 0.01 70)", borderTop: "none" }}>
                    {categoryGroups.map((group, gi) => {
                      const CatIcon = group.icon;
                      const isExpanded = expandedCategories.has(group.name);
                      return (
                        <div key={group.name} style={{ borderTop: gi > 0 ? "1px solid oklch(0.92 0.01 70)" : "none" }}>
                          <button
                            onClick={() => toggleCategory(group.name)}
                            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-bold transition-colors"
                            style={{
                              color: "oklch(0.35 0.04 45)",
                              background: isExpanded ? "oklch(0.96 0.01 70)" : "oklch(0.998 0.002 70)",
                            }}
                          >
                            <CatIcon className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                            {group.name}
                            <span className="text-[10px] font-medium ml-1 px-1.5 py-0.5 rounded-md" style={{ background: "oklch(0.92 0.01 70)", color: "oklch(0.50 0.03 55)" }}>
                              {group.templates.length}
                            </span>
                            <ChevronDown
                              className="w-3.5 h-3.5 ml-auto transition-transform duration-200"
                              style={{ color: "oklch(0.55 0.03 55)", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
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
                                <div className="flex flex-wrap gap-2 px-4 py-2.5" style={{ background: "oklch(0.98 0.005 70)" }}>
                                  {group.templates.map((t) => {
                                    const TIcon = t.icon;
                                    return (
                                      <button
                                        key={t.id}
                                        onClick={() => loadTemplate(t)}
                                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                                        style={{
                                          background: selectedTemplate === t.id ? ACCENT : "oklch(0.998 0.002 70)",
                                          color: selectedTemplate === t.id ? "oklch(0.98 0.01 75)" : "oklch(0.38 0.04 50)",
                                          border: selectedTemplate === t.id ? `1.5px solid ${ACCENT}` : "1.5px solid oklch(0.88 0.015 75)",
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
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "oklch(0.40 0.04 45)" }}>
                Live Preview
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!assembledPrompt.trim()}
                className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg font-bold transition-all"
                style={{
                  background: assembledPrompt.trim() ? ACCENT : "oklch(0.88 0.01 75)",
                  color: assembledPrompt.trim() ? "oklch(0.98 0.01 75)" : "oklch(0.58 0.03 55)",
                  cursor: assembledPrompt.trim() ? "pointer" : "not-allowed",
                  opacity: assembledPrompt.trim() ? 1 : 0.7,
                }}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy Prompt"}
              </button>
              <div className="flex flex-col items-end gap-1">
                <motion.button
                  animate={assembledPrompt.trim() && !copilotSent ? {
                    boxShadow: ["0 0 0 0px oklch(0.42 0.14 250 / 0.4)", "0 0 0 6px oklch(0.42 0.14 250 / 0)", "0 0 0 0px oklch(0.42 0.14 250 / 0)"]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                  onClick={() => handleSendToTarget("copilot")}
                  disabled={!assembledPrompt.trim()}
                  className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg font-bold transition-all"
                  style={{
                    background: assembledPrompt.trim() ? "oklch(0.42 0.14 250)" : "oklch(0.88 0.01 75)",
                    color: assembledPrompt.trim() ? "oklch(0.98 0.01 75)" : "oklch(0.58 0.03 55)",
                    cursor: assembledPrompt.trim() ? "pointer" : "not-allowed",
                    opacity: assembledPrompt.trim() ? 1 : 0.7,
                  }}
                >
                  {copilotSent ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  Use in Copilot ↗
                </motion.button>
                <span className="text-[10px]" style={{ color: "oklch(0.58 0.03 55)" }}>
                  Copies your prompt → opens Copilot
                </span>
                <button
                  onClick={() => handleSendToTarget("chatgpt_enterprise")}
                  disabled={!assembledPrompt.trim()}
                  className="text-[11px] font-medium transition-opacity hover:opacity-80"
                  style={{
                    color: assembledPrompt.trim() ? "oklch(0.48 0.08 155)" : "oklch(0.68 0.03 55)",
                    cursor: assembledPrompt.trim() ? "pointer" : "not-allowed",
                    textDecoration: "underline",
                    textUnderlineOffset: "2px",
                    background: "none",
                    border: "none",
                    padding: 0,
                  }}
                >
                  {chatgptSent ? "✓ Copied for ChatGPT" : "or copy for ChatGPT Enterprise"}
                </button>
              </div>
            </div>
          </div>

          {/* Dark preview pane */}
          <div
            className="rounded-xl p-5 min-h-[320px] text-sm leading-relaxed whitespace-pre-wrap"
            style={{
              background: "oklch(0.14 0.02 240)",
              border: "1px solid oklch(0.25 0.03 240)",
              fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
              fontSize: "13px",
              color: "oklch(0.82 0.02 70)",
              boxShadow: "inset 0 2px 8px oklch(0.08 0.01 240 / 0.3)",
            }}
          >
            {renderPreview()}
          </div>

          {/* Token count */}
          <div className="flex items-center">
            <span className="text-xs font-medium" style={{ color: "oklch(0.55 0.03 55)" }}>
              ~{tokenCount} tokens
            </span>
          </div>

        </div>
      </div>

      {/* Critique Panel — full-width below both columns */}
      <div className="mt-6">
        <CritiquePanel
          prompt={assembledPrompt}
          onApplySuggestion={(suggestion) => {
            const prev = blockValues["constraints"] || "";
            setBlockValue("constraints", prev ? `${prev}\n\n${suggestion}` : suggestion);
          }}
        />
      </div>

      {/* Refine Diff — full-width below Critique Panel */}
      <div className="mt-6">
        <RefineDiff prompt={assembledPrompt} />
      </div>

      {/* Preview Panel — full-width below Refine Diff */}
      <div className="mt-6">
        <PreviewPanel prompt={assembledPrompt} />
      </div>

      {/* Footer cross-link */}
      <div
        className="mt-10 py-6 text-center rounded-xl"
        style={{
          borderTop: "1px solid oklch(0.90 0.01 70)",
        }}
      >
        <a
          href="/cookbook/"
          className="text-sm font-medium hover:opacity-80 transition-opacity"
          style={{ color: ACCENT, textDecoration: "none" }}
        >
          Need a refresher? Browse the Cookbook recipes →
        </a>
      </div>

      {/* P0-A: PII pre-flight warning modal — opens when sendToTarget throws PiiDetectedError */}
      {piiModal && (
        <PiiWarningModal
          matches={piiModal.matches}
          redacted={piiModal.redacted}
          onClose={() => setPiiModal(null)}
          onSendAnyway={() => {
            const target = piiModal.target;
            setPiiModal(null);
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
