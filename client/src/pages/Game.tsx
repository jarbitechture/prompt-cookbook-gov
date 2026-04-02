import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Trophy,
  RotateCcw,
  Home,
  FlaskConical,
  Swords,
  Microscope,
  Wrench,
  ArrowLeft,
  Clock,
  Star,
  Send,
  Loader2,
  Crown,
  Copy,
  Check,
  ChevronLeft,
  Lightbulb,
} from "lucide-react";
import { Link } from "wouter";
import {
  ACCENT_GAME as ACCENT,
  PAGE_BG as BG,
  CARD_BG,
  CARD_BORDER,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  TECHNIQUE_COLORS,
} from "@/lib/theme";

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const ACCENT_LIGHT = "oklch(0.94 0.04 155)";
const ACCENT_DARK = "oklch(0.28 0.06 155)";

// Maps techniques to related cookbook chapters and builder actions
const TECHNIQUE_LINKS: Record<string, { chapters: { id: string; title: string }[]; builderTip: string }> = {
  "Persona + Specificity": {
    chapters: [{ id: "ch25", title: "Persona & Scenario Prompting" }, { id: "ch24", title: "The RTCO Framework" }],
    builderTip: "Try the Persona technique in the Prompt Builder to set a role for your next prompt.",
  },
  "Chain-of-Thought": {
    chapters: [{ id: "ch23", title: "Chain-of-Thought Prompting" }],
    builderTip: "Toggle Chain-of-Thought in the Prompt Builder to add step-by-step reasoning blocks.",
  },
  "Specificity + Constraints": {
    chapters: [{ id: "ch27", title: "Negative Prompting" }, { id: "ch24", title: "The RTCO Framework" }],
    builderTip: "Use the Constraints block in the Prompt Builder to set word limits and required sections.",
  },
  "Format + Structure": {
    chapters: [{ id: "ch24", title: "The RTCO Framework" }, { id: "ch22", title: "Templates & the Training Horizon" }],
    builderTip: "The Output Format block in the Builder helps you specify exactly how results should be structured.",
  },
  "Persona + Negative Constraints": {
    chapters: [{ id: "ch25", title: "Persona & Scenario Prompting" }, { id: "ch27", title: "Negative Prompting" }],
    builderTip: "Combine the Persona and Negative technique toggles in the Builder for precise, constrained outputs.",
  },
  "Zero-Shot": {
    chapters: [{ id: "ch01", title: "What Is a Prompt?" }],
    builderTip: "Zero-shot is the default in the Builder — just fill in Task and Context for quick results.",
  },
  "Few-Shot": {
    chapters: [{ id: "ch24", title: "The RTCO Framework" }],
    builderTip: "Toggle Few-Shot in the Builder to add an Examples block — show the AI what you want.",
  },
  "Persona/Role": {
    chapters: [{ id: "ch25", title: "Persona & Scenario Prompting" }],
    builderTip: "The Role block is where personas live — try 'county budget analyst' or 'public info officer'.",
  },
  "Negative Prompting": {
    chapters: [{ id: "ch27", title: "Negative Prompting" }],
    builderTip: "Toggle Negative in the Builder to add a 'Do NOT...' block to your prompt.",
  },
  "RTCO Framework": {
    chapters: [{ id: "ch24", title: "The RTCO Framework" }],
    builderTip: "RTCO is the foundation — the Builder's core blocks (Role, Task, Context, Output) are RTCO.",
  },
};


type GameMode = "arena" | "anatomy" | "challenge" | "capstone";

/** Contextual CTA: links technique to chapters + Builder */
function TechniqueActions({ technique }: { technique: string }) {
  const links = TECHNIQUE_LINKS[technique];
  if (!links) return null;
  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4 pt-4"
      style={{ borderTop: "1px solid oklch(0.88 0.03 155 / 0.5)" }}
    >
      <div className="flex flex-wrap gap-2">
        {links.chapters.map((ch) => (
          <a
            key={ch.id}
            href={`/#${ch.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:shadow-sm"
            style={{
              background: CARD_BG,
              border: `1px solid ${CARD_BORDER}`,
              color: ACCENT_DARK,
            }}
          >
            📖 {ch.title}
          </a>
        ))}
      </div>
      <a
        href="/builder"
        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:shadow-sm"
        style={{
          background: `linear-gradient(135deg, ${ACCENT}, oklch(0.36 0.12 170))`,
          color: "oklch(0.98 0.01 75)",
        }}
      >
        <Wrench className="w-3 h-3" /> Try in Builder →
      </a>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BLIND ARENA DATA (10 rounds)
// ═══════════════════════════════════════════════════════════════════════════

interface ArenaRound {
  task: string;
  weakPrompt: string;
  strongPrompt: string;
  weakOutput: string;
  strongOutput: string;
  technique: string;
  explanation: string;
}

const arenaRounds: ArenaRound[] = [
  {
    task: "Write about the new parking policy",
    weakPrompt: "Write about the new parking policy",
    strongPrompt:
      "You are a Manatee County communications officer. Write a 200-word public notice about the new beach parking permit policy effective April 1. Include pricing, where to purchase, and enforcement hours. Professional but friendly tone.",
    weakOutput:
      "The new parking policy has been updated. There are new rules about where you can park. Some areas will require permits now. The changes will take effect soon. Please check the county website for more details about the policy changes and how they affect you.",
    strongOutput:
      "Manatee County Beach Parking Update — Effective April 1, 2026\n\nA new beach parking permit system begins April 1 at all county-managed beach access points. Here is what you need to know:\n\nPermit Pricing:\n- Annual Resident Permit: $50\n- Annual Non-Resident Permit: $120\n- Daily Pass: $10\n\nWhere to Purchase:\n- Online at ManateeCounty.gov/BeachPermits\n- In person at any County Parks office (Mon-Fri, 8 AM - 5 PM)\n- At beach kiosks using credit/debit card\n\nEnforcement Hours: 8 AM to 6 PM daily. Vehicles without valid permits during these hours may receive a $75 citation.\n\nQuestions? Contact Parks & Recreation at (941) 742-5923 or parks@mymanatee.org.",
    technique: "Persona + Specificity",
    explanation:
      "The strong prompt assigns a persona (communications officer), specifies word count, lists required content, and sets tone. The weak prompt gives no direction on format, audience, or required details.",
  },
  {
    task: "Help with budget analysis",
    weakPrompt: "Help with budget analysis",
    strongPrompt:
      "Think step by step: Our Parks department budget is $3.2M with 8% cut required. Step 1: Calculate target reduction. Step 2: List top 5 line items by spend. Step 3: Identify which can be reduced with least service impact. Step 4: Recommend specific cuts with justification.",
    weakOutput:
      "I can help with budget analysis. Budget analysis involves reviewing income, expenses, and financial trends. You should look at your revenue sources, compare them to expenditures, and identify areas where you can save money. Would you like me to help with anything specific?",
    strongOutput:
      "Step 1: Target Reduction\n$3.2M x 8% = $256,000 must be cut.\n\nStep 2: Top 5 Line Items (estimated)\n1. Personnel & Benefits: $1.8M (56%)\n2. Grounds Maintenance Contracts: $480K (15%)\n3. Equipment & Vehicles: $320K (10%)\n4. Utilities & Facilities: $288K (9%)\n5. Program Supplies & Events: $192K (6%)\n\nStep 3: Least Service Impact Analysis\n- Personnel: Cutting here directly reduces service hours — high impact\n- Grounds Maintenance: Could renegotiate contracts or reduce mowing frequency — moderate impact\n- Equipment: Defer non-critical replacements — low immediate impact\n- Utilities: Limited flexibility — low savings potential\n- Program Supplies: Reduce event frequency from monthly to quarterly — moderate impact\n\nStep 4: Recommended Cuts\n1. Defer 2 vehicle replacements: -$85,000\n2. Renegotiate grounds contract (competitive bid): -$72,000\n3. Reduce special events from 12 to 8 annually: -$64,000\n4. Consolidate part-time seasonal positions: -$35,000\nTotal: $256,000 ✓",
    technique: "Chain-of-Thought",
    explanation:
      "Chain-of-Thought prompting breaks complex analysis into numbered steps. Each step builds on the previous one, producing structured reasoning instead of vague advice.",
  },
  {
    task: "Draft an email about IT changes",
    weakPrompt: "Draft an email about IT changes",
    strongPrompt:
      "Draft a professional email to all county staff announcing the migration to Microsoft 365. Include: timeline (March 15-April 30), what changes for them (new Outlook, Teams, OneDrive), what stays the same (email addresses), who to contact for help (IT Help Desk x4357). Tone: reassuring, not technical. Under 250 words.",
    weakOutput:
      "Subject: IT Changes\n\nHello,\n\nWe are making some changes to our IT systems. There will be new software and updates coming soon. Please be prepared for some changes to how things work. More information will be available later.\n\nThank you,\nIT Department",
    strongOutput:
      "Subject: Your Guide to Our Microsoft 365 Upgrade (March 15 - April 30)\n\nDear Colleagues,\n\nWe are upgrading our office tools to Microsoft 365, and we want to make this transition as smooth as possible for you.\n\nWhat is changing:\n- Email moves to the new Outlook — cleaner interface, better search\n- Microsoft Teams becomes our primary platform for chat and video calls\n- OneDrive replaces shared network folders for personal file storage\n\nWhat is NOT changing:\n- Your email address stays exactly the same\n- All your existing emails and calendar entries transfer automatically\n\nTimeline:\n- March 15: Teams and OneDrive available to all staff\n- April 1-15: Email migration (your department will receive a specific date)\n- April 30: Full transition complete\n\nWe have scheduled optional training sessions every Tuesday and Thursday in March. Calendar invites are on their way.\n\nNeed help? Contact the IT Help Desk at extension 4357 or helpdesk@mymanatee.org. We are here for you.\n\nBest regards,\nInformation Technology Services",
    technique: "Specificity + Constraints",
    explanation:
      "The strong prompt lists every required detail (timeline, changes, contacts) and sets constraints (tone, word count). This eliminates guesswork and produces a complete, actionable email.",
  },
  {
    task: "Create training material",
    weakPrompt: "Create training material",
    strongPrompt:
      "Create a 90-minute workshop outline for county employees on cybersecurity basics. Include 4 modules: password management (20 min), phishing identification (25 min), VPN usage (20 min), incident reporting (15 min), plus 10 min intro and wrap-up. For each module include: learning objective, key points, one hands-on exercise.",
    weakOutput:
      "Here is some training material on cybersecurity:\n\n1. Use strong passwords\n2. Be careful with emails\n3. Use the VPN when working remotely\n4. Report suspicious activity\n\nRemember to always be careful online and follow company policies.",
    strongOutput:
      "Cybersecurity Basics for County Staff — 90-Minute Workshop\n\nIntro (10 min)\nObjective: Set expectations and assess baseline knowledge\n- Welcome and workshop goals\n- Quick poll: \"Have you ever received a suspicious email at work?\"\n\nModule 1: Password Management (20 min)\nObjective: Staff can create and manage strong passwords\nKey Points:\n- Why \"P@ssw0rd123\" is not strong (pattern recognition by attackers)\n- Passphrase method: 4+ random words = stronger and memorable\n- County password policy: 14+ characters, changed every 90 days\n- Using the approved password manager (KeePass)\nExercise: Create 3 passphrases, test strength at passwordmonster.com\n\nModule 2: Phishing Identification (25 min)\nObjective: Staff can identify 5 common phishing indicators\nKey Points:\n- Sender address mismatches\n- Urgency tactics (\"Your account will be locked in 24 hours\")\n- Suspicious links (hover before clicking)\n- Unexpected attachments\n- Requests for credentials or personal information\nExercise: Review 6 sample emails — mark each as legitimate or phishing\n\nModule 3: VPN Usage (20 min)\nObjective: Staff can connect to county VPN from any location\nKey Points:\n- When VPN is required (any non-county network)\n- Step-by-step connection guide\n- Troubleshooting common issues\nExercise: Connect, verify IP, access an internal resource\n\nModule 4: Incident Reporting (15 min)\nObjective: Staff know exactly what to do when something suspicious happens\nKey Points:\n- What counts as an incident (clicked bad link, lost device, unusual login)\n- 3-step process: Disconnect, Report (x4357), Document\n- No-blame policy — reporting fast matters more than perfection\nExercise: Walk through one scenario as a group\n\nWrap-Up (10 min)\n- Key takeaways quiz (5 questions)\n- Resources handout\n- Q&A",
    technique: "Format + Structure",
    explanation:
      "The strong prompt defines exact time allocations, module structure, and required elements per module. This structured format request turns vague output into a ready-to-deliver workshop.",
  },
  {
    task: "Respond to a resident complaint",
    weakPrompt: "Help me respond to a complaint about trash",
    strongPrompt:
      "You are a Manatee County Utilities customer service representative. A resident on Oak Street reports their recycling wasn't picked up for the second week. Draft a response that: acknowledges the frustration, explains the likely cause (route adjustment), provides a specific resolution (special pickup scheduled for Thursday), and gives a direct contact for future issues. Empathetic but professional, under 150 words.",
    weakOutput:
      "Thank you for contacting us about your trash complaint. We apologize for any inconvenience. We will look into this matter and get back to you. Please continue to put your recycling out on the regular schedule. If you have any other questions, feel free to reach out.",
    strongOutput:
      "Dear Oak Street Resident,\n\nThank you for letting us know about the missed recycling pickup. I understand how frustrating it must be to have this happen two weeks in a row, and I sincerely apologize.\n\nOur recycling routes were recently adjusted to improve efficiency across the county. Unfortunately, this caused some addresses in your area to be temporarily skipped during the transition.\n\nHere is what we are doing:\n- A special recycling pickup is scheduled for your address this Thursday, March 20\n- Your address has been confirmed on the updated route going forward\n- Your regular pickup day remains Wednesday\n\nIf you experience any future issues, please contact me directly at (941) 742-5278 or utilities@mymanatee.org. We value your patience.\n\nSincerely,\nManatee County Utilities",
    technique: "Persona + Negative Constraints",
    explanation:
      "The strong prompt assigns a customer service persona, lists exactly what the response must address, sets tone (empathetic but professional), and constrains length. This prevents generic, unhelpful responses.",
  },
  {
    task: "Write a permit review summary",
    weakPrompt: "Summarize this permit review",
    strongPrompt:
      "You are a Manatee County building official. Summarize the permit review for application #2026-0412 (commercial renovation at 1205 Manatee Ave). Structure as: Applicant, Project Scope, Zoning Compliance (yes/no with code reference), Required Inspections (numbered list), Conditions of Approval, and Estimated Timeline. Formal tone.",
    weakOutput:
      "The permit review has been completed. The project looks good overall. There are some things that need to be addressed before approval. The applicant should review the requirements and make sure everything is in order.",
    strongOutput:
      "Permit Review Summary — Application #2026-0412\n\nApplicant: Coastal Renovations LLC (Agent: Maria Santos)\nProject Scope: Interior renovation of 4,200 sq ft commercial space at 1205 Manatee Ave W for restaurant use. Includes new HVAC, plumbing rough-in, ADA-compliant restrooms, and commercial kitchen hood installation.\n\nZoning Compliance: YES — Property zoned C-1 (General Commercial). Restaurant use permitted per LDC Section 403.4(b). Parking meets minimum 1:200 sq ft ratio.\n\nRequired Inspections:\n1. Foundation/slab (if modified)\n2. Rough plumbing\n3. Rough electrical\n4. Mechanical/HVAC\n5. Fire suppression system\n6. Health Department kitchen inspection\n7. Final building inspection\n\nConditions of Approval:\n- Fire suppression system must meet NFPA 96 for commercial cooking\n- Grease trap installation required per County Ordinance 22-14\n- Exterior signage requires separate permit\n- Construction hours limited to 7 AM - 6 PM per noise ordinance\n\nEstimated Timeline: 8-12 weeks from permit issuance to final inspection.",
    technique: "RTCO Framework",
    explanation:
      "The strong prompt uses the RTCO framework — Role (building official), Task (summarize), Context (specific application details), Output (defined sections). Every section of the output maps to a requirement in the prompt.",
  },
  {
    task: "Draft an emergency alert",
    weakPrompt: "Write an emergency alert about flooding",
    strongPrompt:
      "Draft a Manatee County emergency alert for flash flooding on Cortez Road between 75th St and US-41. Include: severity (Warning), affected areas, immediate actions residents should take (do NOT drive through standing water, move vehicles to higher ground), shelter information (Manatee Technical College, 6305 SR-70), and emergency contacts (911 for life-threatening, 311 for non-emergency). Under 120 words. All-caps for the severity header.",
    weakOutput:
      "ALERT: There is flooding in the area. Please be careful if you are driving. Avoid flooded areas. Stay safe and monitor weather updates. Contact local authorities if you need help.",
    strongOutput:
      "FLASH FLOOD WARNING — MANATEE COUNTY\n\nAffected Area: Cortez Road between 75th Street West and US-41. Adjacent neighborhoods may also experience street flooding.\n\nImmediate Actions:\n- Do NOT drive through standing water — Turn Around, Don't Drown\n- Move vehicles to higher ground if safely possible\n- Avoid walking near drainage ditches and canals\n- Bring outdoor items inside\n\nEmergency Shelter: Manatee Technical College, 6305 State Road 70 East. Open now with supplies for 200+ residents.\n\nContacts:\n- Life-threatening emergency: Call 911\n- Non-emergency assistance: Call 311\n- Road closures: ManateeCounty.gov/RoadAlerts\n\nThis warning is in effect until 8:00 PM tonight. Monitor local news for updates.",
    technique: "Specificity + Constraints",
    explanation:
      "The strong prompt specifies exact location, required content sections, negative instructions (do NOT drive through water), specific shelter address, and word limit. Emergencies demand precision — vague alerts endanger people.",
  },
  {
    task: "Summarize a department meeting",
    weakPrompt: "Summarize the meeting",
    strongPrompt:
      "Summarize today's Parks & Recreation department meeting for the county administrator. Format: Executive Summary (2-3 sentences), Key Decisions (bulleted), Action Items (who + what + deadline), and Open Issues. The administrator reads 20+ summaries daily, so keep it under 200 words. Lead with the most important decision.",
    weakOutput:
      "The meeting went well. Several topics were discussed including budgets, upcoming events, and staffing. The team agreed to move forward with some new initiatives. Follow-up meetings will be scheduled to discuss further details.",
    strongOutput:
      "Executive Summary: The Parks department approved the $1.2M renovation plan for GT Bray Park, contingent on Board approval at the April 15 meeting. Seasonal hiring will increase by 12 positions to cover summer programming demand.\n\nKey Decisions:\n- GT Bray Park renovation moves to Board agenda (April 15)\n- Summer camp registration opens April 1 (online only this year)\n- Robinson Preserve trail repair contracted to GreenWorks Inc. ($87K)\n\nAction Items:\n- Director Patel: Submit Board packet for GT Bray by April 1\n- HR Liaison Kim: Post 12 seasonal positions by March 25\n- Facilities Manager Ortiz: Schedule GreenWorks pre-construction meeting by March 22\n\nOpen Issues:\n- Palmetto boat ramp ADA compliance — awaiting engineering assessment\n- Volunteer coordinator vacancy — second round of interviews next week",
    technique: "Format + Structure",
    explanation:
      "The strong prompt defines the audience (county administrator), exact sections, word limit, and a prioritization rule (lead with most important decision). The format eliminates fluff and delivers scannable information.",
  },
  {
    task: "Write an HR policy section",
    weakPrompt: "Write about our remote work policy",
    strongPrompt:
      "Write Section 4.2 of the Manatee County Employee Handbook: Remote Work Eligibility and Approval. Cover: eligible positions (not public-facing or equipment-dependent), approval process (supervisor + HR director), required equipment (county-issued laptop, secure internet), performance expectations (same as in-office), and revocation conditions. Do NOT include compensation or benefits — those are in Section 5. Use formal policy language with numbered subsections.",
    weakOutput:
      "Remote Work Policy\n\nEmployees may work from home if approved by their supervisor. Remote workers should have a good internet connection and a quiet workspace. Performance expectations remain the same. The policy may be updated as needed.",
    strongOutput:
      "Section 4.2 — Remote Work Eligibility and Approval\n\n4.2.1 Eligibility Criteria\nRemote work arrangements are available to employees whose positions do not require (a) direct public-facing service delivery, (b) operation of specialized on-site equipment, or (c) physical presence for safety or security functions. Department directors shall maintain a list of eligible classifications.\n\n4.2.2 Approval Process\n(a) Employee submits Form HR-RW1 to immediate supervisor.\n(b) Supervisor evaluates operational feasibility and recommends approval or denial.\n(c) HR Director provides final authorization. Approvals are valid for 12 months and subject to renewal.\n\n4.2.3 Required Equipment and Connectivity\nRemote employees must use county-issued laptops with current security patches. Personal devices are prohibited for accessing county systems. Minimum internet speed: 25 Mbps download / 5 Mbps upload. VPN connection required per IT Policy 7.1.\n\n4.2.4 Performance Standards\nRemote employees are held to identical performance metrics, availability expectations, and response times as in-office staff. Supervisors shall conduct monthly check-ins documented in the performance management system.\n\n4.2.5 Revocation\nRemote work privileges may be revoked with 5 business days notice for: (a) performance deficiency, (b) operational necessity, (c) violation of IT security policies, or (d) failure to maintain required connectivity.",
    technique: "Negative Prompting",
    explanation:
      "The strong prompt uses negative constraints ('Do NOT include compensation or benefits') to keep the output focused. Combined with exact section numbering and formal policy language requirements, this prevents scope creep.",
  },
  {
    task: "Analyze 311 service request data",
    weakPrompt: "Analyze this data for me",
    strongPrompt:
      "Here is an example of how to analyze county data:\n\nInput: 'Animal control calls in Q4 — 312 total, top category: stray dogs (45%), response time: 2.3 hours avg'\nAnalysis: 'Stray dog calls represent nearly half of all animal control requests. The 2.3-hour average response time exceeds the 1-hour target for potentially dangerous animals. Recommendation: Add one field officer to the west district where 60% of stray reports originate.'\n\nNow analyze this: '311 service requests for January 2026 — 1,847 total. Top 5: pothole repair (23%), streetlight outage (18%), code violation (15%), water billing (12%), noise complaint (8%). Average resolution: 4.2 days. Trend: pothole complaints up 40% from Q4 2025.'",
    weakOutput:
      "The data shows various service requests. Potholes are the most common complaint. There are also streetlight and code violation issues. The resolution time could be improved. Overall, there are many requests being handled by the department.",
    strongOutput:
      "311 Service Request Analysis — January 2026\n\nVolume: 1,847 total requests, consistent with seasonal averages.\n\nTop Category Deep Dive:\n1. Pothole Repair (425 requests, 23%): The 40% increase from Q4 2025 aligns with post-hurricane road deterioration and winter weather cycling. At current crew capacity, the backlog will grow by approximately 100 requests/month without intervention.\n2. Streetlight Outages (333 requests, 18%): Concentrated in Districts 3 and 5 based on geographic clustering. May indicate aging infrastructure in those zones rather than isolated failures.\n3. Code Violations (277 requests, 15%): Stable quarter-over-quarter. No action required.\n\nResolution Performance: 4.2-day average is within the 5-day SLA target but trending upward from 3.8 days in Q4.\n\nRecommendations:\n- Allocate emergency pothole repair funding ($45K-$60K) before backlog compounds\n- Request FPL audit of streetlight infrastructure in Districts 3 and 5\n- Monitor resolution time monthly — if it exceeds 4.5 days, consider temporary staffing",
    technique: "Few-Shot",
    explanation:
      "The strong prompt provides a concrete example (animal control analysis) before the actual task. This few-shot pattern shows the AI exactly what depth of analysis, tone, and recommendation format you expect.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// PROMPT ANATOMY DATA (10 scenarios)
// ═══════════════════════════════════════════════════════════════════════════

type TechniqueId =
  | "Zero-Shot"
  | "Few-Shot"
  | "Chain-of-Thought"
  | "Persona/Role"
  | "Negative Prompting"
  | "RTCO Framework";

interface AnatomyScenario {
  prompt: string;
  primaryTechnique: TechniqueId;
  explanation: string;
  breakdown: { label: string; text: string; color: string }[];
}

const anatomyScenarios: AnatomyScenario[] = [
  {
    prompt:
      "List the top 5 reasons residents call 311 in Manatee County and suggest one improvement for each.",
    primaryTechnique: "Zero-Shot",
    explanation:
      "This is a zero-shot prompt — it gives clear instructions without providing examples or step-by-step reasoning. The AI must rely entirely on its training data to answer.",
    breakdown: [
      { label: "Instruction", text: "List the top 5 reasons residents call 311", color: "oklch(0.50 0.12 60)" },
      { label: "Scope", text: "in Manatee County", color: "oklch(0.45 0.14 200)" },
      { label: "Follow-up Task", text: "and suggest one improvement for each", color: "oklch(0.45 0.14 145)" },
    ],
  },
  {
    prompt:
      'Here are two examples of good public notices:\n\nExample 1: "Manatee County will close Cortez Road between 59th and 75th St for repaving March 10-14. Detour via SR-684. Expect 15-min delays."\n\nExample 2: "The Anna Maria Island bridge will undergo inspection April 5-6, 6 AM - 2 PM. One lane will remain open. Marine traffic unaffected."\n\nNow write a public notice for the closure of the Palmetto boat ramp for dock repairs, March 18-25.',
    primaryTechnique: "Few-Shot",
    explanation:
      "Two examples precede the actual task. These examples teach the AI the expected format, length, and level of detail — no explicit rules needed because the pattern is shown, not told.",
    breakdown: [
      { label: "Example 1", text: "Manatee County will close Cortez Road...", color: "oklch(0.45 0.14 145)" },
      { label: "Example 2", text: "The Anna Maria Island bridge will undergo...", color: "oklch(0.45 0.14 145)" },
      { label: "Actual Task", text: "Now write a public notice for the closure of the Palmetto boat ramp...", color: "oklch(0.50 0.12 60)" },
    ],
  },
  {
    prompt:
      "Our IT department has 12 staff, 3,200 employees to support, and a $1.4M annual budget. We need to decide whether to keep our on-premise Exchange server or migrate to Microsoft 365. Think through this step by step: first list costs of each option, then compare staffing requirements, then evaluate security implications, and finally make a recommendation with justification.",
    primaryTechnique: "Chain-of-Thought",
    explanation:
      "The prompt explicitly asks for step-by-step reasoning through a multi-factor decision. Each step builds on the previous one, forcing the AI to show its work rather than jump to a conclusion.",
    breakdown: [
      { label: "Context", text: "12 staff, 3,200 employees, $1.4M budget", color: "oklch(0.45 0.14 200)" },
      { label: "Step 1", text: "first list costs of each option", color: "oklch(0.45 0.14 250)" },
      { label: "Step 2", text: "then compare staffing requirements", color: "oklch(0.45 0.14 250)" },
      { label: "Step 3", text: "then evaluate security implications", color: "oklch(0.45 0.14 250)" },
      { label: "Step 4", text: "finally make a recommendation with justification", color: "oklch(0.45 0.14 250)" },
    ],
  },
  {
    prompt:
      "You are a senior county budget analyst with 15 years of experience in Florida municipal finance. Review the attached Parks department Q1 spending report and identify any line items that exceed 30% of their annual budget allocation. Flag potential issues and recommend corrective actions.",
    primaryTechnique: "Persona/Role",
    explanation:
      "Opening with 'You are a senior county budget analyst' assigns a specific persona with defined expertise. This shapes the AI's vocabulary, depth of analysis, and professional framing.",
    breakdown: [
      { label: "Persona", text: "You are a senior county budget analyst with 15 years of experience in Florida municipal finance", color: "oklch(0.45 0.14 310)" },
      { label: "Task", text: "Review the attached Parks department Q1 spending report", color: "oklch(0.50 0.12 60)" },
      { label: "Criteria", text: "identify any line items that exceed 30% of their annual budget allocation", color: "oklch(0.45 0.14 200)" },
      { label: "Output", text: "Flag potential issues and recommend corrective actions", color: "oklch(0.45 0.14 145)" },
    ],
  },
  {
    prompt:
      "Write a press release about the new county wellness program. Do NOT include specific enrollment numbers. Do NOT make promises about health outcomes. Do NOT use the word 'revolutionary' or 'groundbreaking.' Keep the tone informative, not promotional.",
    primaryTechnique: "Negative Prompting",
    explanation:
      "Three explicit 'Do NOT' instructions prevent common AI tendencies — inflated claims, premature specifics, and hype language. Negative constraints are often more effective than positive ones for controlling tone.",
    breakdown: [
      { label: "Task", text: "Write a press release about the new county wellness program", color: "oklch(0.50 0.12 60)" },
      { label: "Negative Constraint 1", text: "Do NOT include specific enrollment numbers", color: "oklch(0.50 0.14 25)" },
      { label: "Negative Constraint 2", text: "Do NOT make promises about health outcomes", color: "oklch(0.50 0.14 25)" },
      { label: "Negative Constraint 3", text: "Do NOT use 'revolutionary' or 'groundbreaking'", color: "oklch(0.50 0.14 25)" },
      { label: "Tone", text: "informative, not promotional", color: "oklch(0.45 0.14 200)" },
    ],
  },
  {
    prompt:
      "Role: You are the Manatee County Public Information Officer.\nTask: Draft talking points for the County Administrator about the FY2027 budget proposal.\nContext: The budget includes a 3% property tax increase, new stormwater utility fee, and $4M for affordable housing. Public hearing is April 22.\nOutput: 5-7 bullet points, each under 25 words, suitable for speaking at a podium. Plain language, no jargon.",
    primaryTechnique: "RTCO Framework",
    explanation:
      "This prompt explicitly follows the RTCO framework — Role, Task, Context, Output — labeled in the prompt itself. Each component is distinct and clearly separated, producing tightly scoped results.",
    breakdown: [
      { label: "Role", text: "Manatee County Public Information Officer", color: "oklch(0.45 0.14 310)" },
      { label: "Task", text: "Draft talking points for the County Administrator about the FY2027 budget proposal", color: "oklch(0.50 0.12 60)" },
      { label: "Context", text: "3% property tax increase, new stormwater utility fee, $4M for affordable housing, public hearing April 22", color: "oklch(0.45 0.14 200)" },
      { label: "Output", text: "5-7 bullet points, each under 25 words, plain language", color: "oklch(0.45 0.14 145)" },
    ],
  },
  {
    prompt:
      "Explain what a millage rate is to a Manatee County resident who has never owned property before. Use an analogy they would understand. Keep it under 100 words.",
    primaryTechnique: "Zero-Shot",
    explanation:
      "Clear instructions with audience awareness and constraints, but no examples or reasoning chain. The AI must interpret 'analogy they would understand' without being shown a model answer.",
    breakdown: [
      { label: "Task", text: "Explain what a millage rate is", color: "oklch(0.50 0.12 60)" },
      { label: "Audience", text: "a Manatee County resident who has never owned property before", color: "oklch(0.45 0.14 200)" },
      { label: "Method", text: "Use an analogy they would understand", color: "oklch(0.45 0.14 145)" },
      { label: "Constraint", text: "under 100 words", color: "oklch(0.50 0.14 25)" },
    ],
  },
  {
    prompt:
      "You are the Manatee County Emergency Management Director. A Category 2 hurricane is projected to make landfall near Bradenton in 48 hours. Draft an internal action memo to all department heads. Step 1: Summarize current threat level. Step 2: List required departmental actions by priority. Step 3: Establish communication protocols. Step 4: Identify resource needs.",
    primaryTechnique: "Chain-of-Thought",
    explanation:
      "While the prompt opens with a persona, the primary technique is Chain-of-Thought — four explicitly numbered reasoning steps structure the entire output. The persona provides authority but the steps drive the format.",
    breakdown: [
      { label: "Persona", text: "Emergency Management Director", color: "oklch(0.45 0.14 310)" },
      { label: "Context", text: "Category 2 hurricane, 48 hours, near Bradenton", color: "oklch(0.45 0.14 200)" },
      { label: "Step 1", text: "Summarize current threat level", color: "oklch(0.45 0.14 250)" },
      { label: "Step 2", text: "List required departmental actions by priority", color: "oklch(0.45 0.14 250)" },
      { label: "Step 3", text: "Establish communication protocols", color: "oklch(0.45 0.14 250)" },
      { label: "Step 4", text: "Identify resource needs", color: "oklch(0.45 0.14 250)" },
    ],
  },
  {
    prompt:
      'Here is an example of a good incident report summary:\n\n"On March 5, 2026, at 2:15 PM, a water main break occurred at the intersection of 53rd Ave W and Manatee Ave. Utilities crew arrived at 2:42 PM. Service was restored to 340 affected households by 6:10 PM. Root cause: corroded 8-inch cast iron pipe (installed 1987). Total repair cost: $12,400."\n\nNow write a similar summary for: sewer overflow at the Lakewood Ranch service area on March 12, 2026.',
    primaryTechnique: "Few-Shot",
    explanation:
      "One detailed example shows the exact format — timestamp, response time, impact, root cause, cost. The AI mirrors this structure for the new incident without needing explicit formatting instructions.",
    breakdown: [
      { label: "Example", text: "On March 5, 2026, at 2:15 PM, a water main break...", color: "oklch(0.45 0.14 145)" },
      { label: "Task", text: "Now write a similar summary for: sewer overflow...", color: "oklch(0.50 0.12 60)" },
    ],
  },
  {
    prompt:
      "You are a Manatee County HR specialist trained in Florida public employment law. An employee has filed a grievance about being denied a telework request. Do NOT provide legal advice or cite specific Florida statutes — refer them to the County Attorney. Do NOT disclose other employees' telework arrangements. Draft a response that acknowledges the grievance, outlines the review process, and provides a timeline.",
    primaryTechnique: "Negative Prompting",
    explanation:
      "The 'Do NOT provide legal advice' and 'Do NOT disclose other employees' arrangements' constraints are the defining feature. They prevent the AI from overstepping boundaries — the persona and task exist but the negative constraints shape what the output must avoid.",
    breakdown: [
      { label: "Persona", text: "HR specialist trained in Florida public employment law", color: "oklch(0.45 0.14 310)" },
      { label: "Context", text: "Employee filed a grievance about denied telework request", color: "oklch(0.45 0.14 200)" },
      { label: "Negative 1", text: "Do NOT provide legal advice or cite specific Florida statutes", color: "oklch(0.50 0.14 25)" },
      { label: "Negative 2", text: "Do NOT disclose other employees' telework arrangements", color: "oklch(0.50 0.14 25)" },
      { label: "Required Output", text: "acknowledge grievance, outline review process, provide timeline", color: "oklch(0.45 0.14 145)" },
    ],
  },
];

const allTechniques: TechniqueId[] = [
  "Zero-Shot",
  "Few-Shot",
  "Chain-of-Thought",
  "Persona/Role",
  "Negative Prompting",
  "RTCO Framework",
];

// ═══════════════════════════════════════════════════════════════════════════
// CHALLENGE MODE DATA (5 challenges)
// ═══════════════════════════════════════════════════════════════════════════

interface ChallengeTask {
  title: string;
  description: string;
  referencePrompt: string;
}

const challengeTasks: ChallengeTask[] = [
  {
    title: "Meeting Summary",
    description:
      "The County Administrator needs a summary of a 2-hour budget workshop attended by 5 department heads. Key topics: FY2027 priorities, capital improvement deferrals, and a proposed hiring freeze. Write the prompt you would use to get the best summary.",
    referencePrompt:
      "You are an executive assistant to the Manatee County Administrator. Summarize the 2-hour FY2027 budget workshop attended by 5 department heads. Structure: Executive Summary (3 sentences), Decisions Made (bulleted), Unresolved Items, Action Items (owner + deadline). The Administrator reads 15+ summaries daily, so keep it under 300 words. Lead with the most consequential decision. Formal tone.",
  },
  {
    title: "Public Notice",
    description:
      "Manatee County is opening a new community center in Parrish. The grand opening is May 15, 2026 with a ribbon-cutting at 10 AM. Write the prompt you would use to create a public notice announcing this.",
    referencePrompt:
      "Draft a public notice for Manatee County announcing the grand opening of the Parrish Community Center on May 15, 2026. Include: ribbon-cutting time (10 AM), address (12345 US-301 N, Parrish), free activities for families, facility features (gymnasium, meeting rooms, senior lounge, outdoor pavilion), hours of operation, and contact information. Tone: warm and welcoming. Under 200 words. Include a call to action for residents to attend.",
  },
  {
    title: "Budget Memo",
    description:
      "The Parks department needs to justify a $450K request for playground equipment replacement across 6 parks. The current equipment is 15+ years old and has 3 open safety citations. Write the prompt to draft the budget justification memo.",
    referencePrompt:
      "You are the Manatee County Parks & Recreation Director. Draft a budget justification memo to the Budget Office requesting $450,000 for playground equipment replacement across 6 county parks. Context: Current equipment averages 15+ years old, 3 parks have open safety citations from the March 2026 inspection, and insurance liability premiums increased 12% last year due to playground incidents. Structure: Purpose, Background, Cost Breakdown (per park), Risk of Inaction, and Requested Approval. Formal memo format. Under 500 words. Do NOT understate the safety risk — lives are at stake.",
  },
  {
    title: "Incident Report",
    description:
      "A sinkhole appeared in the parking lot of the Manatee County courthouse on March 28, 2026 at approximately 3:45 PM. No injuries, but 4 vehicles were damaged and the east parking section was closed. Write the prompt to generate the incident report.",
    referencePrompt:
      "Write a formal incident report for Manatee County Facilities Management. On March 28, 2026, at approximately 3:45 PM, a sinkhole (estimated 8 ft diameter, 4 ft depth) appeared in the east parking section of the Manatee County Courthouse, 1115 Manatee Ave W, Bradenton. No injuries reported. 4 vehicles damaged. Section closed and barricaded by 4:15 PM. Include: Incident Summary, Timeline of Response, Impact Assessment, Immediate Actions Taken, Root Cause (pending geotechnical assessment), and Recommended Next Steps. Factual, no speculation. Number all sections.",
  },
  {
    title: "Training Outline",
    description:
      "New county employees need onboarding training on the county's AI usage policy. The policy covers approved tools, prohibited uses, data privacy requirements, and the approval process for new AI tools. Write the prompt to create a training outline.",
    referencePrompt:
      "Create a 60-minute training module outline for new Manatee County employees on the AI Usage Policy (Policy IT-2026-03). Cover 4 sections: Approved AI Tools and Their Uses (15 min — list each tool and what it can/cannot be used for), Prohibited Uses and Why (15 min — PII, legal documents, final decisions), Data Privacy and Records Retention (15 min — what can be entered, what must be redacted, retention rules), and Getting New Tools Approved (10 min — request process, IT review, 30-day pilot). Plus 5 min intro and wrap-up. Each section: learning objective, 3 key points, one scenario-based exercise. Tone: practical, not punitive.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function FloatingScore({ value, x }: { value: number; x: number }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -80, scale: 1.5 }}
      transition={{ duration: 1.4, ease: "easeOut" }}
      className="fixed pointer-events-none z-50 font-black text-3xl"
      style={{ color: ACCENT, left: `${x}px`, top: "38%", textShadow: `0 2px 12px oklch(0.42 0.14 155 / 0.4)` }}
    >
      +{value}
    </motion.div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.92 0.01 70)" }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${ACCENT}, oklch(0.50 0.14 170))` }}
        animate={{ width: `${(current / total) * 100}%` }}
        transition={{ duration: 0.4 }}
      />
    </div>
  );
}

function TechniqueBadge({ technique, size = "sm" }: { technique: string; size?: "sm" | "md" }) {
  const color = TECHNIQUE_COLORS[technique] || ACCENT;
  const padding = size === "md" ? "px-4 py-2" : "px-3 py-1.5";
  const text = size === "md" ? "text-sm" : "text-xs";
  return (
    <span
      className={`${padding} ${text} font-bold rounded-full inline-block`}
      style={{ background: `color-mix(in oklch, ${color} 15%, white)`, color, border: `1px solid ${color}` }}
    >
      {technique}
    </span>
  );
}

function GameHeader({
  mode,
  current,
  total,
  score,
  scorePulse,
  onBack,
}: {
  mode: string;
  current: number;
  total: number;
  score: number;
  scorePulse: boolean;
  onBack: () => void;
}) {
  return (
    <header
      className="sticky top-0 z-30 px-4 sm:px-6 py-3"
      style={{
        background: "oklch(0.97 0.008 75 / 0.95)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid oklch(0.90 0.02 75)",
      }}
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm font-medium" style={{ color: TEXT_MUTED }}>
            Cookbook
          </Link>
          <ChevronRight className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.03 55)" }} />
          <button onClick={onBack} className="text-sm font-medium hover:underline" style={{ color: TEXT_MUTED }}>
            Prompt Lab
          </button>
          <ChevronRight className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.03 55)" }} />
          <span className="font-serif font-bold text-sm" style={{ color: TEXT_PRIMARY }}>
            {mode}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium tabular-nums" style={{ color: TEXT_MUTED }}>
            {current + 1}/{total}
          </span>
          <motion.div
            animate={scorePulse ? { scale: [1, 1.25, 1] } : undefined}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: ACCENT_LIGHT, color: ACCENT }}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="text-sm font-black tabular-nums">{score}</span>
          </motion.div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto mt-2">
        <ProgressBar current={current + 1} total={total} />
      </div>
    </header>
  );
}

function ResultsScreen({
  title,
  score,
  maxScore,
  details,
  onPlayAgain,
  onBackToModes,
}: {
  title: string;
  score: number;
  maxScore: number;
  details: { label: string; score: number; maxScore: number }[];
  onPlayAgain: () => void;
  onBackToModes: () => void;
}) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: BG }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="max-w-lg w-full rounded-2xl p-8"
        style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, boxShadow: "0 8px 40px oklch(0.18 0.02 38 / 0.08)" }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <Trophy className="w-16 h-16 mx-auto mb-4" style={{ color: "oklch(0.72 0.18 85)" }} />
        </motion.div>

        <h2 className="font-serif text-3xl font-bold mb-2 text-center" style={{ color: TEXT_PRIMARY }}>
          {title}
        </h2>

        <motion.p
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: "spring" }}
          className="text-5xl font-black mb-1 text-center"
          style={{ color: ACCENT }}
        >
          {score}
        </motion.p>
        <p className="text-sm mb-1 text-center font-medium" style={{ color: TEXT_SECONDARY }}>
          out of {maxScore} points ({pct}%)
        </p>
        <p className="text-base font-bold mb-6 text-center" style={{ color: "oklch(0.35 0.04 50)" }}>
          {pct >= 90
            ? "Outstanding! You have a sharp eye for prompt engineering."
            : pct >= 70
            ? "Great work! You understand the fundamentals."
            : pct >= 50
            ? "Good effort! Review the chapters on specificity and context."
            : "Keep practicing! Try the Jumpstart course for a solid foundation."}
        </p>

        {details.length > 0 && (
          <div className="mb-8">
            <label className="text-xs font-bold uppercase tracking-wider mb-3 block" style={{ color: TEXT_MUTED }}>
              Per-Round Breakdown
            </label>
            <div className="space-y-2">
              {details.map((d, i) => {
                const barPct = d.maxScore > 0 ? (d.score / d.maxScore) * 100 : 0;
                const barColor = barPct >= 80 ? ACCENT : barPct > 0 ? "oklch(0.65 0.14 85)" : "oklch(0.65 0.12 25)";
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.06 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-xs font-bold w-20 text-right truncate" style={{ color: TEXT_SECONDARY }}>
                      {d.label}
                    </span>
                    <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ background: "oklch(0.94 0.01 70)" }}>
                      <motion.div
                        className="h-full rounded-lg"
                        initial={{ width: 0 }}
                        animate={{ width: `${barPct}%` }}
                        transition={{ delay: 0.7 + i * 0.06, duration: 0.5, ease: "easeOut" }}
                        style={{ background: barColor }}
                      />
                    </div>
                    <span className="text-xs font-bold w-12 tabular-nums" style={{ color: "oklch(0.35 0.04 45)" }}>
                      {d.score} pts
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={onPlayAgain}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: ACCENT, color: "oklch(0.98 0.01 75)" }}
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>
          <button
            onClick={onBackToModes}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: "oklch(0.92 0.01 70)", color: "oklch(0.35 0.04 45)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            All Modes
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: "oklch(0.88 0.01 70)", color: "oklch(0.45 0.04 50)" }}
          >
            <Home className="w-4 h-4" />
            Cookbook
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MODE 1: BLIND ARENA
// ═══════════════════════════════════════════════════════════════════════════

async function fetchSSE(prompt: string, signal: AbortSignal): Promise<string> {
  const res = await fetch("/api/try-it", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
    signal,
  });
  if (!res.ok) throw new Error("API error");
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No reader");
  const decoder = new TextDecoder();
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value, { stream: true }).split("\n")) {
      if (line.startsWith("data: ")) {
        const d = line.slice(6);
        if (d === "[DONE]") break;
        try { text += JSON.parse(d).content || ""; } catch { /* skip */ }
      }
    }
  }
  return text;
}

function BlindArena({ onBack }: { onBack: () => void }) {
  const [round, setRound] = useState(0);
  const [voted, setVoted] = useState<"A" | "B" | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [scorePulse, setScorePulse] = useState(false);
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [complete, setComplete] = useState(false);
  const [floatingScores, setFloatingScores] = useState<{ id: number; value: number; x: number }[]>([]);
  const [sideMap] = useState(() => arenaRounds.map(() => (Math.random() > 0.5 ? "A" : "B") as "A" | "B"));
  const [liveMode, setLiveMode] = useState(false);
  const [liveOutputs, setLiveOutputs] = useState<Record<number, { weak: string; strong: string }>>({});
  const [loadingOutputs, setLoadingOutputs] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const data = arenaRounds[round];
  const strongSide = sideMap[round];

  // Try to fetch live outputs for current round
  useEffect(() => {
    if (!liveMode || liveOutputs[round]) return;
    let cancelled = false;
    abortRef.current = new AbortController();
    setLoadingOutputs(true);

    Promise.all([
      fetchSSE(data.weakPrompt, abortRef.current.signal),
      fetchSSE(data.strongPrompt, abortRef.current.signal),
    ])
      .then(([weak, strong]) => {
        if (!cancelled) {
          setLiveOutputs((prev) => ({ ...prev, [round]: { weak, strong } }));
          setLoadingOutputs(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadingOutputs(false);
      });

    return () => { cancelled = true; abortRef.current?.abort(); };
  }, [round, liveMode, data.weakPrompt, data.strongPrompt, liveOutputs]);

  // Check API health on mount to determine if live mode is possible
  useEffect(() => {
    fetch("/api/health")
      .then((r) => { if (r.ok) setLiveMode(true); })
      .catch(() => setLiveMode(false));
  }, []);

  const handleVote = useCallback(
    (side: "A" | "B") => {
      if (voted) return;
      setVoted(side);
      setRevealed(true);
      const isCorrect = side === strongSide;
      const pts = isCorrect ? 10 : 0;
      setScore((prev) => prev + pts);
      setRoundScores((prev) => [...prev, pts]);
      if (pts > 0) {
        setScorePulse(true);
        setTimeout(() => setScorePulse(false), 600);
        const id = Date.now();
        const x = window.innerWidth / 2;
        setFloatingScores((prev) => [...prev, { id, value: pts, x }]);
        setTimeout(() => setFloatingScores((prev) => prev.filter((f) => f.id !== id)), 1500);
      }
    },
    [voted, strongSide]
  );

  const handleNext = useCallback(() => {
    if (round < arenaRounds.length - 1) {
      setRound((prev) => prev + 1);
      setVoted(null);
      setRevealed(false);
    } else {
      setComplete(true);
    }
  }, [round]);

  if (complete) {
    return (
      <ResultsScreen
        title="Arena Complete"
        score={score}
        maxScore={arenaRounds.length * 10}
        details={roundScores.map((s, i) => ({
          label: `Round ${i + 1}`,
          score: s,
          maxScore: 10,
        }))}
        onPlayAgain={() => {
          setRound(0);
          setVoted(null);
          setRevealed(false);
          setScore(0);
          setRoundScores([]);
          setComplete(false);
        }}
        onBackToModes={onBack}
      />
    );
  }

  const live = liveOutputs[round];
  const weakOut = live?.weak || data.weakOutput;
  const strongOut = live?.strong || data.strongOutput;
  const outputA = strongSide === "A" ? strongOut : weakOut;
  const outputB = strongSide === "B" ? strongOut : weakOut;
  const promptA = strongSide === "A" ? data.strongPrompt : data.weakPrompt;
  const promptB = strongSide === "B" ? data.strongPrompt : data.weakPrompt;

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <AnimatePresence>
        {floatingScores.map((fs) => (
          <FloatingScore key={fs.id} value={fs.value} x={fs.x} />
        ))}
      </AnimatePresence>

      <GameHeader
        mode="Blind Arena"
        current={round}
        total={arenaRounds.length}
        score={score}
        scorePulse={scorePulse}
        onBack={onBack}
      />

      <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={round}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            {/* Task Description */}
            <div className="mb-6">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: ACCENT, color: "oklch(0.98 0.01 75)" }}>
                Round {round + 1}
              </span>
              <h2 className="font-serif text-2xl font-bold mt-3 mb-2" style={{ color: TEXT_PRIMARY }}>
                {data.task}
              </h2>
              <p className="text-sm font-medium" style={{ color: TEXT_SECONDARY }}>
                {revealed ? "See the prompts that produced each output below." : "Which output is better? Click to vote."}
              </p>
            </div>

            {/* Revealed prompts */}
            <AnimatePresence>
              {revealed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 overflow-hidden"
                >
                  {[
                    { label: "Prompt A", text: promptA, isStrong: strongSide === "A" },
                    { label: "Prompt B", text: promptB, isStrong: strongSide === "B" },
                  ].map((p) => (
                    <div
                      key={p.label}
                      className="rounded-xl p-4"
                      style={{
                        background: p.isStrong ? "oklch(0.14 0.04 155)" : "oklch(0.14 0.03 25)",
                        border: `1px solid ${p.isStrong ? "oklch(0.30 0.08 155)" : "oklch(0.30 0.06 25)"}`,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold" style={{ color: p.isStrong ? "oklch(0.70 0.12 155)" : "oklch(0.70 0.10 25)" }}>
                          {p.label} {p.isStrong ? "(Strong)" : "(Weak)"}
                        </span>
                      </div>
                      <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono" style={{ color: "oklch(0.85 0.02 70)" }}>
                        {p.text}
                      </pre>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Live mode indicator */}
            {liveMode && (
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: "oklch(0.55 0.18 145)" }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "oklch(0.50 0.10 145)" }}>
                  Live AI outputs
                </span>
              </div>
            )}

            {/* Output panels */}
            {loadingOutputs && liveMode ? (
              <div className="flex items-center justify-center py-12 gap-3" style={{ color: TEXT_MUTED }}>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Generating live AI outputs for both prompts...</span>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {[
                { label: "Output A", text: outputA, side: "A" as const },
                { label: "Output B", text: outputB, side: "B" as const },
              ].map((panel) => {
                const isStrong = strongSide === panel.side;
                const isSelected = voted === panel.side;
                let borderColor = CARD_BORDER;
                let bgColor = CARD_BG;
                if (revealed && isStrong) {
                  borderColor = "oklch(0.50 0.14 155)";
                  bgColor = "oklch(0.96 0.03 155 / 0.5)";
                } else if (revealed && isSelected && !isStrong) {
                  borderColor = "oklch(0.55 0.14 25)";
                  bgColor = "oklch(0.96 0.03 25 / 0.5)";
                } else if (isSelected) {
                  borderColor = ACCENT;
                }

                return (
                  <motion.button
                    key={panel.side}
                    onClick={() => handleVote(panel.side)}
                    disabled={!!voted}
                    whileHover={!voted ? { scale: 1.01, y: -2 } : undefined}
                    whileTap={!voted ? { scale: 0.99 } : undefined}
                    className="text-left rounded-xl p-5 transition-all"
                    style={{
                      background: bgColor,
                      border: `2px solid ${borderColor}`,
                      cursor: voted ? "default" : "pointer",
                      boxShadow: isSelected && !revealed ? `0 4px 16px ${ACCENT}33` : "none",
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>
                        {panel.label}
                      </span>
                      {revealed && isStrong && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-xs font-bold px-2 py-1 rounded-full"
                          style={{ background: ACCENT, color: "oklch(0.98 0.01 75)" }}
                        >
                          Better
                        </motion.span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: TEXT_PRIMARY }}>
                      {panel.text}
                    </p>
                  </motion.button>
                );
              })}
            </div>
            )}

            {/* Technique reveal */}
            <AnimatePresence>
              {revealed && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="rounded-xl p-5 mb-6"
                  style={{ background: ACCENT_LIGHT, border: `1px solid oklch(0.85 0.06 155)` }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <TechniqueBadge technique={data.technique} size="md" />
                    <span className="text-sm font-bold" style={{ color: ACCENT_DARK }}>
                      {voted === strongSide ? "Correct! +10 points" : "Not quite — the other output was stronger."}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: TEXT_SECONDARY }}>
                    {data.explanation}
                  </p>
                  <TechniqueActions technique={data.technique} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Next button */}
            {revealed && (
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, oklch(0.36 0.12 170))`,
                  color: "oklch(0.98 0.01 75)",
                  boxShadow: `0 4px 16px ${ACCENT}33`,
                }}
              >
                {round < arenaRounds.length - 1 ? (
                  <>
                    Next Round <ChevronRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    See Results <Trophy className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MODE 2: PROMPT ANATOMY
// ═══════════════════════════════════════════════════════════════════════════

function PromptAnatomy({ onBack }: { onBack: () => void }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<TechniqueId | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [scorePulse, setScorePulse] = useState(false);
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [complete, setComplete] = useState(false);
  const [floatingScores, setFloatingScores] = useState<{ id: number; value: number; x: number }[]>([]);

  const scenario = anatomyScenarios[index];

  const handleSelect = useCallback(
    (tech: TechniqueId) => {
      if (revealed) return;
      setSelected(tech);
    },
    [revealed]
  );

  const handleSubmit = useCallback(() => {
    if (!selected) return;
    setRevealed(true);
    const isCorrect = selected === scenario.primaryTechnique;
    const pts = isCorrect ? 10 : 0;
    setScore((prev) => prev + pts);
    setRoundScores((prev) => [...prev, pts]);
    if (pts > 0) {
      setScorePulse(true);
      setTimeout(() => setScorePulse(false), 600);
      const id = Date.now();
      const x = window.innerWidth / 2;
      setFloatingScores((prev) => [...prev, { id, value: pts, x }]);
      setTimeout(() => setFloatingScores((prev) => prev.filter((f) => f.id !== id)), 1500);
    }
  }, [selected, scenario]);

  const handleNext = useCallback(() => {
    if (index < anatomyScenarios.length - 1) {
      setIndex((prev) => prev + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      setComplete(true);
    }
  }, [index]);

  if (complete) {
    return (
      <ResultsScreen
        title="Anatomy Complete"
        score={score}
        maxScore={anatomyScenarios.length * 10}
        details={roundScores.map((s, i) => ({
          label: `Scenario ${i + 1}`,
          score: s,
          maxScore: 10,
        }))}
        onPlayAgain={() => {
          setIndex(0);
          setSelected(null);
          setRevealed(false);
          setScore(0);
          setRoundScores([]);
          setComplete(false);
        }}
        onBackToModes={onBack}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <AnimatePresence>
        {floatingScores.map((fs) => (
          <FloatingScore key={fs.id} value={fs.value} x={fs.x} />
        ))}
      </AnimatePresence>

      <GameHeader
        mode="Prompt Anatomy"
        current={index}
        total={anatomyScenarios.length}
        score={score}
        scorePulse={scorePulse}
        onBack={onBack}
      />

      <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-4">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: ACCENT, color: "oklch(0.98 0.01 75)" }}>
                Scenario {index + 1}
              </span>
            </div>

            {/* Prompt display */}
            <div
              className="rounded-xl p-5 mb-6"
              style={{
                background: "oklch(0.14 0.02 70)",
                border: "1px solid oklch(0.25 0.02 70)",
              }}
            >
              <label className="text-xs font-bold uppercase tracking-wider mb-3 block" style={{ color: "oklch(0.55 0.02 70)" }}>
                Identify the primary technique
              </label>
              <pre className="text-sm leading-relaxed whitespace-pre-wrap font-mono" style={{ color: "oklch(0.88 0.02 70)" }}>
                {scenario.prompt}
              </pre>
            </div>

            {/* Color-coded breakdown (after reveal) */}
            <AnimatePresence>
              {revealed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.4 }}
                  className="rounded-xl p-5 mb-6 overflow-hidden"
                  style={{ background: ACCENT_LIGHT, border: `1px solid oklch(0.85 0.06 155)` }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <TechniqueBadge technique={scenario.primaryTechnique} size="md" />
                    <span className="text-sm font-bold" style={{ color: ACCENT_DARK }}>
                      {selected === scenario.primaryTechnique ? "Correct! +10 points" : `The primary technique is ${scenario.primaryTechnique}.`}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: TEXT_SECONDARY }}>
                    {scenario.explanation}
                  </p>
                  <div className="space-y-2">
                    {scenario.breakdown.map((part, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.1 }}
                        className="flex items-start gap-2"
                      >
                        <span
                          className="text-xs font-bold px-2 py-1 rounded shrink-0 mt-0.5"
                          style={{ background: `color-mix(in oklch, ${part.color} 20%, white)`, color: part.color }}
                        >
                          {part.label}
                        </span>
                        <span className="text-xs leading-relaxed" style={{ color: TEXT_SECONDARY }}>
                          {part.text}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                  <TechniqueActions technique={scenario.primaryTechnique} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Technique selection grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {allTechniques.map((tech) => {
                const color = TECHNIQUE_COLORS[tech] || ACCENT;
                const isSelected = selected === tech;
                const isCorrect = tech === scenario.primaryTechnique;

                let bg = CARD_BG;
                let border = `2px solid ${CARD_BORDER}`;
                let textColor = TEXT_PRIMARY;

                if (revealed && isCorrect) {
                  bg = `color-mix(in oklch, ${color} 15%, white)`;
                  border = `2px solid ${color}`;
                  textColor = color;
                } else if (revealed && isSelected && !isCorrect) {
                  bg = "oklch(0.94 0.04 25)";
                  border = "2px solid oklch(0.60 0.16 25)";
                  textColor = "oklch(0.40 0.08 25)";
                } else if (isSelected) {
                  bg = `color-mix(in oklch, ${color} 12%, white)`;
                  border = `2px solid ${color}`;
                  textColor = color;
                }

                return (
                  <motion.button
                    key={tech}
                    onClick={() => handleSelect(tech)}
                    disabled={revealed}
                    whileHover={!revealed ? { scale: 1.03, y: -2 } : undefined}
                    whileTap={!revealed ? { scale: 0.97 } : undefined}
                    className="px-4 py-4 rounded-xl text-sm font-bold transition-colors text-center"
                    style={{
                      background: bg,
                      border,
                      color: textColor,
                      cursor: revealed ? "default" : "pointer",
                    }}
                  >
                    {tech}
                  </motion.button>
                );
              })}
            </div>

            {/* Submit / Next */}
            <div className="flex gap-3 items-center">
              {!revealed ? (
                <motion.button
                  whileHover={selected ? { scale: 1.02 } : undefined}
                  whileTap={selected ? { scale: 0.98 } : undefined}
                  onClick={handleSubmit}
                  disabled={!selected}
                  className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold"
                  style={{
                    background: selected ? `linear-gradient(135deg, ${ACCENT}, oklch(0.36 0.12 170))` : "oklch(0.88 0.01 75)",
                    color: selected ? "oklch(0.98 0.01 75)" : "oklch(0.58 0.03 55)",
                    cursor: selected ? "pointer" : "not-allowed",
                    opacity: selected ? 1 : 0.7,
                    boxShadow: selected ? `0 4px 16px ${ACCENT}33` : "none",
                  }}
                >
                  Check Answer
                </motion.button>
              ) : (
                <>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-black"
                    style={{ background: ACCENT_LIGHT, color: ACCENT }}
                  >
                    +{roundScores[roundScores.length - 1]} pts
                  </motion.div>
                  <motion.button
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNext}
                    className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${ACCENT}, oklch(0.36 0.12 170))`,
                      color: "oklch(0.98 0.01 75)",
                      boxShadow: `0 4px 16px ${ACCENT}33`,
                    }}
                  >
                    {index < anatomyScenarios.length - 1 ? (
                      <>
                        Next <ChevronRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        See Results <Trophy className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MODE 3: CHALLENGE MODE
// ═══════════════════════════════════════════════════════════════════════════

function ChallengeMode({ onBack }: { onBack: () => void }) {
  const [index, setIndex] = useState(0);
  const [userPrompt, setUserPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [showReference, setShowReference] = useState(false);
  const [selfRating, setSelfRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [ratings, setRatings] = useState<number[]>([]);
  const [complete, setComplete] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const task = challengeTasks[index];

  const handleSend = useCallback(async () => {
    if (!userPrompt.trim() || streaming) return;
    setStreaming(true);
    setAiResponse("");
    setShowReference(false);
    setSelfRating(0);

    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/try-it", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userPrompt }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) throw new Error("Request failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              const token = parsed.content || parsed.choices?.[0]?.delta?.content || parsed.token || parsed.text || "";
              accumulated += token;
              setAiResponse(accumulated);
            } catch {
              if (data.trim()) {
                accumulated += data;
                setAiResponse(accumulated);
              }
            }
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setAiResponse("Failed to get response. Make sure the server is running.");
      }
    } finally {
      setStreaming(false);
      setShowReference(true);
    }
  }, [userPrompt, streaming]);

  const handleRate = useCallback(
    (stars: number) => {
      if (submitted) return;
      setSelfRating(stars);
    },
    [submitted]
  );

  const handleSubmitRating = useCallback(() => {
    if (selfRating === 0) return;
    setSubmitted(true);
    setRatings((prev) => [...prev, selfRating]);
  }, [selfRating]);

  const handleNext = useCallback(() => {
    if (index < challengeTasks.length - 1) {
      setIndex((prev) => prev + 1);
      setUserPrompt("");
      setAiResponse("");
      setShowReference(false);
      setSelfRating(0);
      setSubmitted(false);
    } else {
      setComplete(true);
    }
  }, [index]);

  // Cleanup abort controller
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  if (complete) {
    const totalStars = ratings.reduce((sum, r) => sum + r, 0);
    const maxStars = ratings.length * 5;
    return (
      <ResultsScreen
        title="Challenge Complete"
        score={totalStars}
        maxScore={maxStars}
        details={ratings.map((r, i) => ({
          label: challengeTasks[i].title,
          score: r,
          maxScore: 5,
        }))}
        onPlayAgain={() => {
          setIndex(0);
          setUserPrompt("");
          setAiResponse("");
          setShowReference(false);
          setSelfRating(0);
          setSubmitted(false);
          setRatings([]);
          setComplete(false);
        }}
        onBackToModes={onBack}
      />
    );
  }

  const totalScore = ratings.reduce((sum, r) => sum + r, 0);

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <GameHeader
        mode="Challenge"
        current={index}
        total={challengeTasks.length}
        score={totalScore}
        scorePulse={false}
        onBack={onBack}
      />

      <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-4">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: ACCENT, color: "oklch(0.98 0.01 75)" }}>
                Challenge {index + 1}: {task.title}
              </span>
            </div>

            {/* Task description */}
            <div
              className="rounded-xl p-5 mb-6"
              style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
            >
              <p className="text-sm leading-relaxed" style={{ color: TEXT_PRIMARY }}>
                {task.description}
              </p>
            </div>

            {/* User prompt input */}
            <div className="mb-6">
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: TEXT_MUTED }}>
                Your Prompt
              </label>
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Type your prompt here..."
                rows={5}
                className="w-full rounded-xl p-4 text-sm font-mono leading-relaxed resize-y"
                style={{
                  background: "oklch(0.14 0.02 70)",
                  border: "1px solid oklch(0.25 0.02 70)",
                  color: "oklch(0.88 0.02 70)",
                  outline: "none",
                }}
                disabled={streaming || showReference}
              />
              {!showReference && (
                <motion.button
                  whileHover={userPrompt.trim() && !streaming ? { scale: 1.02 } : undefined}
                  whileTap={userPrompt.trim() && !streaming ? { scale: 0.98 } : undefined}
                  onClick={handleSend}
                  disabled={!userPrompt.trim() || streaming}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold mt-3"
                  style={{
                    background: userPrompt.trim() && !streaming ? `linear-gradient(135deg, ${ACCENT}, oklch(0.36 0.12 170))` : "oklch(0.88 0.01 75)",
                    color: userPrompt.trim() && !streaming ? "oklch(0.98 0.01 75)" : "oklch(0.58 0.03 55)",
                    cursor: userPrompt.trim() && !streaming ? "pointer" : "not-allowed",
                  }}
                >
                  {streaming ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Send to AI
                    </>
                  )}
                </motion.button>
              )}
            </div>

            {/* AI Response + Reference side by side */}
            {(aiResponse || streaming) && (
              <div className={`grid grid-cols-1 ${showReference ? "md:grid-cols-2" : ""} gap-4 mb-6`}>
                {/* AI response */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: TEXT_MUTED }}>
                    AI Response (from your prompt)
                  </label>
                  <div
                    className="rounded-xl p-4 min-h-[200px]"
                    style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: TEXT_PRIMARY }}>
                      {aiResponse}
                      {streaming && (
                        <motion.span
                          animate={{ opacity: [1, 0] }}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                          style={{ color: ACCENT }}
                        >
                          |
                        </motion.span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Reference prompt */}
                {showReference && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: "oklch(0.45 0.10 155)" }}>
                      Reference Prompt (Expert Version)
                    </label>
                    <div
                      className="rounded-xl p-4 min-h-[200px]"
                      style={{
                        background: "oklch(0.14 0.04 155)",
                        border: "1px solid oklch(0.30 0.08 155)",
                      }}
                    >
                      <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono" style={{ color: "oklch(0.85 0.02 70)" }}>
                        {task.referencePrompt}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Self-rating */}
            {showReference && !submitted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <label className="text-xs font-bold uppercase tracking-wider mb-3 block" style={{ color: TEXT_MUTED }}>
                  Rate your prompt (compared to the reference)
                </label>
                <div className="flex items-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <motion.button
                      key={s}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRate(s)}
                      className="p-1"
                    >
                      <Star
                        className="w-8 h-8"
                        fill={s <= selfRating ? "oklch(0.72 0.18 85)" : "none"}
                        stroke={s <= selfRating ? "oklch(0.72 0.18 85)" : "oklch(0.75 0.02 70)"}
                        strokeWidth={1.5}
                      />
                    </motion.button>
                  ))}
                </div>
                <motion.button
                  whileHover={selfRating > 0 ? { scale: 1.02 } : undefined}
                  whileTap={selfRating > 0 ? { scale: 0.98 } : undefined}
                  onClick={handleSubmitRating}
                  disabled={selfRating === 0}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold"
                  style={{
                    background: selfRating > 0 ? `linear-gradient(135deg, ${ACCENT}, oklch(0.36 0.12 170))` : "oklch(0.88 0.01 75)",
                    color: selfRating > 0 ? "oklch(0.98 0.01 75)" : "oklch(0.58 0.03 55)",
                    cursor: selfRating > 0 ? "pointer" : "not-allowed",
                  }}
                >
                  Submit Rating
                </motion.button>
              </motion.div>
            )}

            {/* Next button */}
            {submitted && (
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, oklch(0.36 0.12 170))`,
                  color: "oklch(0.98 0.01 75)",
                  boxShadow: `0 4px 16px ${ACCENT}33`,
                }}
              >
                {index < challengeTasks.length - 1 ? (
                  <>
                    Next Challenge <ChevronRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    See Results <Trophy className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CAPSTONE BLUEPRINT MODE
// ═══════════════════════════════════════════════════════════════════════════

const CAPSTONE_ACCENT = "oklch(0.50 0.14 25)";
const CAPSTONE_ACCENT_LIGHT = "oklch(0.94 0.04 25)";

const capstoneSteps = [
  { id: "role", label: "Step 1: Define the Role", prompt: "Who should the AI act as?", placeholder: "e.g., Senior county budget analyst with 15 years of local government experience", tip: "Be specific about expertise level and domain" },
  { id: "goal", label: "Step 2: Set the Goal", prompt: "What should the AI achieve? Include success criteria.", placeholder: "e.g., Analyze Q3 budget variances and recommend 3 specific cuts totaling $256K", tip: "Measurable goals produce measurable results" },
  { id: "context", label: "Step 3: Provide Context", prompt: "What background does the AI need?", placeholder: "e.g., Parks department, $3.2M annual budget, 8% reduction required, 5 major line items...", tip: "The more context, the less the AI guesses" },
  { id: "examples", label: "Step 4: Add Examples", prompt: "Show 1-2 examples of what good output looks like.", placeholder: "e.g., Example variance entry: 'Personnel ($1.8M): 2.1% over budget — overtime in summer months'", tip: "Few-shot examples are the single most effective technique" },
  { id: "thinking", label: "Step 5: Add Thinking Instructions", prompt: "Tell the AI to reason step by step.", placeholder: "Think step by step. First calculate the target reduction, then rank line items, then identify cuts.", tip: "Chain-of-thought improves accuracy on complex tasks" },
  { id: "format", label: "Step 6: Specify Output Format", prompt: "How should the result be structured?", placeholder: "e.g., Executive memo with: 1) Target amount, 2) Line item table, 3) Recommended cuts, 4) Impact analysis", tip: "Explicit format prevents the AI from guessing structure" },
  { id: "constraints", label: "Step 7: Set Constraints", prompt: "What rules must the AI follow?", placeholder: "e.g., Do not recommend cutting personnel. Keep recommendations under $100K each. Use only provided data.", tip: "Constraints are as important as instructions" },
  { id: "negative", label: "Step 8: Add Negative Rules", prompt: "What should the AI NOT do?", placeholder: "e.g., Do not invent statistics. Do not make assumptions about revenue. Do not suggest organizational changes.", tip: "Telling AI what NOT to do prevents common errors" },
  { id: "uncertainty", label: "Step 9: Handle Uncertainty", prompt: "How should the AI handle things it's unsure about?", placeholder: "e.g., If unsure about any figure, flag it with [VERIFY]. If data is missing, say 'Data not provided' rather than estimating.", tip: "This is the defensive prompting layer — critical for government work" },
];

const capstoneLabels: Record<string, string> = {
  role: "You are a",
  goal: "Your goal:",
  context: "Context:",
  examples: "Examples:",
  thinking: "Thinking instructions:",
  format: "Output format:",
  constraints: "Constraints:",
  negative: "What NOT to do:",
  uncertainty: "Uncertainty handling:",
};

function CapstoneMode({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentStep = capstoneSteps[step];
  const filledCount = capstoneSteps.filter((s) => values[s.id]?.trim()).length;

  const assembledPrompt = capstoneSteps
    .filter((s) => values[s.id]?.trim())
    .map((s) => `${capstoneLabels[s.id] || s.label}\n${values[s.id]}`)
    .join("\n\n");

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(assembledPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [assembledPrompt]);

  const completenessLabel =
    filledCount <= 3 ? "Basic" : filledCount <= 6 ? "Solid" : filledCount <= 8 ? "Strong" : "Master";

  if (showPreview) {
    return (
      <div className="min-h-screen" style={{ background: BG }}>
        <header
          className="sticky top-0 z-30 px-4 sm:px-6 py-3"
          style={{
            background: "oklch(0.97 0.008 75 / 0.95)",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid oklch(0.90 0.02 75)",
          }}
        >
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-sm font-medium" style={{ color: TEXT_MUTED }}>
                Cookbook
              </Link>
              <ChevronRight className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.03 55)" }} />
              <button onClick={onBack} className="text-sm font-medium hover:underline" style={{ color: TEXT_MUTED }}>
                Prompt Lab
              </button>
              <ChevronRight className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.03 55)" }} />
              <span className="font-serif font-bold text-sm" style={{ color: TEXT_PRIMARY }}>
                Capstone Blueprint
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ background: CAPSTONE_ACCENT_LIGHT, color: CAPSTONE_ACCENT }}
              >
                {filledCount}/9 steps — {completenessLabel}
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="font-serif text-2xl font-bold mb-2" style={{ color: TEXT_PRIMARY }}>
              Your Complete Prompt
            </h2>
            <p className="text-sm mb-6" style={{ color: TEXT_SECONDARY }}>
              {filledCount} of 9 steps completed — rated <strong>{completenessLabel}</strong>
            </p>

            <div
              className="rounded-xl p-5 mb-6 font-mono text-sm leading-relaxed whitespace-pre-wrap"
              style={{
                background: "oklch(0.14 0.02 70)",
                border: "1px solid oklch(0.25 0.02 70)",
                color: "oklch(0.88 0.02 70)",
              }}
            >
              {assembledPrompt || "(No steps filled yet)"}
            </div>

            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCopy}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold"
                style={{
                  background: `linear-gradient(135deg, ${CAPSTONE_ACCENT}, oklch(0.40 0.14 350))`,
                  color: "oklch(0.98 0.01 75)",
                }}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Prompt"}
              </motion.button>

              <Link href="/builder">
                <motion.span
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold"
                  style={{
                    background: CARD_BG,
                    border: `1px solid ${CARD_BORDER}`,
                    color: TEXT_PRIMARY,
                    cursor: "pointer",
                  }}
                >
                  <Wrench className="w-4 h-4" /> Try in Builder
                </motion.span>
              </Link>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowPreview(false)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold"
                style={{
                  background: CARD_BG,
                  border: `1px solid ${CARD_BORDER}`,
                  color: TEXT_PRIMARY,
                }}
              >
                <ArrowLeft className="w-4 h-4" /> Back to Steps
              </motion.button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <header
        className="sticky top-0 z-30 px-4 sm:px-6 py-3"
        style={{
          background: "oklch(0.97 0.008 75 / 0.95)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid oklch(0.90 0.02 75)",
        }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-medium" style={{ color: TEXT_MUTED }}>
              Cookbook
            </Link>
            <ChevronRight className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.03 55)" }} />
            <button onClick={onBack} className="text-sm font-medium hover:underline" style={{ color: TEXT_MUTED }}>
              Prompt Lab
            </button>
            <ChevronRight className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.03 55)" }} />
            <span className="font-serif font-bold text-sm" style={{ color: TEXT_PRIMARY }}>
              Capstone Blueprint
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium tabular-nums" style={{ color: TEXT_MUTED }}>
              {step + 1}/9
            </span>
            <span
              className="text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: CAPSTONE_ACCENT_LIGHT, color: CAPSTONE_ACCENT }}
            >
              {filledCount} filled
            </span>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-2">
          <ProgressBar current={step + 1} total={9} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step badge */}
            <div className="mb-4">
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ background: CAPSTONE_ACCENT, color: "oklch(0.98 0.01 75)" }}
              >
                {currentStep.label}
              </span>
            </div>

            {/* Step card */}
            <div
              className="rounded-xl p-6 mb-6"
              style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
            >
              <h3 className="font-serif text-xl font-bold mb-2" style={{ color: TEXT_PRIMARY }}>
                {currentStep.prompt}
              </h3>

              <textarea
                value={values[currentStep.id] || ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [currentStep.id]: e.target.value }))}
                placeholder={currentStep.placeholder}
                rows={4}
                className="w-full rounded-xl p-4 text-sm leading-relaxed resize-y mt-3"
                style={{
                  background: "oklch(0.97 0.005 75)",
                  border: `1px solid ${CARD_BORDER}`,
                  color: TEXT_PRIMARY,
                  outline: "none",
                }}
              />

              {/* Tip callout */}
              <div
                className="flex items-start gap-3 mt-4 p-3 rounded-lg"
                style={{ background: CAPSTONE_ACCENT_LIGHT }}
              >
                <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: CAPSTONE_ACCENT }} />
                <p className="text-xs leading-relaxed" style={{ color: "oklch(0.35 0.08 25)" }}>
                  {currentStep.tip}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <div>
                {step > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStep((s) => s - 1)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
                    style={{
                      background: CARD_BG,
                      border: `1px solid ${CARD_BORDER}`,
                      color: TEXT_PRIMARY,
                    }}
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </motion.button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {filledCount >= 1 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowPreview(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
                    style={{
                      background: CARD_BG,
                      border: `1px solid ${CARD_BORDER}`,
                      color: TEXT_PRIMARY,
                    }}
                  >
                    View Prompt
                  </motion.button>
                )}

                {step < capstoneSteps.length - 1 ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStep((s) => s + 1)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${CAPSTONE_ACCENT}, oklch(0.40 0.14 350))`,
                      color: "oklch(0.98 0.01 75)",
                    }}
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowPreview(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${CAPSTONE_ACCENT}, oklch(0.40 0.14 350))`,
                      color: "oklch(0.98 0.01 75)",
                    }}
                  >
                    <Crown className="w-4 h-4" /> View Complete Prompt
                  </motion.button>
                )}
              </div>
            </div>

            {/* Step dots */}
            <div className="flex items-center justify-center gap-1.5 mt-8">
              {capstoneSteps.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setStep(i)}
                  className="w-2.5 h-2.5 rounded-full transition-all"
                  style={{
                    background: i === step
                      ? CAPSTONE_ACCENT
                      : values[s.id]?.trim()
                        ? "oklch(0.70 0.10 25)"
                        : "oklch(0.85 0.02 75)",
                  }}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MODE SELECTION (main page)
// ═══════════════════════════════════════════════════════════════════════════

const modes: {
  id: GameMode;
  icon: typeof Swords;
  title: string;
  description: string;
  difficulty: string;
  difficultyColor: string;
  time: string;
  rounds: string;
}[] = [
  {
    id: "arena",
    icon: Swords,
    title: "Blind Arena",
    description: "Which output is better? Vote, then see why.",
    difficulty: "Beginner",
    difficultyColor: "oklch(0.45 0.14 145)",
    time: "~8 min",
    rounds: "10 rounds",
  },
  {
    id: "anatomy",
    icon: Microscope,
    title: "Prompt Anatomy",
    description: "Identify the techniques that make prompts work.",
    difficulty: "Intermediate",
    difficultyColor: "oklch(0.45 0.14 250)",
    time: "~10 min",
    rounds: "10 scenarios",
  },
  {
    id: "challenge",
    icon: Wrench,
    title: "Challenge Mode",
    description: "Build the best prompt you can for each scenario.",
    difficulty: "Advanced",
    difficultyColor: "oklch(0.50 0.14 25)",
    time: "~15 min",
    rounds: "5 challenges",
  },
  {
    id: "capstone",
    icon: Crown,
    title: "Capstone Blueprint",
    description: "Build a complete prompt using ALL techniques. Follow the 9-step Master Blueprint from simple to sophisticated.",
    difficulty: "Advanced",
    difficultyColor: "oklch(0.50 0.14 300)",
    time: "~15 min",
    rounds: "9 steps",
  },
];

function ModeSelection({ onSelect }: { onSelect: (mode: GameMode) => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: BG }}>
      <div className="max-w-3xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, oklch(0.36 0.12 170))` }}
          >
            <FlaskConical className="w-10 h-10" style={{ color: "oklch(0.98 0.01 75)" }} />
          </motion.div>
          <h1 className="font-serif text-4xl font-bold mb-2" style={{ color: TEXT_PRIMARY }}>
            Prompt Lab
          </h1>
          <p className="text-base" style={{ color: TEXT_SECONDARY }}>
            Choose your learning mode.
          </p>
          <div className="mt-4">
            <Link href="/" className="text-xs font-medium hover:underline" style={{ color: TEXT_MUTED }}>
              Back to Cookbook
            </Link>
          </div>
        </motion.div>

        {/* Mode cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modes.map((mode, i) => {
            const Icon = mode.icon;
            return (
              <motion.button
                key={mode.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.12, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(mode.id)}
                className="text-left rounded-2xl p-6 transition-shadow"
                style={{
                  background: CARD_BG,
                  border: `1px solid ${CARD_BORDER}`,
                  boxShadow: "0 4px 20px oklch(0.18 0.02 38 / 0.06)",
                  cursor: "pointer",
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl mb-4 flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${ACCENT}, oklch(0.36 0.12 170))` }}
                >
                  <Icon className="w-7 h-7" style={{ color: "oklch(0.98 0.01 75)" }} />
                </div>

                <h3 className="font-serif text-xl font-bold mb-1" style={{ color: TEXT_PRIMARY }}>
                  {mode.title}
                </h3>
                <p className="text-sm mb-4 leading-relaxed" style={{ color: TEXT_SECONDARY }}>
                  {mode.description}
                </p>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: `color-mix(in oklch, ${mode.difficultyColor} 15%, white)`, color: mode.difficultyColor }}
                  >
                    {mode.difficulty}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium" style={{ color: TEXT_MUTED }}>
                    <Clock className="w-3 h-3" />
                    {mode.time}
                  </span>
                </div>

                <span className="text-xs font-medium" style={{ color: TEXT_MUTED }}>
                  {mode.rounds}
                </span>

                <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${CARD_BORDER}` }}>
                  <span
                    className="text-sm font-bold flex items-center gap-1"
                    style={{ color: ACCENT }}
                  >
                    Start <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default function Game() {
  const [activeMode, setActiveMode] = useState<GameMode | null>(null);

  if (activeMode === "arena") return <BlindArena onBack={() => setActiveMode(null)} />;
  if (activeMode === "anatomy") return <PromptAnatomy onBack={() => setActiveMode(null)} />;
  if (activeMode === "challenge") return <ChallengeMode onBack={() => setActiveMode(null)} />;
  if (activeMode === "capstone") return <CapstoneMode onBack={() => setActiveMode(null)} />;

  return <ModeSelection onSelect={setActiveMode} />;
}
