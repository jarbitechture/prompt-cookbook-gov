// ============================================================
// Cookbook Data — Manatee County AI Working Group
// Sources: manatee_county_prompt_manual.docx, AI governance registry,
// GovAI Coalition, NACo, NIST
// ============================================================

export type Difficulty = "beginner" | "intermediate" | "advanced";
export type RiskTier = "green" | "yellow" | "red";
export type CardType = "manual" | "template" | "governance" | "agent";

export interface TryItVariable {
  name: string;
  label: string;
  placeholder: string;
  suggestions: string[];
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  part: string;
  partLabel: string;
  difficulty: Difficulty;
  icon: string;
  cardType: CardType;
  riskTier: RiskTier;
  qualityScore: number | null;
  summary: string;
  source: string;
  persona: string;
  personaRole: string;
  content: string[];
  promptExamples: string[];
  keyTakeaways: string[];
  tryItTemplate: string;
  tryItVariables: TryItVariable[];
  supportedTools?: string[];
  taskType?: string;
}

export const parts = [
  { id: "part1", label: "Part I: Foundations & Techniques", description: "Core concepts, safety, and the prompting techniques you'll use everywhere" },
  { id: "part2", label: "Part II: Ready-to-Use Templates", description: "Plug-and-play templates that apply the techniques from Part I" },
  { id: "part3", label: "Part III: Use Cases & Strategy", description: "Risk-tiered use cases, efficiency strategies, and when to use what" },
  { id: "part4", label: "Part IV: Governance & Mastery", description: "Scoring, auditing, compliance, and advanced topics" },
];

export const chapters: Chapter[] = [
  // ── PART I: FOUNDATIONS (from manual Ch. 1-2) ──────────────
  {
    id: "ch01",
    number: 1,
    title: "What Is a Prompt?",
    subtitle: "Definitions and fundamentals of prompting AI systems",
    part: "part1",
    partLabel: "Part I: Foundations",
    difficulty: "beginner",
    icon: "📝",
    cardType: "manual",
    riskTier: "green",
    qualityScore: null,
    summary: "Learn the basic vocabulary of AI prompting — what prompts are, the different types, and why it matters for county staff.",
    source: "Manatee County Prompt Manual, Ch. 1; City of San Jose Guidelines",
    persona: "Maria Chen",
    personaRole: "HR Coordinator, Manatee County Human Resources",
    content: [
      "Generative AI relies on a user to \"prompt\" the AI to generate content. Prompts are any direction provided by a user. Think of it like giving instructions to a very capable but very literal assistant — the clearer you are, the better the result.",
      "There are several types of prompts: Text-to-Text (writing emails, summaries, memos), Text-to-Image (generating illustrations or diagrams), Voice+Text-to-Audio (transcription, voice synthesis), Image+Text-to-Video (creating visual content), and Multi-modal (combining multiple input types in a single prompt).",
      "A 2024 NACo survey found that 75% of county officials and staff already use GenAI tools at work and in personal life. This means Manatee County staff are likely already prompting AI systems without formal guidance. Establishing a shared vocabulary is the recommended first step.",
      "The AI Working Group created this cookbook so that every department — from Utilities to HR to Emergency Management — speaks the same language when it comes to AI prompting.",
      "Tip: Before your next prompt, pause 5 seconds and ask: 'Am I asking for something vague, or a specific thing?' That one habit will improve every prompt you write."
    ],
    promptExamples: [
      "Text-to-Text: \"Draft a summary of the new employee onboarding checklist for Manatee County HR.\"",
      "Text-to-Image: \"Create an illustration of the Manatee County Government Center building for our annual report.\"",
      "Multi-modal: \"Review this scanned permit application [attached] and extract the applicant name, address, and permit type into a table.\""
    ],
    keyTakeaways: [
      "A prompt is simply a direction or instruction you give to an AI tool",
      "Types include text-to-text, text-to-image, voice-to-audio, and multi-modal",
      "75% of county staff are already using AI — shared vocabulary matters",
      "This cookbook gives every department a common starting point"
    ],
    tryItTemplate: "I am a {{role}} at Manatee County. Explain what a {{topic}} is in simple terms that I can share with {{audience}}. Keep the tone {{tone}} and limit the response to {{format}}.",
    tryItVariables: [
      { name: "role", label: "Your Role", placeholder: "e.g., HR Coordinator", suggestions: ["HR Coordinator", "IT Analyst", "Communications Officer", "Department Director", "Utilities Field Supervisor"] },
      { name: "topic", label: "Topic", placeholder: "e.g., generative AI prompt", suggestions: ["generative AI prompt", "large language model", "AI hallucination", "prompt engineering", "RAG system"] },
      { name: "audience", label: "Audience", placeholder: "e.g., new employees", suggestions: ["new employees", "department heads", "elected officials", "field staff", "the public"] },
      { name: "tone", label: "Tone", placeholder: "e.g., friendly and professional", suggestions: ["friendly and professional", "formal", "casual and approachable", "technical but clear"] },
      { name: "format", label: "Format", placeholder: "e.g., 3 bullet points", suggestions: ["3 bullet points", "one paragraph", "5 sentences", "a brief FAQ", "100 words or less"] }
    ]
  },
  {
    id: "ch02",
    number: 2,
    title: "Prompt Safety Rules",
    subtitle: "Four baseline rules every county employee must follow before their first prompt",
    part: "part1",
    partLabel: "Part I: Foundations",
    difficulty: "beginner",
    icon: "🛡️",
    cardType: "manual",
    riskTier: "yellow",
    qualityScore: null,
    summary: "The four non-negotiable rules for using AI responsibly at Manatee County — public records exposure, human verification, responsible usage, and attribution.",
    source: "Manatee County Prompt Manual, Ch. 2; GovAI Coalition",
    persona: "James Torres",
    personaRole: "IT Analyst, Manatee County Information Technology",
    content: [
      "Rule 1 — Public Records Exposure: Any information entered into generative AI tools may be subject to Florida's Public Records Act, viewable by the vendor, or inadvertently exposed. Use only sanctioned tools such as Copilot or ChatGPT Enterprise, and never include non-public or sensitive information in prompts.",
      "Rule 2 — Human Verification: Review, revise, and fact-check via multiple sources any content created from GenAI. You are responsible for accuracy and appropriateness of every output you use.",
      "Rule 3 — Responsible Usage: Use AI tools responsibly by minimizing unnecessary usage. Use traditional search for simple questions, consolidate prompts where feasible, and set reasonable limits on output length.",
      "Rule 4 — Attribution: Use the references and labels that Copilot, ChatGPT, and similar tools provide. Keep AI-generated content clearly identified as such.",
      "Florida's Sunshine Law and public records requirements are among the most expansive in the nation. The AI Working Group recommends establishing these baseline prompting rules within the immediate 0-6 month action window.",
      "Safety: Florida Sunshine Law applies to AI prompts and outputs. They may be subject to public records requests. If you wouldn't email it, don't prompt it."
    ],
    promptExamples: [
      "SAFE: \"Draft a general template for responding to resident inquiries about recycling schedules.\"",
      "UNSAFE: \"Here is resident John Smith's complaint with his address and phone number — draft a response.\" (Never include PII!)",
      "SAFE: \"Summarize the key points of Florida's public records law for a staff training presentation.\"",
      "SAFE: \"Create a checklist for verifying AI-generated content before publishing to the county website.\""
    ],
    keyTakeaways: [
      "Never include non-public or sensitive information in AI prompts",
      "Always review, revise, and fact-check AI-generated content before use",
      "Use traditional search engines for simple one-time questions",
      "Keep AI-generated content clearly identified with proper attribution",
      "Florida Sunshine Law makes prompt safety especially critical for county staff"
    ],
    tryItTemplate: "I am a {{role}} at Manatee County. I need to {{task}}. Draft a prompt that follows all four safety rules — no personal data, no sensitive information. The output should be {{format}} and appropriate for {{audience}}.",
    tryItVariables: [
      { name: "role", label: "Your Role", placeholder: "e.g., IT Analyst", suggestions: ["IT Analyst", "HR Coordinator", "PIO", "Department Director", "Emergency Management Coordinator"] },
      { name: "task", label: "Task", placeholder: "e.g., draft a public notice", suggestions: ["draft a public notice", "create a training outline", "summarize a policy document", "write an internal memo", "prepare meeting notes"] },
      { name: "format", label: "Format", placeholder: "e.g., a formal memo", suggestions: ["a formal memo", "bullet points", "an email draft", "a one-page summary", "a FAQ document"] },
      { name: "audience", label: "Audience", placeholder: "e.g., county staff", suggestions: ["county staff", "the general public", "department heads", "the Board of County Commissioners", "new hires"] }
    ]
  },

  // ── PART II: READY-TO-USE TEMPLATES (from governance registry) ──
  {
    id: "ch03",
    number: 3,
    title: "Email Tone Adjuster",
    subtitle: "Convert casual or terse emails into professional, courteous county communications",
    part: "part2",
    partLabel: "Part II: Ready-to-Use Templates",
    difficulty: "beginner",
    icon: "✉️",
    cardType: "template",
    riskTier: "green",
    qualityScore: 9.6,
    summary: "A production-tested template that transforms informal email drafts into polished, professional communications suitable for county business.",
    source: "Governance Registry: email-tone-adjuster v1 — Tested, Quality Score 9.6/10",
    persona: "Lisa Morales",
    personaRole: "Communications Officer, Manatee County Public Affairs",
    content: [
      "This template is one of ten production-tested prompts in the Manatee County governance registry. It scored 9.6 out of 10 on the 9-dimension rubric, with perfect marks for safety (10.0), time saved (10.0), and reusability (10.0).",
      "The template preserves the core message and intent of your email while making the language more formal and diplomatic. It removes casual language, slang, or overly direct phrasing and ensures the tone is warm but professional — exactly what county communications require.",
      "Constraints built into the template: it will not change factual content, will not add new information, keeps the same length (plus or minus 20%), and maintains the sender's signature and closing.",
      "This is a green-tier prompt — no human review required before use. It works with M365 Copilot and ChatGPT.",
      "Tip: Always specify the intended audience and desired tone. 'Professional but friendly for external residents' gives very different results than 'concise for internal team.'"
    ],
    promptExamples: [
      "You are a professional communication assistant for Manatee County.\n\nYour task is to adjust the tone of an email draft to be more professional and courteous.\n\n**Instructions**:\n1. Preserve the core message and intent\n2. Make language more formal and diplomatic\n3. Remove casual language, slang, or overly direct phrasing\n4. Ensure tone is warm but professional\n\n**Constraints**:\n- Do not change factual content\n- Do not add new information\n- Keep the same length (±20%)\n- Maintain the sender's signature/closing\n\nAdjust the following email:",
      "Example input: \"Hey can u send me that report ASAP\"\nExample output: \"Good morning, could you please send me that report at your earliest convenience? Thank you for your assistance.\""
    ],
    keyTakeaways: [
      "Scored 9.6/10 — one of the highest-rated templates in the registry",
      "Green tier: safe to use without additional review",
      "Preserves your message while upgrading the tone",
      "Works with both Copilot and ChatGPT",
      "Ideal for inter-department emails, resident correspondence, and vendor communications"
    ],
    tryItTemplate: "You are a professional communication assistant for Manatee County.\n\nAdjust the tone of this email to be more professional and courteous:\n\n\"{{email_draft}}\"\n\nThe email is from a {{role}} and is being sent to {{recipient}}. Keep the tone {{tone}}.",
    tryItVariables: [
      { name: "email_draft", label: "Your Email Draft", placeholder: "e.g., Hey, can you get me those budget numbers by Friday?", suggestions: ["Hey, can you get me those budget numbers by Friday?", "We need to talk about the project delays ASAP", "FYI the meeting is moved to 3pm tomorrow", "Can someone explain why this permit was denied?", "Just wanted to let you know the report is done"] },
      { name: "role", label: "Sender Role", placeholder: "e.g., Department Director", suggestions: ["Department Director", "HR Coordinator", "IT Analyst", "PIO", "Utilities Field Supervisor"] },
      { name: "recipient", label: "Recipient", placeholder: "e.g., a vendor", suggestions: ["a vendor", "a resident", "county leadership", "a colleague", "the Board of County Commissioners"] },
      { name: "tone", label: "Desired Tone", placeholder: "e.g., warm but professional", suggestions: ["warm but professional", "formal and diplomatic", "friendly and approachable", "direct but courteous"] }
    ],
    supportedTools: ["m365-copilot", "gpt"],
    taskType: "transformation"
  },
  {
    id: "ch04",
    number: 4,
    title: "Meeting Notes Summarizer",
    subtitle: "Transform verbose meeting notes into structured, actionable summaries",
    part: "part2",
    partLabel: "Part II: Ready-to-Use Templates",
    difficulty: "beginner",
    icon: "📋",
    cardType: "template",
    riskTier: "green",
    qualityScore: 9.48,
    summary: "Extracts key decisions, action items, and discussion topics from meeting notes into a clean, structured format.",
    source: "Governance Registry: meeting-notes-summarizer v1 — Tested, Quality Score 9.48/10",
    persona: "David Park",
    personaRole: "Emergency Management Coordinator, Manatee County Public Safety",
    content: [
      "After every county meeting — from BOCC work sessions to department stand-ups — someone needs to distill the notes into something actionable. This template does that automatically.",
      "It extracts three categories: Key Decisions (what was decided), Action Items (who needs to do what), and Discussion Topics (what was talked about). The output stays under 300 words.",
      "Built-in constraints: the template will not add information that was not in the original notes, will not interpret or make assumptions, maintains professional tone throughout, and flags any confidential items clearly.",
      "Quality score of 9.48/10 with 100% test pass rate across golden path, realistic, and edge case scenarios. Accuracy score: 8.7, Safety: 10.0, Time saved: 10.0, Reusability: 10.0.",
      "Tip: The best meeting summaries include three things: decisions made, action items with owners, and next steps with dates. Tell the AI to use this structure every time."
    ],
    promptExamples: [
      "You are a professional assistant for Manatee County government.\n\nYour task is to read meeting notes and create a structured summary.\n\n**Instructions**:\n1. Extract key decisions, action items, and discussion topics\n2. Format as bullet points with clear headers\n3. List action items with assignees if mentioned\n4. Keep summary concise (under 300 words)\n\n**Constraints**:\n- Do not add information not in the original notes\n- Do not interpret or make assumptions\n- Always maintain professional tone\n- If notes mention confidential items, flag them clearly\n\n**Output Format**:\n## Key Decisions\n- [Decision 1]\n\n## Action Items\n- [Action] - Owner: [Name]\n\n## Discussion Topics\n- [Topic 1]"
    ],
    keyTakeaways: [
      "Scored 9.48/10 with 100% test pass rate",
      "Outputs three clear sections: Decisions, Action Items, Discussion Topics",
      "Flags confidential items automatically",
      "Under 300 words — perfect for email distribution after meetings",
      "Works with Copilot and ChatGPT"
    ],
    tryItTemplate: "You are a professional assistant for Manatee County government.\n\nSummarize these meeting notes into Key Decisions, Action Items, and Discussion Topics:\n\n\"{{meeting_notes}}\"\n\nThis was a {{meeting_type}} attended by {{attendees}}. Keep the summary under {{length}} words.",
    tryItVariables: [
      { name: "meeting_notes", label: "Meeting Notes", placeholder: "Paste your meeting notes here...", suggestions: ["Discussed Q3 budget shortfall. Director Smith proposed 5% cuts across departments. IT requested exception for cybersecurity upgrade. Vote: approved 5-2. Action: Finance to prepare revised budget by March 15.", "Weekly standup: Project Alpha on track, Project Beta delayed 2 weeks due to vendor issues. New hire starts Monday. Reminder: timesheets due Friday.", "Emergency preparedness review: hurricane season prep, shelter locations confirmed, communication plan needs update by April 1."] },
      { name: "meeting_type", label: "Meeting Type", placeholder: "e.g., department standup", suggestions: ["department standup", "BOCC work session", "project review", "emergency planning meeting", "budget committee"] },
      { name: "attendees", label: "Attendees", placeholder: "e.g., department heads", suggestions: ["department heads", "the full team", "county leadership", "project stakeholders", "the AI Working Group"] },
      { name: "length", label: "Max Length", placeholder: "e.g., 300", suggestions: ["200", "300", "500", "one page"] }
    ],
    supportedTools: ["m365-copilot", "gpt", "chatgpt"],
    taskType: "summarization"
  },
  {
    id: "ch05",
    number: 5,
    title: "Plain Language Converter",
    subtitle: "Simplify government jargon for better citizen understanding and accessibility",
    part: "part2",
    partLabel: "Part II: Ready-to-Use Templates",
    difficulty: "beginner",
    icon: "💬",
    cardType: "template",
    riskTier: "green",
    qualityScore: 9.32,
    summary: "Converts technical or bureaucratic language into plain English that residents can actually understand, targeting an 8th-grade reading level.",
    source: "Governance Registry: plain-language-converter v1 — Tested, Quality Score 9.32/10",
    persona: "Rachel Kim",
    personaRole: "PIO, Manatee County Public Information Office",
    content: [
      "Government documents are full of jargon that residents struggle to understand. This template converts bureaucratic language into plain English — replacing jargon with everyday words, shortening sentences to 15-20 words, using active voice, and breaking complex ideas into simple steps.",
      "It targets an 8th-grade reading level while preserving accuracy. Legal or technical terms are kept when necessary but defined in context.",
      "Example: Before — \"Pursuant to Section 125.66, Florida Statutes, the commencement of said project shall...\" After — \"According to Florida law, the project will begin...\"",
      "This is essential for public-facing content: website pages, press releases, resident notices, and FAQ documents. The PIO team uses this template regularly for county communications.",
      "Important: County communications should target an 8th-grade reading level. Tell the AI to 'simplify to an 8th-grade reading level' for public-facing documents."
    ],
    promptExamples: [
      "You are a plain language specialist for Manatee County government.\n\nConvert this text to plain English for citizens:\n\n**Instructions**:\n1. Replace jargon with everyday words\n2. Shorten long sentences (aim for 15-20 words)\n3. Use active voice instead of passive\n4. Break complex ideas into simple steps\n5. Maintain accuracy of information\n\n**Constraints**:\n- Do not oversimplify to the point of inaccuracy\n- Keep legal/technical terms if necessary (define them)\n- Target 8th grade reading level\n- Preserve all key facts and requirements",
      "Before: \"The Board of County Commissioners hereby authorizes the County Administrator to execute a contract with the aforementioned vendor.\"\nAfter: \"The County Commissioners approved a contract with this vendor. The County Administrator will sign it.\""
    ],
    keyTakeaways: [
      "Targets 8th-grade reading level — accessible to nearly all residents",
      "Replaces jargon, shortens sentences, uses active voice",
      "Keeps legal terms when needed but defines them clearly",
      "Essential for website content, press releases, and resident notices",
      "Quality score: 9.32/10 — tested and production-ready"
    ],
    tryItTemplate: "You are a plain language specialist for Manatee County government.\n\nConvert this text to plain English for citizens:\n\n\"{{government_text}}\"\n\nThis will be used in a {{document_type}} for {{audience}}. Target a {{reading_level}} reading level.",
    tryItVariables: [
      { name: "government_text", label: "Government Text", placeholder: "Paste the text to simplify...", suggestions: ["Pursuant to Section 125.66, Florida Statutes, the commencement of said project shall be contingent upon the appropriation of funds.", "The applicant shall submit a completed application form together with all required supplementary documentation to the Department of Building and Development Services.", "Failure to comply with the aforementioned requirements may result in the revocation of the previously granted conditional use permit."] },
      { name: "document_type", label: "Document Type", placeholder: "e.g., website page", suggestions: ["website page", "press release", "resident notice", "FAQ document", "permit instructions"] },
      { name: "audience", label: "Audience", placeholder: "e.g., residents", suggestions: ["residents", "business owners", "permit applicants", "parents", "property owners"] },
      { name: "reading_level", label: "Reading Level", placeholder: "e.g., 8th grade", suggestions: ["6th grade", "8th grade", "10th grade", "general public"] }
    ],
    supportedTools: ["m365-copilot", "gpt", "chatgpt"],
    taskType: "transformation"
  },
  {
    id: "ch06",
    number: 6,
    title: "Status Update Formatter",
    subtitle: "Standardize project status updates for consistent leadership reporting",
    part: "part2",
    partLabel: "Part II: Ready-to-Use Templates",
    difficulty: "intermediate",
    icon: "📊",
    cardType: "template",
    riskTier: "green",
    qualityScore: 9.4,
    summary: "Takes informal project updates and formats them into a standard template with Progress, Blockers, Next Steps, and Timeline Status.",
    source: "Governance Registry: status-update-formatter v1 — Tested, Quality Score 9.4/10",
    persona: "Carlos Rivera",
    personaRole: "Department Director, Manatee County Public Works",
    content: [
      "Every department director sends status updates to leadership, but formats vary wildly. This template standardizes them into a consistent structure: Progress This Period, Current Blockers (with impact ratings), Next Steps (with due dates), and Timeline Status.",
      "The template is deliberately honest — it will not add optimistic spin to negative updates or hide problems. It preserves all numerical data exactly as provided and keeps the tone factual and objective.",
      "This is especially valuable for cross-department reporting where the County Administrator needs to compare progress across Public Works, IT, Utilities, and other departments in a consistent format.",
      "Quality score: 9.4/10. The template has been tested against real county project updates and produces clean, scannable output every time."
    ],
    promptExamples: [
      "You are a project coordination assistant for Manatee County.\n\nFormat this status update into a standard template:\n\n**Instructions**:\n1. Extract key information from informal update\n2. Categorize into: Progress, Blockers, Next Steps, Timeline\n3. Format consistently\n4. Highlight risks or delays\n\n**Constraints**:\n- Do not add optimistic spin to negative updates\n- Do not hide or minimize problems\n- Keep factual and objective\n- Preserve all numerical data exactly\n\n**Output Format**:\n**Project**: [Name]\n**Progress This Period**: ...\n**Current Blockers**: ... Impact: [High/Med/Low]\n**Next Steps**: ... Due: [Date]\n**Timeline Status**: [On Track / At Risk / Delayed]"
    ],
    keyTakeaways: [
      "Standardizes reporting across all departments",
      "Honest by design — will not sugarcoat bad news",
      "Includes impact ratings for blockers and due dates for next steps",
      "Quality score: 9.4/10 with consistent output formatting",
      "Ideal for weekly leadership briefings and board reports"
    ],
    tryItTemplate: "You are a project coordination assistant for Manatee County.\n\nFormat this informal update into a standard status report:\n\n\"{{update_text}}\"\n\nThis is for the {{project_name}} project, reporting period: {{period}}. The audience is {{audience}}.",
    tryItVariables: [
      { name: "update_text", label: "Informal Update", placeholder: "Paste your informal status update...", suggestions: ["Road resurfacing on Cortez Rd is about 60% done, but we hit a water main issue last Tuesday that set us back. Contractor says 2 more weeks. Budget is still OK but tight.", "New permitting software rollout going well, 3 departments onboarded. IT still working on integration with legacy system. Training scheduled for next month.", "Hurricane prep supplies ordered and 80% received. Still waiting on generator parts from vendor. Shelter inspections start next week."] },
      { name: "project_name", label: "Project Name", placeholder: "e.g., Cortez Road Resurfacing", suggestions: ["Cortez Road Resurfacing", "Permitting Software Rollout", "Hurricane Preparedness", "Fleet Electrification", "County Website Redesign"] },
      { name: "period", label: "Reporting Period", placeholder: "e.g., March 1-15, 2026", suggestions: ["March 1-15, 2026", "Week of March 17", "Q1 2026", "February 2026"] },
      { name: "audience", label: "Audience", placeholder: "e.g., County Administrator", suggestions: ["County Administrator", "Board of County Commissioners", "department heads", "project stakeholders"] }
    ],
    supportedTools: ["m365-copilot", "gpt"],
    taskType: "formatting"
  },
  {
    id: "ch07",
    number: 7,
    title: "Document Proofreader",
    subtitle: "Catch spelling, grammar, and punctuation errors before documents go out",
    part: "part2",
    partLabel: "Part II: Ready-to-Use Templates",
    difficulty: "beginner",
    icon: "🔍",
    cardType: "template",
    riskTier: "green",
    qualityScore: 9.4,
    summary: "Identifies and corrects errors while maintaining the original voice and style. Marks uncertain corrections with [CHECK] flags.",
    source: "Governance Registry: document-proofreader v1 — Tested, Quality Score 9.4/10",
    persona: "Angela Foster",
    personaRole: "HR Coordinator, Manatee County Human Resources",
    content: [
      "Every document that leaves a county office should be error-free. This template catches spelling, grammar, and punctuation errors while maintaining the original voice and style of the writer.",
      "A key feature: when the template is uncertain about a correction, it marks it with [CHECK: ...] so you can make the final call. It does not rewrite extensively unless grammatically necessary, and it preserves all formatting (bullets, numbers, headings).",
      "The output includes a [NOTES] section at the end listing all significant changes made, so you have a clear audit trail of what was corrected.",
      "Quality score: 9.4/10. Particularly useful for board memos, press releases, grant applications, and any document that represents the county publicly."
    ],
    promptExamples: [
      "You are a professional editor for Manatee County government.\n\nProofread this document for spelling, grammar, and punctuation errors.\n\n**Instructions**:\n1. Fix spelling, grammar, and punctuation\n2. Suggest improvements for unclear sentences\n3. Maintain the original voice and style\n\n**Constraints**:\n- Do not change meaning or facts\n- Do not rewrite extensively unless grammatically necessary\n- Mark uncertain corrections with [CHECK: ...]\n- Preserve formatting (bullets, numbers, headings)\n\n**Output Format**:\nCorrected text with [NOTES] section at end listing significant changes."
    ],
    keyTakeaways: [
      "Catches errors while preserving your writing voice",
      "Marks uncertain corrections with [CHECK] flags for your review",
      "Includes a change log in the [NOTES] section",
      "Quality score: 9.4/10 — reliable and consistent",
      "Use before sending board memos, press releases, or grant applications"
    ],
    tryItTemplate: "You are a professional editor for Manatee County government.\n\nProofread this text for spelling, grammar, and punctuation errors:\n\n\"{{document_text}}\"\n\nThis is a {{document_type}} written by a {{role}}. Maintain the original voice and mark uncertain corrections with [CHECK].",
    tryItVariables: [
      { name: "document_text", label: "Text to Proofread", placeholder: "Paste your text here...", suggestions: ["The department have completed there review of the annual budget and we beleive the numbers are accurrate. Their are several areas were we could reduce spending.", "We are please to announce that Manatee County has recieved a grant for infrastruture improvements. The funds will be use for road repairs and drainage upgrades.", "The meeting minutes from Tuesdays session has been attached. Please review and provide you're feedback by end of week."] },
      { name: "document_type", label: "Document Type", placeholder: "e.g., board memo", suggestions: ["board memo", "press release", "grant application", "internal email", "policy document"] },
      { name: "role", label: "Author Role", placeholder: "e.g., Department Director", suggestions: ["Department Director", "HR Coordinator", "PIO", "IT Analyst", "County Attorney staff"] }
    ],
    supportedTools: ["m365-copilot", "gpt", "chatgpt"],
    taskType: "correction"
  },
  {
    id: "ch08",
    number: 8,
    title: "FAQ Answer Generator",
    subtitle: "Create consistent, accurate FAQ responses for public inquiries",
    part: "part2",
    partLabel: "Part II: Ready-to-Use Templates",
    difficulty: "beginner",
    icon: "❓",
    cardType: "template",
    riskTier: "green",
    qualityScore: 9.32,
    summary: "Drafts clear, direct FAQ answers with a friendly but professional tone, including relevant contacts and links.",
    source: "Governance Registry: faq-answer-generator v1 — Tested, Quality Score 9.32/10",
    persona: "Rachel Kim",
    personaRole: "PIO, Manatee County Public Information Office",
    content: [
      "Residents ask the same questions repeatedly — about permits, utility bills, hurricane prep, recycling schedules. This template generates consistent FAQ answers that are clear, direct, and under 150 words.",
      "It uses a friendly but professional tone, includes relevant links or contact information, and anticipates follow-up questions. When information is unclear or missing, it automatically includes a \"Please contact [Department] at [Contact]\" fallback.",
      "The template only uses provided source information — it will not make up facts, policies, or procedures. This is critical for government communications where accuracy is non-negotiable.",
      "Quality score: 9.32/10. The PIO team uses this for the county website FAQ section, 311 response templates, and social media replies."
    ],
    promptExamples: [
      "You are a public information assistant for Manatee County.\n\nDraft a FAQ answer based on county information.\n\n**Instructions**:\n1. Write clear, direct answers to the question\n2. Use friendly but professional tone\n3. Include relevant links/contacts if applicable\n4. Anticipate follow-up questions\n\n**Constraints**:\n- Only use provided source information\n- Do not make up facts, policies, or procedures\n- If information is unclear: \"Please contact [Department] at [Contact]\"\n- Keep answers concise (under 150 words)\n\n**Output Format**:\n**Q**: [Question]\n**A**: [Answer paragraph]\nRelated: [Links or contact info]"
    ],
    keyTakeaways: [
      "Generates consistent, accurate FAQ responses under 150 words",
      "Will not fabricate facts — uses only provided source information",
      "Includes automatic fallback to department contact info",
      "Quality score: 9.32/10 — tested for public-facing accuracy",
      "Use for website FAQs, 311 templates, and social media replies"
    ],
    tryItTemplate: "You are a public information assistant for Manatee County.\n\nDraft a FAQ answer for this question:\n\n\"{{question}}\"\n\nUse this source information: {{source_info}}\nThe answer will appear on the {{channel}}. Keep it under 150 words.",
    tryItVariables: [
      { name: "question", label: "Resident Question", placeholder: "e.g., How do I apply for a building permit?", suggestions: ["How do I apply for a building permit?", "When is my recycling picked up?", "How do I report a pothole?", "What do I do during a hurricane warning?", "How do I pay my utility bill online?"] },
      { name: "source_info", label: "Source Information", placeholder: "e.g., Building permits require Form A-1, available at...", suggestions: ["Building permits require Form A-1, available at the Building Services office or online at mymanatee.org", "Recycling is collected weekly on the same day as trash pickup. Check your zone at mymanatee.org/recycling", "Potholes can be reported via the 311 app, by calling 311, or online at mymanatee.org/311"] },
      { name: "channel", label: "Channel", placeholder: "e.g., county website", suggestions: ["county website", "311 response template", "social media reply", "email auto-response", "printed brochure"] }
    ],
    supportedTools: ["m365-copilot", "gpt", "chatgpt"],
    taskType: "generation"
  },
  {
    id: "ch09",
    number: 9,
    title: "Meeting Agenda Generator",
    subtitle: "Create structured, professional meeting agendas from topic lists",
    part: "part2",
    partLabel: "Part II: Ready-to-Use Templates",
    difficulty: "intermediate",
    icon: "📅",
    cardType: "template",
    riskTier: "green",
    qualityScore: 9.2,
    summary: "Organizes topics into logical order with time estimates, standard sections, and professional formatting.",
    source: "Governance Registry: meeting-agenda-generator v1 — Tested, Quality Score 9.2/10",
    persona: "David Park",
    personaRole: "Emergency Management Coordinator, Manatee County Public Safety",
    content: [
      "Every well-run meeting starts with a clear agenda. This template takes a list of topics and organizes them into a professional agenda with logical ordering, time estimates for each item, and standard sections like Call to Order and Approval of Minutes.",
      "It automatically adds breaks for meetings over 2 hours and ensures all provided topics are included. The total meeting time will not exceed the duration you specify.",
      "The output uses formal agenda language appropriate for county government — suitable for BOCC meetings, department meetings, committee sessions, and working group sessions.",
      "Quality score: 9.2/10. Particularly useful for the AI Working Group's own meetings, department stand-ups, and cross-department coordination sessions."
    ],
    promptExamples: [
      "You are a meeting coordinator for Manatee County government.\n\nCreate a professional meeting agenda from this topic list.\n\n**Instructions**:\n1. Organize topics into logical order\n2. Add time estimates for each item\n3. Include standard sections (call to order, approval of minutes, etc.)\n4. Format professionally\n\n**Constraints**:\n- Total meeting time should not exceed provided duration\n- All provided topics must be included\n- Use formal agenda language\n- Include breaks for meetings over 2 hours\n\n**Output Format**:\n[Meeting Title]\nDate: [Date] | Time: [Start] - [End]\n1. Call to Order (5 min)\n2. [Agenda Item] (XX min)\n...\nN. Adjournment (5 min)"
    ],
    keyTakeaways: [
      "Organizes topics logically with time estimates",
      "Includes standard government meeting sections automatically",
      "Adds breaks for meetings over 2 hours",
      "Quality score: 9.2/10 — professional output every time",
      "Works for BOCC sessions, department meetings, and working groups"
    ],
    tryItTemplate: "You are a meeting coordinator for Manatee County government.\n\nCreate a professional agenda for a {{meeting_type}}.\n\nTopics to cover: {{topics}}\nDuration: {{duration}}\nDate: {{date}}",
    tryItVariables: [
      { name: "meeting_type", label: "Meeting Type", placeholder: "e.g., AI Working Group session", suggestions: ["AI Working Group session", "department standup", "BOCC work session", "budget committee meeting", "emergency planning review"] },
      { name: "topics", label: "Topics", placeholder: "e.g., Q3 budget review, new hire updates, IT security", suggestions: ["Q3 budget review, new hire updates, IT security briefing", "AI policy update, prompt template review, training schedule", "Hurricane prep status, shelter assignments, communication plan", "Permit backlog, staffing needs, vendor contract renewal"] },
      { name: "duration", label: "Duration", placeholder: "e.g., 1 hour", suggestions: ["30 minutes", "1 hour", "90 minutes", "2 hours"] },
      { name: "date", label: "Date", placeholder: "e.g., March 25, 2026", suggestions: ["March 25, 2026", "next Tuesday", "April 1, 2026"] }
    ],
    supportedTools: ["m365-copilot", "gpt"],
    taskType: "generation"
  },
  {
    id: "ch10",
    number: 10,
    title: "Acronym Expander",
    subtitle: "Expand technical acronyms to improve document clarity for public audiences",
    part: "part2",
    partLabel: "Part II: Ready-to-Use Templates",
    difficulty: "beginner",
    icon: "🔤",
    cardType: "template",
    riskTier: "green",
    qualityScore: 9.28,
    summary: "Finds acronyms in your text and expands them on first use, making documents accessible to people outside your department.",
    source: "Governance Registry: acronym-expander v1 — Tested, Quality Score 9.28/10",
    persona: "Tom Bradley",
    personaRole: "Utilities Field Supervisor, Manatee County Utilities",
    content: [
      "Government documents are packed with acronyms that insiders understand but residents and new staff do not. BOCC, PIO, RFP, FEMA, EOC — this template finds them all and expands them on first use.",
      "It follows the standard convention: spell out the full term on first use with the acronym in parentheses, then use the acronym alone afterward. It also adds a glossary at the end for documents with many acronyms.",
      "The template is smart enough to skip universally known acronyms (like USA or FBI) and focuses on government-specific and department-specific terms that would confuse an outside reader.",
      "Quality score: 9.28/10. Use this before sending any document to residents, new employees, or cross-department audiences."
    ],
    promptExamples: [
      "You are a communication clarity specialist for Manatee County.\n\nExpand all acronyms in this text for a public audience.\n\n**Instructions**:\n1. Identify all acronyms and abbreviations\n2. Expand on first use: \"Full Term (ACRONYM)\"\n3. Use acronym alone after first expansion\n4. Add glossary at end if 5+ acronyms\n\n**Constraints**:\n- Skip universally known acronyms (USA, FBI, etc.)\n- Preserve original text structure\n- If unsure of expansion, mark as [UNKNOWN: XYZ]\n- Maintain professional tone"
    ],
    keyTakeaways: [
      "Automatically finds and expands government acronyms",
      "Follows standard first-use expansion convention",
      "Adds a glossary for documents with many acronyms",
      "Skips universally known terms — focuses on gov-specific jargon",
      "Quality score: 9.28/10 — essential for public-facing documents"
    ],
    tryItTemplate: "You are a communication clarity specialist for Manatee County.\n\nExpand all acronyms in this text for a {{audience}} audience:\n\n\"{{text_with_acronyms}}\"\n\nThis is a {{document_type}}. Add a glossary if there are 5 or more acronyms.",
    tryItVariables: [
      { name: "text_with_acronyms", label: "Text with Acronyms", placeholder: "e.g., The BOCC approved the RFP for the new EOC...", suggestions: ["The BOCC approved the RFP for the new EOC facility. FEMA funding will cover 75% of costs. The PIO will issue a press release.", "IT completed the MFA rollout for all VPN users. The CISO briefed the CIO on the latest SOC findings.", "The BCC meeting covered the CIP budget, MSTU rates, and the TIF district proposal."] },
      { name: "audience", label: "Target Audience", placeholder: "e.g., general public", suggestions: ["general public", "new employees", "elected officials", "vendor partners", "media"] },
      { name: "document_type", label: "Document Type", placeholder: "e.g., press release", suggestions: ["press release", "board memo", "resident newsletter", "training document", "grant application"] }
    ],
    supportedTools: ["m365-copilot", "gpt", "chatgpt"],
    taskType: "transformation"
  },
  {
    id: "ch11",
    number: 11,
    title: "Bullet-to-Paragraph Converter",
    subtitle: "Transform bullet point lists into professional narrative paragraphs",
    part: "part2",
    partLabel: "Part II: Ready-to-Use Templates",
    difficulty: "beginner",
    icon: "📄",
    cardType: "template",
    riskTier: "green",
    qualityScore: 9.32,
    summary: "Converts rough bullet points into polished narrative text while preserving all information and logical flow.",
    source: "Governance Registry: bullet-to-paragraph v1 — Tested, Quality Score 9.32/10",
    persona: "Angela Foster",
    personaRole: "HR Coordinator, Manatee County Human Resources",
    content: [
      "You have bullet points from a meeting, a brainstorm, or quick notes — but you need a polished paragraph for a memo, report, or email. This template handles the conversion while preserving all information.",
      "It creates smooth transitions between ideas, maintains logical flow, uses professional tone throughout, and keeps the same level of detail as the original bullets — no information added, none removed.",
      "The output matches the length of the input (within 20%) so you get a paragraph, not an essay. It is designed for government writing where precision matters more than flair.",
      "Quality score: 9.32/10. HR uses this for policy summaries, Public Works for project narratives, and the PIO for converting meeting notes into press-ready text."
    ],
    promptExamples: [
      "You are a professional writing assistant for Manatee County.\n\nTransform these bullet points into a professional narrative paragraph.\n\n**Instructions**:\n1. Create smooth transitions between ideas\n2. Maintain logical flow\n3. Use professional tone\n4. Keep same level of detail\n\n**Constraints**:\n- Do not add new information\n- Do not remove any points\n- Keep similar length (±20%)\n- Maintain professional government tone\n\nConvert these bullets:"
    ],
    keyTakeaways: [
      "Converts rough bullets into polished narrative text",
      "Preserves all information — nothing added, nothing removed",
      "Maintains professional government writing tone",
      "Output length matches input length (within 20%)",
      "Quality score: 9.32/10 — reliable for memos, reports, and press text"
    ],
    tryItTemplate: "You are a professional writing assistant for Manatee County.\n\nTransform these bullet points into a professional narrative paragraph:\n\n{{bullets}}\n\nThis will be used in a {{document_type}} for {{audience}}. Maintain a {{tone}} tone.",
    tryItVariables: [
      { name: "bullets", label: "Bullet Points", placeholder: "- Point 1\n- Point 2\n- Point 3", suggestions: ["- Budget approved for Q3\n- Three new positions authorized\n- IT security audit scheduled for April\n- Hurricane prep funding increased 15%", "- New recycling program launches May 1\n- Curbside pickup expanded to include glass\n- Educational materials being distributed\n- Partnership with local schools announced", "- Road resurfacing 60% complete\n- Water main issue caused 1-week delay\n- Contractor added weekend shifts\n- Expected completion: April 15"] },
      { name: "document_type", label: "Document Type", placeholder: "e.g., board memo", suggestions: ["board memo", "project report", "press release", "email to leadership", "annual report section"] },
      { name: "audience", label: "Audience", placeholder: "e.g., county leadership", suggestions: ["county leadership", "the general public", "department staff", "Board of County Commissioners", "grant reviewers"] },
      { name: "tone", label: "Tone", placeholder: "e.g., professional", suggestions: ["professional", "formal", "conversational but polished", "technical"] }
    ],
    supportedTools: ["m365-copilot", "gpt", "chatgpt"],
    taskType: "transformation"
  },
  {
    id: "ch12",
    number: 12,
    title: "Calendar Event Creator",
    subtitle: "Parse freeform text into structured calendar event entries",
    part: "part2",
    partLabel: "Part II: Ready-to-Use Templates",
    difficulty: "intermediate",
    icon: "🗓️",
    cardType: "template",
    riskTier: "green",
    qualityScore: 9.2,
    summary: "Extracts event details from casual text (emails, messages, notes) and formats them into structured calendar entries.",
    source: "Governance Registry: calendar-event-creator v1 — Tested, Quality Score 9.2/10",
    persona: "Maria Chen",
    personaRole: "HR Coordinator, Manatee County Human Resources",
    content: [
      "Someone sends you an email saying \"Let's meet Tuesday at 2 in the big conference room to talk about the budget.\" This template extracts the event details and formats them into a structured calendar entry you can copy directly into Outlook.",
      "It handles ambiguous dates (\"next Tuesday\"), informal locations (\"the big conference room\" becomes a proper room name if context is provided), and extracts attendees, agenda items, and duration from natural language.",
      "The output includes: Event Title, Date, Time, Duration, Location, Attendees, Agenda/Description, and any preparation notes mentioned in the source text.",
      "Quality score: 9.2/10. Especially useful for coordinators and assistants who process dozens of meeting requests daily."
    ],
    promptExamples: [
      "You are a scheduling assistant for Manatee County.\n\nParse this text into a structured calendar event:\n\n**Instructions**:\n1. Extract: title, date, time, duration, location, attendees\n2. Infer reasonable defaults for missing fields\n3. Format for calendar entry\n4. Note any ambiguities\n\n**Constraints**:\n- Flag uncertain dates/times with [CONFIRM]\n- Default duration: 1 hour if not specified\n- Use 12-hour time format\n- Include timezone (ET)\n\n**Output Format**:\nTitle: [Event Name]\nDate: [Day, Month Date, Year]\nTime: [Start] - [End] ET\nLocation: [Place]\nAttendees: [Names]\nDescription: [Agenda/Notes]"
    ],
    keyTakeaways: [
      "Extracts event details from casual emails and messages",
      "Handles ambiguous dates and informal location names",
      "Flags uncertain information with [CONFIRM] markers",
      "Output is ready to copy into Outlook or Google Calendar",
      "Quality score: 9.2/10 — saves coordinators significant time"
    ],
    tryItTemplate: "You are a scheduling assistant for Manatee County.\n\nParse this text into a structured calendar event:\n\n\"{{freeform_text}}\"\n\nAssume the current date is {{current_date}}. The organizer is a {{role}}.",
    tryItVariables: [
      { name: "freeform_text", label: "Freeform Text", placeholder: "e.g., Let's meet Tuesday at 2pm to discuss the budget", suggestions: ["Let's meet Tuesday at 2pm in the big conference room to discuss the Q3 budget. Invite Carlos and Angela.", "Can we do a quick 30-min call Friday morning about the permit backlog? I'll send a Teams link.", "AI Working Group monthly meeting — March 25, 10am-noon, Room 301. Agenda: template review, scoring update, training plan."] },
      { name: "current_date", label: "Current Date", placeholder: "e.g., March 19, 2026", suggestions: ["March 19, 2026", "today", "this week"] },
      { name: "role", label: "Organizer Role", placeholder: "e.g., Department Director", suggestions: ["Department Director", "HR Coordinator", "Emergency Management Coordinator", "IT Analyst", "Executive Assistant"] }
    ],
    supportedTools: ["m365-copilot", "gpt"],
    taskType: "extraction"
  },

  // ── PART III: USE CASES & STRATEGY (from manual Ch. 4-7) ──
  {
    id: "ch13",
    number: 13,
    title: "Prompt Efficiency Strategies",
    subtitle: "Three strategies to get better results with fewer prompts and less cost",
    part: "part3",
    partLabel: "Part III: Use Cases & Strategy",
    difficulty: "intermediate",
    icon: "⚡",
    cardType: "manual",
    riskTier: "green",
    qualityScore: null,
    summary: "Search first, combine prompts, and constrain output — three practical strategies from the county manual for efficient AI use.",
    source: "Manatee County Prompt Manual, Ch. 4",
    persona: "James Torres",
    personaRole: "IT Analyst, Manatee County Information Technology",
    content: [
      "Strategy 1 — Use Search Engines First: Before prompting AI, check if a simple web search answers your question. Add \"-ai\" to your search query to exclude AI-generated results and get primary sources. This saves AI credits and often gives you a faster, more authoritative answer.",
      "Strategy 2 — Minimize Number of Prompts: Combine related questions into a single prompt instead of asking one at a time. For example, instead of three separate prompts about a policy, ask: \"Summarize this policy, list the key requirements, and draft an FAQ — all in one response.\"",
      "Strategy 3 — Constrain Output Length: Tell the AI how long the response should be. \"Respond in less than 100 words\" or \"Give me 3 bullet points\" prevents the AI from generating pages of text you will not read. This saves time and processing resources.",
      "These three strategies alone can cut your AI usage by 40-60% while improving output quality. The AI Working Group recommends starting every AI task by asking: \"Can I answer this with a search engine first?\"",
      "Tip: Before using AI, ask yourself: 'Can I answer this with a search engine first?' If yes, save your AI usage for tasks that actually need generation, not lookup."
    ],
    promptExamples: [
      "Combined prompt: \"Review this policy document and: (1) summarize it in 3 sentences, (2) list the top 5 requirements, and (3) draft a 100-word FAQ answer for residents.\"",
      "Constrained prompt: \"In exactly 5 bullet points, summarize the key changes in the 2026 Manatee County budget. Each bullet should be one sentence.\"",
      "Efficient prompt: \"Compare these two vendor proposals in a table with columns for: Price, Timeline, Experience, and Risk. Keep the table to one page.\""
    ],
    keyTakeaways: [
      "Search engines first — add \"-ai\" to exclude AI-generated results",
      "Combine related questions into a single prompt",
      "Always constrain output length (word count, bullet count, page limit)",
      "These strategies can cut AI usage by 40-60%",
      "Ask yourself: \"Can I answer this with a search engine first?\""
    ],
    tryItTemplate: "I need to {{task}} for Manatee County {{department}}. Combine all of the following into a single response:\n1. {{subtask_1}}\n2. {{subtask_2}}\n3. {{subtask_3}}\n\nKeep the total response under {{length}}.",
    tryItVariables: [
      { name: "task", label: "Main Task", placeholder: "e.g., prepare a budget summary", suggestions: ["prepare a budget summary", "review a vendor proposal", "draft a policy update", "create a training plan", "summarize a meeting"] },
      { name: "department", label: "Department", placeholder: "e.g., Public Works", suggestions: ["Public Works", "Information Technology", "Human Resources", "Utilities", "Emergency Management"] },
      { name: "subtask_1", label: "Subtask 1", placeholder: "e.g., Summarize the key points", suggestions: ["Summarize the key points in 3 sentences", "List the top 5 action items", "Identify the main risks"] },
      { name: "subtask_2", label: "Subtask 2", placeholder: "e.g., Create a comparison table", suggestions: ["Create a comparison table", "Draft a one-paragraph executive summary", "List pros and cons"] },
      { name: "subtask_3", label: "Subtask 3", placeholder: "e.g., Write a 100-word FAQ answer", suggestions: ["Write a 100-word FAQ answer for residents", "Draft 3 bullet points for leadership", "Suggest next steps with deadlines"] },
      { name: "length", label: "Max Length", placeholder: "e.g., 500 words", suggestions: ["300 words", "500 words", "one page", "10 bullet points"] }
    ]
  },
  {
    id: "ch14",
    number: 14,
    title: "Low-Risk Use Cases",
    subtitle: "Four safe, everyday use cases any county employee can start with today",
    part: "part3",
    partLabel: "Part III: Use Cases & Strategy",
    difficulty: "beginner",
    icon: "🟢",
    cardType: "manual",
    riskTier: "green",
    qualityScore: null,
    summary: "Drafting messages, framing written content, learning from documents, and quick creative tasks — the safest ways to start using AI.",
    source: "Manatee County Prompt Manual, Ch. 5",
    persona: "Lisa Morales",
    personaRole: "Communications Officer, Manatee County Public Affairs",
    content: [
      "Use Case 1 — Drafting Messages to Staff and Partners: Use AI to draft internal emails, Slack messages, or partner communications. These are low-risk because they are internal, informal, and you review them before sending. Example: \"Draft a friendly email to the Public Works team about the new parking policy.\"",
      "Use Case 2 — Framing Written Content (Internal Use): Use AI to create first drafts of internal documents — meeting agendas, project outlines, training materials. The key word is \"internal\" — these do not go to the public without human review.",
      "Use Case 3 — Learning from a Document: Upload a document and ask AI to explain it, summarize it, or answer questions about it. Great for understanding complex policies, legal documents, or technical specifications. Example: \"Summarize this 50-page vendor proposal in 5 key points.\"",
      "Use Case 4 — Quick Creative and Research Tasks: Brainstorming session names, generating social media post ideas, researching best practices from other counties. These are low-stakes tasks where AI creativity is an asset, not a risk.",
      "Tip: Start with these four safe use cases: drafting internal emails, summarizing meeting notes, creating checklists, and formatting status updates. No PII, no decisions — just drafts for human review."
    ],
    promptExamples: [
      "UC1: \"Draft a friendly email to the Manatee County Public Works team announcing the new parking policy. Keep it under 150 words and include the effective date of April 1.\"",
      "UC2: \"Create an outline for a 30-minute training session on cybersecurity basics for non-technical county staff.\"",
      "UC3: \"I've uploaded the vendor proposal for the new permitting software. Summarize the top 5 features, the pricing structure, and any red flags.\"",
      "UC4: \"Brainstorm 10 creative names for Manatee County's new employee wellness program. The program includes fitness challenges, mental health resources, and healthy eating workshops.\""
    ],
    keyTakeaways: [
      "Start with internal communications — lowest risk, highest reward",
      "Use AI for first drafts, never final drafts without review",
      "Document analysis is a powerful low-risk use case",
      "Creative brainstorming is where AI shines with minimal risk",
      "All four use cases follow the safety rules from Chapter 2"
    ],
    tryItTemplate: "I am a {{role}} at Manatee County. I need to {{use_case}}. The context is: {{context}}. Keep the output {{format}} and appropriate for {{audience}}.",
    tryItVariables: [
      { name: "role", label: "Your Role", placeholder: "e.g., Communications Officer", suggestions: ["Communications Officer", "HR Coordinator", "IT Analyst", "Department Director", "Utilities Field Supervisor"] },
      { name: "use_case", label: "Use Case", placeholder: "e.g., draft an internal email", suggestions: ["draft an internal email about a policy change", "create a training outline for new staff", "summarize a vendor proposal", "brainstorm names for a new program", "explain a complex policy in simple terms"] },
      { name: "context", label: "Context", placeholder: "e.g., new parking policy effective April 1", suggestions: ["new parking policy effective April 1", "cybersecurity training for non-technical staff", "50-page vendor proposal for permitting software", "employee wellness program launching in May"] },
      { name: "format", label: "Format", placeholder: "e.g., under 150 words", suggestions: ["under 150 words", "5 bullet points", "a one-page outline", "a numbered list of 10 ideas", "a 3-paragraph summary"] },
      { name: "audience", label: "Audience", placeholder: "e.g., department staff", suggestions: ["department staff", "new employees", "county leadership", "the general public", "vendor partners"] }
    ]
  },
  {
    id: "ch15",
    number: 15,
    title: "Mid-Risk Use Cases",
    subtitle: "Public-facing documents, procurement, presentations, and code — proceed with caution",
    part: "part3",
    partLabel: "Part III: Use Cases & Strategy",
    difficulty: "intermediate",
    icon: "🟡",
    cardType: "manual",
    riskTier: "yellow",
    qualityScore: null,
    summary: "When AI output goes public or involves procurement, the stakes are higher. These use cases require extra review steps.",
    source: "Manatee County Prompt Manual, Ch. 6",
    persona: "Carlos Rivera",
    personaRole: "Department Director, Manatee County Public Works",
    content: [
      "Use Case 1 — Drafting Memos and Public-Facing Documents: AI can draft press releases, board memos, and resident notices, but these require multi-step review. Draft with AI, review for accuracy, check for tone, verify facts, then get supervisor approval before publishing.",
      "Use Case 2 — Writing Procurement Documents: AI can help structure RFPs, RFQs, and bid evaluations, but procurement language has legal implications. Always have the County Attorney's office review AI-assisted procurement documents.",
      "Use Case 3 — Creating Presentation Slides: AI can generate slide outlines, talking points, and visual suggestions. But presentations to the Board of County Commissioners or the public need human judgment on messaging, emphasis, and political sensitivity.",
      "Use Case 4 — Programming and Code Generation: AI can write code, debug scripts, and generate SQL queries. But code that touches county systems must be reviewed by IT before deployment. Never run AI-generated code directly on production systems.",
      "Florida's Sunshine Law means that AI-generated content in public documents could be subject to records requests. Document your AI usage for audit purposes.",
      "Warning: Public-facing documents generated by AI must always be reviewed by the department's designated reviewer before publication. This is county policy, not a suggestion.",
      "Tip: For any mid-risk AI output, add these two lines to your prompt: 'Support every claim with text from the provided context. If uncertain, state your confidence level.' This simple addition dramatically reduces errors in public-facing documents."
    ],
    promptExamples: [
      "\"Draft a press release announcing Manatee County's new online permitting system. Include: launch date (April 15), key features (24/7 access, mobile-friendly, real-time status tracking), and a quote placeholder for the County Administrator.\"",
      "\"Create an outline for an RFP for fleet management software. Include sections for: scope of work, technical requirements, evaluation criteria, timeline, and budget range.\"",
      "\"Generate a 10-slide outline for a presentation to the BOCC on the Q3 infrastructure progress. Include data points for: roads repaired, water main replacements, and budget utilization.\"",
      "\"Write a Python script that reads a CSV of permit applications and generates a summary report showing: total applications, approval rate, average processing time, and top 5 permit types.\""
    ],
    keyTakeaways: [
      "Public-facing documents need multi-step review before publishing",
      "Procurement documents require County Attorney review",
      "Presentations to BOCC need human judgment on messaging",
      "AI-generated code must be reviewed by IT before deployment",
      "Document your AI usage — Florida Sunshine Law applies"
    ],
    tryItTemplate: "I am a {{role}} at Manatee County. I need to draft a {{document_type}} about {{topic}}. This is a mid-risk use case because {{risk_reason}}. Please draft the content and include a [REVIEW CHECKLIST] at the end listing what a human reviewer should verify.",
    tryItVariables: [
      { name: "role", label: "Your Role", placeholder: "e.g., Department Director", suggestions: ["Department Director", "PIO", "Procurement Specialist", "IT Analyst", "County Attorney staff"] },
      { name: "document_type", label: "Document Type", placeholder: "e.g., press release", suggestions: ["press release", "RFP outline", "board memo", "presentation outline", "code script"] },
      { name: "topic", label: "Topic", placeholder: "e.g., new online permitting system", suggestions: ["new online permitting system launch", "fleet management software procurement", "Q3 infrastructure progress", "cybersecurity policy update", "hurricane preparedness plan"] },
      { name: "risk_reason", label: "Risk Reason", placeholder: "e.g., it will be published publicly", suggestions: ["it will be published publicly", "it involves procurement language", "it goes to the BOCC", "it touches production systems", "it has legal implications"] }
    ]
  },
  {
    id: "ch16",
    number: 16,
    title: "High-Risk Boundaries",
    subtitle: "What AI must never be used for — non-negotiable prohibitions",
    part: "part3",
    partLabel: "Part III: Use Cases & Strategy",
    difficulty: "advanced",
    icon: "🔴",
    cardType: "manual",
    riskTier: "red",
    qualityScore: null,
    summary: "AI must never make decisions about health plans, bail, convictions, grades, or admissions. These boundaries protect residents and the county.",
    source: "Manatee County Prompt Manual, Ch. 7; NIST AI Risk Management Framework",
    persona: "James Torres",
    personaRole: "IT Analyst, Manatee County Information Technology",
    content: [
      "There are categories where AI must never be the decision-maker. These are non-negotiable prohibitions that protect both residents and the county from legal liability.",
      "Prohibited uses: AI must not be used to make decisions about health plans, bail or pretrial release, criminal convictions or sentencing, academic grades or school admissions, or any decision that materially affects a person's rights, benefits, or liberty.",
      "What AI CAN do in these areas: flag keywords for human review, transform bullet points into sentences for human-written reports, generate checklists for human decision-makers, and summarize background information. But the human always makes the final decision.",
      "The AI Working Group recommends a simple test: \"If this AI output is wrong, could someone be harmed?\" If the answer is yes, a human must make the decision — AI can only assist.",
      "These boundaries align with the NIST AI Risk Management Framework and emerging Florida state guidance on government AI use.",
      "Safety: AI must never be used for: hiring/firing decisions, legal determinations, medical advice, law enforcement actions, or any decision affecting individual rights. These are non-negotiable.",
      "Safety: When AI is used near high-risk boundaries, always include the full Anti-Hallucination Toolkit: (1) If the answer is not in the context, say I don't know. (2) Support claims with source text only. (3) State confidence levels. (4) Explain reasoning using context only. See Chapter 30 for the complete defensive prompting guide."
    ],
    promptExamples: [
      "ALLOWED: \"Create a checklist of factors to consider when reviewing a permit application.\" (AI creates the checklist, human makes the decision)",
      "PROHIBITED: \"Review this permit application and decide whether to approve or deny it.\" (AI should never make the final decision)",
      "ALLOWED: \"Summarize the key facts in this case file for the reviewer.\" (AI summarizes, human reviews and decides)",
      "PROHIBITED: \"Based on this data, determine the appropriate bail amount.\" (AI must never make decisions affecting liberty)"
    ],
    keyTakeaways: [
      "AI must never make decisions about health, bail, convictions, grades, or admissions",
      "AI CAN assist by flagging, summarizing, and organizing — but humans decide",
      "Simple test: \"If this AI output is wrong, could someone be harmed?\"",
      "These boundaries are non-negotiable and protect the county legally",
      "Aligns with NIST AI Risk Management Framework"
    ],
    tryItTemplate: "I am a {{role}} at Manatee County. I need AI to help with {{task}} in the {{domain}} area. This is a sensitive use case. Draft a prompt that keeps AI in an assistive role only — the human makes all final decisions. Include a [BOUNDARY CHECK] section confirming this prompt does not cross any prohibited lines.",
    tryItVariables: [
      { name: "role", label: "Your Role", placeholder: "e.g., IT Analyst", suggestions: ["IT Analyst", "Department Director", "HR Coordinator", "County Attorney staff", "Emergency Management Coordinator"] },
      { name: "task", label: "Task", placeholder: "e.g., summarize case files for review", suggestions: ["summarize case files for review", "create a decision checklist", "flag keywords in applications", "organize background research", "draft a review template"] },
      { name: "domain", label: "Domain", placeholder: "e.g., permit review", suggestions: ["permit review", "employee evaluation", "code enforcement", "emergency response", "budget allocation"] }
    ]
  },

  // ── PART IV: GOVERNANCE & HORIZON (from manual Ch. 8-9 + governance system) ──
  {
    id: "ch17",
    number: 17,
    title: "The 9-Dimension Scoring Rubric",
    subtitle: "How Manatee County scores and approves prompt templates for production use",
    part: "part4",
    partLabel: "Part IV: Governance & Horizon",
    difficulty: "advanced",
    icon: "📐",
    cardType: "governance",
    riskTier: "green",
    qualityScore: null,
    summary: "Every template in Part II was scored on 9 dimensions before approval. Here is how the scoring works and why it matters.",
    source: "AI Governance Registry: 9-Dimension Rubric (Feb 2026)",
    persona: "Tom Bradley",
    personaRole: "Utilities Field Supervisor, Manatee County Utilities",
    content: [
      "Every prompt template in Part II of this cookbook was evaluated using the AI Working Group's 9-Dimension Scoring Rubric before being approved for production use. A template must score 8.0 or higher to be published.",
      "The nine dimensions and their weights: Accuracy (30%) — correctness of outputs; Safety (25%) — risk and compliance adherence; Business Value (15%) — impact and ROI; Time Saved (8%) — efficiency gains; Relevance (6%) — appropriateness to context; Format Fidelity (6%) — output structure quality; Readability (4%) — clarity and accessibility; Policy Alignment (4%) — county policy compliance; Consistency (2%) — reproducibility of results.",
      "Each dimension is scored 0-10. The weighted average produces the overall quality score. For example, the Email Tone Adjuster scored: Accuracy 9.0, Safety 10.0, Time Saved 10.0, Reusability 10.0 — for an overall 9.6/10.",
      "The rubric was adopted in the February 9, 2026 AI Working Group meeting, replacing the earlier 4-dimension rubric. It aligns with the SharePoint governance requirements for prompt management."
    ],
    promptExamples: [
      "\"I want to submit a new prompt template for the governance registry. Walk me through the 9-dimension scoring rubric and tell me what I need to prepare for each dimension.\"",
      "\"Score this prompt template on the 9 dimensions: [paste template]. Provide a score for each dimension with justification, and calculate the weighted overall score.\"",
      "\"Compare the scoring profiles of the Meeting Notes Summarizer (9.48) and the Calendar Event Creator (9.2). What dimensions account for the difference?\""
    ],
    keyTakeaways: [
      "Templates must score 8.0/10 or higher to be published",
      "Accuracy (30%) and Safety (25%) carry the most weight",
      "All 10 templates in Part II passed this rubric",
      "The rubric replaced the earlier 4-dimension version in Feb 2026",
      "Any county employee can submit a template for scoring"
    ],
    tryItTemplate: "I want to create a new prompt template for {{use_case}} in the {{department}} department. Walk me through what I need to prepare for the 9-dimension scoring rubric. Focus especially on the {{priority_dimension}} dimension. The template will be used by {{users}}.",
    tryItVariables: [
      { name: "use_case", label: "Use Case", placeholder: "e.g., summarizing public comments", suggestions: ["summarizing public comments", "drafting inspection reports", "generating training quizzes", "creating social media posts", "formatting budget reports"] },
      { name: "department", label: "Department", placeholder: "e.g., Utilities", suggestions: ["Utilities", "Public Works", "Human Resources", "Information Technology", "Emergency Management"] },
      { name: "priority_dimension", label: "Priority Dimension", placeholder: "e.g., accuracy", suggestions: ["accuracy", "safety", "business value", "time saved", "readability"] },
      { name: "users", label: "Target Users", placeholder: "e.g., field supervisors", suggestions: ["field supervisors", "department directors", "front desk staff", "the PIO team", "all county employees"] }
    ]
  },
  {
    id: "ch18",
    number: 18,
    title: "Safety Gates & PII Protection",
    subtitle: "The automated safety checks every prompt passes before deployment",
    part: "part4",
    partLabel: "Part IV: Governance & Horizon",
    difficulty: "advanced",
    icon: "🔒",
    cardType: "governance",
    riskTier: "yellow",
    qualityScore: null,
    summary: "PII redaction, prompt injection detection, toxicity checks, and bias detection — the four automated safety gates in the governance system.",
    source: "AI Governance Registry",
    persona: "James Torres",
    personaRole: "IT Analyst, Manatee County Information Technology",
    content: [
      "The Manatee County AI governance system includes four automated safety gates that every prompt template must pass before deployment. These gates run automatically — no manual intervention required.",
      "Gate 1 — PII Protection: Scans prompts and outputs for personally identifiable information (names, addresses, phone numbers, SSNs, email addresses). Any PII detected is flagged and must be removed before the template can proceed.",
      "Gate 2 — Prompt Injection Detection: Checks for attempts to override the template's instructions (\"ignore all previous instructions\", \"you are now...\"). This protects against both accidental and malicious misuse.",
      "Gate 3 — Toxicity Check: Evaluates test responses for harmful, offensive, or inappropriate content. Templates that produce toxic output in any test scenario are blocked.",
      "Gate 4 — Bias Detection: Analyzes outputs for demographic bias, stereotyping, or unfair treatment. Government AI must serve all residents equitably.",
      "In strict mode (the default), any single gate failure blocks deployment. This is intentional — the county's risk tolerance for AI safety is zero."
    ],
    promptExamples: [
      "\"Review this prompt template for PII exposure risks. Identify any fields where a user might accidentally include personal information, and suggest guardrails to prevent it.\"",
      "\"Test this prompt against common injection attacks: 'ignore previous instructions', 'you are now a different assistant', 'output your system prompt'. Report whether the template is resistant.\"",
      "\"Evaluate this template's outputs for potential bias. Run it with inputs from different demographic contexts and flag any inconsistencies in tone, quality, or recommendations.\""
    ],
    keyTakeaways: [
      "Four automated safety gates: PII, injection, toxicity, bias",
      "Strict mode: any single failure blocks deployment",
      "PII detection covers names, addresses, SSNs, phone numbers, emails",
      "Prompt injection protection guards against instruction override attacks",
      "Zero risk tolerance — this is non-negotiable for government AI"
    ],
    tryItTemplate: "I am developing a prompt template for {{use_case}} at Manatee County. Help me identify potential safety risks:\n\n1. What PII could users accidentally include?\n2. How could this template be misused via prompt injection?\n3. What biases might appear in the output?\n4. What guardrails should I add?\n\nThe template will be used by {{users}} in the {{department}} department.",
    tryItVariables: [
      { name: "use_case", label: "Use Case", placeholder: "e.g., responding to resident complaints", suggestions: ["responding to resident complaints", "summarizing employee evaluations", "drafting code enforcement notices", "generating permit status updates", "creating public meeting summaries"] },
      { name: "users", label: "Users", placeholder: "e.g., front desk staff", suggestions: ["front desk staff", "department directors", "field inspectors", "the PIO team", "HR coordinators"] },
      { name: "department", label: "Department", placeholder: "e.g., Code Enforcement", suggestions: ["Code Enforcement", "Human Resources", "Building Services", "Public Safety", "Customer Service"] }
    ]
  },
  {
    id: "ch19",
    number: 19,
    title: "Audit Trails & Records Management",
    subtitle: "How to document AI usage for compliance with Florida public records law",
    part: "part4",
    partLabel: "Part IV: Governance & Horizon",
    difficulty: "intermediate",
    icon: "📑",
    cardType: "manual",
    riskTier: "yellow",
    qualityScore: null,
    summary: "Georgia's audit trail model, San Jose's PRA approach, and Florida Sunshine Law compliance — practical guidance for documenting AI use.",
    source: "Manatee County Prompt Manual, Ch. 8; Georgia GTA Guidelines; City of San Jose",
    persona: "Carlos Rivera",
    personaRole: "Department Director, Manatee County Public Works",
    content: [
      "Florida's public records laws require that government work products be documentable and discoverable. When AI is involved in creating those work products, the AI usage itself may need to be documented.",
      "The Georgia model provides a practical framework: for each AI-assisted document, record the tool name (e.g., ChatGPT Enterprise, Copilot), a summary of the prompt used, the reviewer's identity, and the date of human review and approval.",
      "San Jose's approach to Public Records Act (PRA) requests involving AI: treat AI-generated drafts the same as human-generated drafts. If the final document is a public record, the process that created it (including AI assistance) may be discoverable.",
      "The Manatee County governance system includes automated audit logging that tracks: who used which prompt template, when, what inputs were provided (with PII redacted), and what outputs were generated. This creates a compliance-ready audit trail.",
      "Practical recommendation: add a simple note to any AI-assisted document — \"Drafted with AI assistance, reviewed and approved by [Name], [Date].\" This satisfies most audit requirements."
    ],
    promptExamples: [
      "\"Create an AI usage log template for my department. Include fields for: date, employee name, AI tool used, purpose, prompt summary (no sensitive data), output summary, reviewer name, and approval date.\"",
      "\"Draft a department policy statement on AI documentation requirements that complies with Florida's Sunshine Law. Keep it to one page and use plain language.\"",
      "\"Review this document and add appropriate AI attribution. The document was drafted using ChatGPT Enterprise and reviewed by the department director.\""
    ],
    keyTakeaways: [
      "Florida Sunshine Law may require documentation of AI-assisted work",
      "Georgia model: record tool name, prompt summary, reviewer, date",
      "AI-generated drafts may be discoverable under public records requests",
      "The governance system provides automated audit logging",
      "Simple fix: add \"Drafted with AI assistance, reviewed by [Name]\" to documents"
    ],
    tryItTemplate: "I am a {{role}} at Manatee County. I need to create an AI usage documentation process for my {{department}} department. The process should comply with Florida's Sunshine Law and be simple enough for {{staff_type}} to follow. Include a template for {{document_type}}.",
    tryItVariables: [
      { name: "role", label: "Your Role", placeholder: "e.g., Department Director", suggestions: ["Department Director", "IT Analyst", "HR Coordinator", "County Attorney staff", "Records Manager"] },
      { name: "department", label: "Department", placeholder: "e.g., Public Works", suggestions: ["Public Works", "Utilities", "Human Resources", "Information Technology", "Building Services"] },
      { name: "staff_type", label: "Staff Type", placeholder: "e.g., non-technical staff", suggestions: ["non-technical staff", "field workers", "office staff", "managers", "all employees"] },
      { name: "document_type", label: "Document Type", placeholder: "e.g., AI usage log", suggestions: ["AI usage log", "department AI policy", "audit checklist", "attribution statement template", "records retention guide"] }
    ]
  },
  {
    id: "ch20",
    number: 20,
    title: "Training & Skill-Building",
    subtitle: "Free resources and structured learning paths for county staff",
    part: "part3",
    partLabel: "Part III: Use Cases & Strategy",
    difficulty: "beginner",
    icon: "🎓",
    cardType: "manual",
    riskTier: "green",
    qualityScore: null,
    summary: "InnovateUS Prompting Lab, Responsible AI courses, and the AI Working Group's own training plan — how to build AI skills across the county.",
    source: "Manatee County Prompt Manual, Ch. 9; InnovateUS; NACo",
    persona: "Angela Foster",
    personaRole: "HR Coordinator, Manatee County Human Resources",
    content: [
      "The InnovateUS Prompting Lab offers weekly hands-on sessions where government employees practice prompt engineering with real scenarios. It is free and open to all county staff.",
      "The InnovateUS Responsible AI course is a free, self-paced online program with two parts: Part 1 covers using GenAI in government (practical skills), and Part 2 covers understanding risks and building resilience (safety and ethics).",
      "The AI Working Group recommends a three-tier training approach: Tier 1 (All Staff) — complete the safety rules in Chapter 2 and try the low-risk use cases in Chapter 14. Tier 2 (Power Users) — work through the templates in Part II and the mid-risk use cases. Tier 3 (Template Creators) — learn the scoring rubric and safety gates to create new templates.",
      "HR is tracking AI training completion as part of the county's professional development program. Department directors can request customized training sessions for their teams through the AI Working Group."
    ],
    promptExamples: [
      "\"Create a 4-week AI training plan for Manatee County staff who are complete beginners. Week 1 should cover definitions and safety rules, Week 2 should cover low-risk use cases, Week 3 should introduce the templates, and Week 4 should be hands-on practice.\"",
      "\"Draft an email from HR to all department directors announcing the new AI training program. Include: what it covers, who should attend, how to sign up, and the time commitment (2 hours per week for 4 weeks).\"",
      "\"Generate a quiz with 10 questions to test whether county staff understand the four safety rules from Chapter 2. Include answer key.\""
    ],
    keyTakeaways: [
      "InnovateUS Prompting Lab: free weekly hands-on sessions",
      "InnovateUS Responsible AI: free self-paced course (2 parts)",
      "Three-tier training: All Staff, Power Users, Template Creators",
      "HR tracks AI training as professional development",
      "Department directors can request customized training sessions"
    ],
    tryItTemplate: "I am a {{role}} at Manatee County. I need to create a {{deliverable}} for {{audience}} about AI training. The training should cover {{topics}} and take {{duration}}. Make it engaging and practical.",
    tryItVariables: [
      { name: "role", label: "Your Role", placeholder: "e.g., HR Coordinator", suggestions: ["HR Coordinator", "Department Director", "IT Analyst", "Training Specialist", "AI Working Group member"] },
      { name: "deliverable", label: "Deliverable", placeholder: "e.g., 4-week training plan", suggestions: ["4-week training plan", "training announcement email", "knowledge check quiz", "lunch-and-learn outline", "training completion tracker"] },
      { name: "audience", label: "Audience", placeholder: "e.g., all county staff", suggestions: ["all county staff", "department directors", "new hires", "IT department", "field workers"] },
      { name: "topics", label: "Topics", placeholder: "e.g., safety rules and low-risk use cases", suggestions: ["safety rules and low-risk use cases", "the 10 production templates", "prompt efficiency strategies", "the scoring rubric and governance", "all chapters in this cookbook"] },
      { name: "duration", label: "Duration", placeholder: "e.g., 2 hours per week for 4 weeks", suggestions: ["2 hours per week for 4 weeks", "a 1-hour lunch session", "a half-day workshop", "30 minutes of self-paced reading", "a 2-day intensive"] }
    ]
  },

  // ── PART IV continued: Advanced Techniques & Jumpstart ──────────────
  {
    id: "ch21",
    number: 21,
    title: "The Manager's Guide to AI Prompting",
    subtitle: "How supervisors can lead AI adoption in their teams",
    part: "part3",
    partLabel: "Part III: Use Cases & Strategy",
    difficulty: "intermediate",
    icon: "👔",
    cardType: "governance",
    riskTier: "yellow",
    qualityScore: 8,
    summary: "A practical guide for managers and department directors on leading AI adoption, setting expectations, and reviewing AI-generated work from their teams.",
    source: "AI Working Group Leadership Sessions; NACo AI Adoption Framework",
    persona: "Director James Wilson",
    personaRole: "Department Director, Manatee County Public Works",
    content: [
      "As a manager, your role in AI adoption is not to become the expert — it's to create the conditions where your team can experiment safely. This means understanding the safety rules, knowing which use cases are approved, and setting clear expectations for quality review.",
      "Start with low-risk use cases in your department. Have your team try drafting routine correspondence, summarizing meeting notes, or creating checklists with AI assistance. Review the outputs together in team meetings to build shared understanding of what works.",
      "Set clear expectations: AI-generated content must always be reviewed by a human before it goes external. Staff should never paste confidential data into public AI tools. Every AI output should be fact-checked against county records.",
      "Track what works. Ask your team to share their best prompts in a department prompt library. This creates institutional knowledge and helps new staff get productive faster."
    ],
    promptExamples: [
      "\"Create a one-page guide for my team of 12 staff on how to use AI for drafting routine correspondence. Include dos and don'ts, 3 example prompts, and a quality checklist they should apply before sending.\"",
      "\"Draft talking points for a 15-minute team meeting where I introduce AI tools to staff who are skeptical. Address common concerns: job replacement, accuracy, and data privacy.\"",
      "\"Create a simple tracking spreadsheet template where my team can log their AI usage: date, tool used, task type, time saved estimate, and whether the output needed major revisions.\""
    ],
    keyTakeaways: [
      "Managers set the tone — encourage experimentation within safety boundaries",
      "Start with low-risk tasks and review outputs as a team",
      "Require human review of all external-facing AI content",
      "Build a department prompt library for institutional knowledge",
      "Track AI usage and time savings to justify continued adoption"
    ],
    tryItTemplate: "I manage a team of {{team_size}} in the {{department}} department. I need to {{goal}}. My team's current AI comfort level is {{comfort_level}}. Create a practical plan that addresses {{concern}}.",
    tryItVariables: [
      { name: "team_size", label: "Team Size", placeholder: "e.g., 8 people", suggestions: ["5 people", "8 people", "15 people", "25 people"] },
      { name: "department", label: "Department", placeholder: "e.g., Public Works", suggestions: ["Public Works", "HR", "Finance", "IT", "Parks & Recreation", "Emergency Management"] },
      { name: "goal", label: "Goal", placeholder: "e.g., introduce AI tools to my team", suggestions: ["introduce AI tools to my team", "improve our report writing process", "reduce time spent on routine emails", "create a department AI policy"] },
      { name: "comfort_level", label: "Comfort Level", placeholder: "e.g., beginners", suggestions: ["complete beginners", "some have tried ChatGPT", "mixed — some enthusiastic, some skeptical", "already using AI informally"] },
      { name: "concern", label: "Main Concern", placeholder: "e.g., data privacy", suggestions: ["data privacy", "accuracy of outputs", "staff resistance", "time to learn", "compliance requirements"] }
    ]
  },
  {
    id: "ch22",
    number: 22,
    title: "Templates & the Training Horizon",
    subtitle: "Building reusable prompt templates and planning for AI skill development",
    part: "part3",
    partLabel: "Part III: Use Cases & Strategy",
    difficulty: "advanced",
    icon: "🗺️",
    cardType: "governance",
    riskTier: "green",
    qualityScore: 7,
    summary: "How to create, test, and share reusable prompt templates across departments, plus a roadmap for ongoing AI skill development at Manatee County.",
    source: "AI Working Group Template Registry; Georgia GTA Best Practices",
    persona: "Sarah Martinez",
    personaRole: "Training Coordinator, Manatee County HR",
    content: [
      "A prompt template is a reusable pattern with placeholders that any staff member can fill in for their specific situation. Templates save time, ensure consistency, and reduce the risk of poor prompts generating unreliable outputs.",
      "Good templates follow the RTCO pattern: Role (who the AI should act as), Task (what it should do), Context (background information), and Output format (how to structure the response). Adding Constraints (what to avoid) makes them even more reliable.",
      "The AI Working Group maintains a template registry where approved templates are stored with their quality scores, supported tools, and department applicability. Any staff member can propose a new template by submitting it through the governance process.",
      "The training horizon for Manatee County AI adoption follows three phases: Phase 1 (Current) — safety awareness and low-risk use cases. Phase 2 (Next 6 months) — department-specific templates and mid-risk use cases. Phase 3 (12+ months) — advanced techniques, custom workflows, and integration with county systems."
    ],
    promptExamples: [
      "\"Create a prompt template for [department] staff to use when [task]. The template should include placeholders for [variable1], [variable2], and [variable3]. Format it so any staff member can fill it in without AI experience.\"",
      "\"Review this prompt template and rate it on a scale of 1-10 for: clarity, specificity, safety compliance, and reusability. Suggest improvements for any category scoring below 7.\"",
      "\"Draft a 6-month AI training roadmap for Manatee County that includes monthly milestones, skills to develop, and measurable outcomes for each phase.\""
    ],
    keyTakeaways: [
      "Templates make AI accessible to staff without prompt engineering skills",
      "RTCO pattern (Role, Task, Context, Output) is the foundation",
      "The template registry ensures quality and consistency across departments",
      "Three-phase training horizon: awareness → templates → advanced techniques",
      "Any staff member can propose new templates through governance"
    ],
    tryItTemplate: "Create a reusable prompt template for {{department}} staff to {{task}}. The template should follow the RTCO pattern with clear placeholders. Include instructions so a {{skill_level}} user can fill it in. The output should be formatted as {{format}}.",
    tryItVariables: [
      { name: "department", label: "Department", placeholder: "e.g., Finance", suggestions: ["Finance", "HR", "IT", "Public Works", "Communications", "Emergency Management"] },
      { name: "task", label: "Task", placeholder: "e.g., draft budget memos", suggestions: ["draft budget memos", "create inspection reports", "write press releases", "summarize meeting minutes", "generate training materials"] },
      { name: "skill_level", label: "User Skill Level", placeholder: "e.g., beginner", suggestions: ["complete beginner", "intermediate user", "power user"] },
      { name: "format", label: "Output Format", placeholder: "e.g., a fill-in-the-blank form", suggestions: ["a fill-in-the-blank form", "a step-by-step guide", "a copy-paste template with [brackets]", "a decision tree"] }
    ]
  },
  {
    id: "ch23",
    number: 23,
    title: "Chain-of-Thought Prompting",
    subtitle: "Get better answers by asking the AI to show its work",
    part: "part1",
    partLabel: "Part I: Foundations & Techniques",
    difficulty: "intermediate",
    icon: "🧠",
    cardType: "manual",
    riskTier: "green",
    qualityScore: 9,
    summary: "Chain-of-thought prompting forces AI to reason step-by-step instead of jumping to conclusions. This improves accuracy for logic, math, analysis, and multi-step tasks.",
    source: "Prompt Engineering Jumpstart, Ch. 5; Wei et al. 2022",
    persona: "Alex Rivera",
    personaRole: "Budget Analyst, Manatee County Finance",
    content: [
      "AI makes mistakes when it jumps straight to the final answer. Just like humans, the model performs better when it reasons step-by-step instead of guessing. This technique is called Chain-of-Thought (CoT) prompting.",
      "Chain-of-thought is a structured, step-by-step explanation of how the AI reached the answer. You explicitly tell the AI: show your steps, break down your reasoning, explain the logic before giving the conclusion.",
      "Three ways to trigger CoT: (1) Add 'Think step by step' to any prompt. (2) Add 'Show your reasoning before answering.' (3) Structure your prompt with numbered steps the AI should follow.",
      "CoT is especially useful for: budget calculations, policy analysis, troubleshooting IT issues, comparing vendor proposals, risk assessments, and any task where you need to verify the AI's logic.",
      "Tip: If the AI's step-by-step reasoning has a flaw, don't start over. Just tell it: 'Your reasoning in Step 3 is wrong because X. Redo Step 3 and continue from there.'"
    ],
    promptExamples: [
      "\"Think step by step: Our department budget is $2.4M. We need to cut 8%. Calculate the target amount, then identify which of these 5 line items could be reduced with least impact on services.\"",
      "\"Show your reasoning before answering: Should Manatee County implement a chatbot for 311 service requests? Consider cost, citizen satisfaction, staff impact, and technical requirements.\"",
      "\"Break this into steps: Analyze this vendor proposal for IT services. Step 1: Summarize the offering. Step 2: Compare pricing to our current contract. Step 3: Identify risks. Step 4: Give a recommendation with justification.\""
    ],
    keyTakeaways: [
      "Add 'Think step by step' to improve accuracy on complex tasks",
      "CoT exposes the AI's reasoning so you can verify and correct it",
      "Especially useful for math, analysis, comparisons, and troubleshooting",
      "You can structure CoT with numbered steps for even better results",
      "If the AI's reasoning has a flaw, you can point it out and ask it to redo that step"
    ],
    tryItTemplate: "Think step by step: I need to {{task}} for {{context}}. Break your analysis into clear steps. For each step, show your reasoning. After all steps, provide a {{deliverable}}.",
    tryItVariables: [
      { name: "task", label: "Task", placeholder: "e.g., analyze budget variance", suggestions: ["analyze budget variance", "evaluate vendor proposals", "assess risk of a new policy", "troubleshoot a process bottleneck", "plan a department reorganization"] },
      { name: "context", label: "Context", placeholder: "e.g., Q3 2026 budget review", suggestions: ["Q3 2026 budget review", "the new building permit system", "annual IT infrastructure upgrade", "emergency preparedness plan update"] },
      { name: "deliverable", label: "Final Deliverable", placeholder: "e.g., recommendation with pros and cons", suggestions: ["recommendation with pros and cons", "prioritized action plan", "risk matrix", "executive summary", "decision memo"] }
    ]
  },
  {
    id: "ch24",
    number: 24,
    title: "The RTCO Framework",
    subtitle: "Role, Task, Context, Output — the universal prompt structure",
    part: "part1",
    partLabel: "Part I: Foundations & Techniques",
    difficulty: "beginner",
    icon: "🏗️",
    cardType: "template",
    riskTier: "green",
    qualityScore: 9,
    summary: "RTCO is the standard prompt framework used throughout this cookbook. Master these four components and you can write effective prompts for any situation.",
    source: "AI Working Group; adapted from government prompt engineering guides",
    persona: "Maria Chen",
    personaRole: "HR Coordinator, Manatee County Human Resources",
    content: [
      "RTCO stands for Role, Task, Context, and Output format. It's the framework the AI Working Group uses for all production prompt templates because it consistently produces better results than unstructured prompts.",
      "Role: Tell the AI who to be. 'You are an experienced HR policy writer for local government.' This sets the expertise level, vocabulary, and perspective the AI should use.",
      "Task: State exactly what you need done. Be specific: not 'write something about onboarding' but 'create a 5-step onboarding checklist for new county employees in their first week.'",
      "Context: Provide background the AI needs. Department name, audience, constraints, relevant policies, deadline — anything that shapes the right answer.",
      "Output format: Specify the structure. 'Format as a numbered list,' 'Use a table with columns for...,' 'Write as a 2-paragraph email.' This prevents the AI from guessing how you want the information delivered.",
      "Tip: You don't need all four RTCO components every time. Even adding just a Role ('You are a county budget analyst') transforms generic output into expert-level output."
    ],
    promptExamples: [
      "Role: You are a county government communications specialist.\nTask: Write a public notice about road closures on Main Street.\nContext: Construction begins March 15, lasts 3 weeks, affects northbound lanes only. Detour via Oak Avenue.\nOutput: Format as a one-page notice with a header, key dates in bold, and a simple detour map description.",
      "Role: You are an IT support specialist for local government.\nTask: Create a troubleshooting guide for VPN connection issues.\nContext: Staff use Cisco AnyConnect on Windows 10/11 laptops. Common issues: timeout errors, credential failures, split tunnel not working.\nOutput: Step-by-step guide with numbered steps, screenshots descriptions, and an escalation path.",
      "Role: You are a budget analyst for a county with a $450M annual budget.\nTask: Draft talking points for the CFO about Q2 budget variances.\nContext: Revenue is 3% above forecast, but Public Safety overtime is 12% over budget.\nOutput: 5 bullet points, each with the data point and a one-sentence explanation."
    ],
    keyTakeaways: [
      "RTCO = Role + Task + Context + Output format",
      "Role sets expertise and perspective",
      "Task must be specific and measurable",
      "Context provides the background the AI needs to get it right",
      "Output format prevents the AI from guessing how to structure the response"
    ],
    tryItTemplate: "Role: You are a {{role}}.\nTask: {{task}}.\nContext: {{context}}.\nOutput: {{output_format}}.",
    tryItVariables: [
      { name: "role", label: "Role", placeholder: "e.g., county HR policy writer", suggestions: ["county HR policy writer", "public works project manager", "IT support specialist", "budget analyst", "emergency management coordinator"] },
      { name: "task", label: "Task", placeholder: "e.g., create an onboarding checklist", suggestions: ["create an onboarding checklist", "draft a public notice", "write a troubleshooting guide", "summarize a policy change", "create a training outline"] },
      { name: "context", label: "Context", placeholder: "e.g., for new hires starting in April", suggestions: ["for new hires starting in April", "for the Board meeting next Tuesday", "for staff with no technical background", "covering the last fiscal quarter"] },
      { name: "output_format", label: "Output Format", placeholder: "e.g., numbered checklist with deadlines", suggestions: ["numbered checklist with deadlines", "one-page memo", "table with columns", "bullet point summary", "email draft"] }
    ]
  },
  {
    id: "ch25",
    number: 25,
    title: "Persona & Scenario Prompting",
    subtitle: "Give AI a character and situation for more targeted results",
    part: "part1",
    partLabel: "Part I: Foundations & Techniques",
    difficulty: "intermediate",
    icon: "🎭",
    cardType: "manual",
    riskTier: "green",
    qualityScore: 8,
    summary: "Persona prompting tells the AI to 'act as' a specific expert. Combined with a scenario, it produces more relevant, contextually appropriate outputs for government work.",
    source: "Prompt Engineering Jumpstart, Ch. 3; White et al. 2023",
    persona: "Tom Rodriguez",
    personaRole: "Communications Director, Manatee County",
    content: [
      "Persona prompting means telling the AI to adopt a specific role or character: 'Act as a veteran county budget analyst with 20 years of experience.' This changes the vocabulary, depth, and perspective of the response.",
      "Why it works: When you say 'Act as an HR compliance officer,' the AI draws on patterns associated with that role — formal language, attention to policy detail, awareness of legal requirements. Without a persona, you get generic responses.",
      "Scenario prompting adds a situation: 'You are presenting to the Board of County Commissioners who are concerned about overtime costs.' This gives the AI not just a role but a purpose and audience, producing much more targeted output.",
      "Best practice for county use: combine persona + scenario + task. Example: 'Act as the county's emergency management coordinator. You are briefing department directors 24 hours before a hurricane makes landfall. Create a priority action checklist.'",
      "Tip: Be specific with personas. 'Act as a doctor' is vague. 'Act as a county customer service rep explaining billing to a frustrated homeowner' is precise and produces much better output."
    ],
    promptExamples: [
      "\"Act as a senior county IT administrator who has managed the transition from on-premise to cloud services. Explain to non-technical department heads why we're moving email to Microsoft 365, addressing their concerns about data security and downtime.\"",
      "\"You are a county public information officer during an active weather emergency. Draft 3 social media posts (Twitter-length) updating residents about shelter locations, road closures, and emergency contact numbers.\"",
      "\"Act as an experienced government auditor. Review this expense report and flag any items that would raise questions in a public records request. Explain each flag in plain language.\""
    ],
    keyTakeaways: [
      "'Act as...' sets the AI's expertise, vocabulary, and perspective",
      "Adding a scenario gives the AI purpose and audience awareness",
      "Combine persona + scenario + task for the best results",
      "Government personas: analyst, coordinator, officer, director, specialist",
      "Always specify the audience — who the output is for shapes the tone"
    ],
    tryItTemplate: "Act as a {{persona}} at Manatee County. You are {{scenario}}. {{task}}. Write for an audience of {{audience}}.",
    tryItVariables: [
      { name: "persona", label: "Persona", placeholder: "e.g., senior budget analyst", suggestions: ["senior budget analyst", "public information officer", "IT security specialist", "HR compliance officer", "emergency management coordinator"] },
      { name: "scenario", label: "Scenario", placeholder: "e.g., presenting to the Board", suggestions: ["presenting to the Board of County Commissioners", "onboarding a new department director", "responding to a public records request", "preparing for hurricane season", "conducting an annual review"] },
      { name: "task", label: "Task", placeholder: "e.g., create a briefing document", suggestions: ["create a briefing document", "draft talking points", "write an action checklist", "prepare a FAQ sheet", "outline a training session"] },
      { name: "audience", label: "Audience", placeholder: "e.g., department heads", suggestions: ["department heads", "frontline staff", "elected officials", "the general public", "new employees"] }
    ]
  },
  {
    id: "ch26",
    number: 26,
    title: "Microsoft Copilot Tips for County Staff",
    subtitle: "Getting the most from Copilot in Word, Outlook, Excel, and Teams",
    part: "part2",
    partLabel: "Part II: Ready-to-Use Templates",
    difficulty: "beginner",
    icon: "🤖",
    cardType: "template",
    riskTier: "green",
    qualityScore: 8,
    summary: "Practical tips for using Microsoft Copilot in the tools county staff already use daily — Word, Outlook, Excel, Teams, and PowerPoint.",
    source: "AI Working Group; Microsoft Copilot for Government documentation",
    persona: "Lisa Park",
    personaRole: "IT Training Specialist, Manatee County IT",
    content: [
      "Microsoft Copilot is integrated into the Office apps Manatee County staff already use. Unlike standalone chatbots, Copilot works inside your documents, emails, and spreadsheets — it sees your data and can act on it directly.",
      "Copilot in Word: Use it to draft documents from scratch ('Draft a memo about...'), rewrite existing text ('Make this more concise'), or summarize long documents ('Summarize the key points of this 20-page report'). Always review the output — Copilot can miss context that isn't in the document.",
      "Copilot in Outlook: Summarize long email threads ('Catch me up on this thread'), draft replies ('Reply saying we approve the request but need the timeline moved to April'), and set the tone ('Make this more formal').",
      "Copilot in Excel: Analyze data ('What are the trends in this spending data?'), create formulas ('Add a column that calculates the percentage change'), and generate charts. For complex analysis, be specific: 'Create a pivot table showing spending by department and quarter.'",
      "Copilot in Teams: Summarize meetings you missed ('What were the key decisions?'), generate action items ('List who committed to what'), and draft follow-up messages. Works best when meeting transcription is enabled."
    ],
    promptExamples: [
      "In Word: \"Draft a 2-page policy update memo to all staff about the new remote work guidelines. Use a professional tone, include an effective date of April 1, and add a FAQ section with 5 common questions.\"",
      "In Outlook: \"Summarize this email thread and draft a reply that confirms our attendance at the March 15 meeting but requests that budget discussion be moved to a separate session.\"",
      "In Excel: \"Analyze this spreadsheet of 311 calls. Add a column for response time category (under 24h, 1-3 days, over 3 days). Create a summary table showing count and percentage for each category by department.\""
    ],
    keyTakeaways: [
      "Copilot works inside your existing Office apps — no copy-pasting needed",
      "Be specific about what you want: format, tone, length, and audience",
      "Always review Copilot output before sending or publishing",
      "Copilot in Teams requires transcription to be enabled for meeting summaries",
      "For sensitive data, Copilot stays within your Microsoft 365 tenant — safer than public chatbots"
    ],
    tryItTemplate: "I'm working in {{app}} and need to {{task}}. The document/data is about {{topic}}. I need the result formatted as {{format}} for {{audience}}.",
    tryItVariables: [
      { name: "app", label: "Office App", placeholder: "e.g., Word", suggestions: ["Word", "Outlook", "Excel", "Teams", "PowerPoint"] },
      { name: "task", label: "Task", placeholder: "e.g., draft a memo", suggestions: ["draft a memo", "summarize an email thread", "analyze spending data", "create a presentation outline", "generate meeting action items"] },
      { name: "topic", label: "Topic", placeholder: "e.g., new remote work policy", suggestions: ["new remote work policy", "Q2 budget review", "IT system migration", "annual employee survey results", "department reorganization"] },
      { name: "format", label: "Format", placeholder: "e.g., a one-page memo", suggestions: ["a one-page memo", "bullet point summary", "a table with columns", "a 10-slide outline", "an email reply"] },
      { name: "audience", label: "Audience", placeholder: "e.g., department directors", suggestions: ["department directors", "all staff", "the Board", "the public", "my supervisor"] }
    ]
  },
  {
    id: "ch27",
    number: 27,
    title: "Negative Prompting",
    subtitle: "Telling AI what NOT to do is just as powerful as telling it what to do",
    part: "part1",
    partLabel: "Part I: Foundations & Techniques",
    difficulty: "intermediate",
    icon: "🚫",
    cardType: "manual",
    riskTier: "green",
    qualityScore: 8,
    summary: "Negative prompting eliminates fluff, wrong tones, hallucinations, and unwanted formatting by explicitly telling the AI what to exclude from its response.",
    source: "Prompt Engineering Jumpstart, Ch. 8",
    persona: "David Kim",
    personaRole: "Communications Specialist, Manatee County",
    content: [
      "Most people focus only on what they want: 'Write this,' 'Explain this,' 'Give me X.' But they forget the second half: '...and avoid THIS.' Negative prompting eliminates fluff, over-explanation, wrong tones, hallucinations, irrelevant details, unwanted formatting, and unnecessary creativity.",
      "Think of negative prompting like editing before the AI even begins. Instead of writing a prompt and then deleting half the output, you tell the AI upfront what to skip.",
      "Common negative constraints for county work: 'Do not include jargon,' 'Avoid speculation — only use facts from the provided data,' 'Do not add a conclusion paragraph,' 'Skip the introduction — start with the recommendations,' 'Do not use bullet points — use a numbered list instead.'",
      "Negative prompting is especially useful when you've tried a prompt and gotten output that's close but includes unwanted elements. Instead of rewriting the whole prompt, just add what to avoid.",
      "Tip: Negative prompting is most useful when you've tried a prompt and the output is close but includes unwanted elements. Instead of rewriting everything, just add what to avoid."
    ],
    promptExamples: [
      "\"Summarize this 10-page policy document in 5 bullet points. Do NOT include background history. Do NOT use jargon. Do NOT exceed one sentence per bullet.\"",
      "\"Draft a public notice about water main repairs on Elm Street. Avoid technical engineering terms. Do not include estimated costs. Do not speculate about completion dates — only include confirmed dates.\"",
      "\"Create talking points for the county administrator about AI adoption. Do not mention specific vendor names. Do not include statistics that aren't from our own data. Avoid the phrase 'cutting-edge technology.'\""
    ],
    keyTakeaways: [
      "Negative prompts eliminate unwanted content before it's generated",
      "Use 'Do not...' and 'Avoid...' to set clear boundaries",
      "Especially useful for removing jargon, speculation, and filler",
      "Add negative constraints when first attempts include unwanted elements",
      "Combine positive and negative instructions for maximum control"
    ],
    tryItTemplate: "{{task}}. Do NOT include {{exclude1}}. Avoid {{exclude2}}. The output should be {{format}} and must not {{constraint}}.",
    tryItVariables: [
      { name: "task", label: "Task", placeholder: "e.g., Summarize this report in 5 bullets", suggestions: ["Summarize this report in 5 bullet points", "Draft a public notice about construction", "Create talking points about AI adoption", "Write a policy overview for new employees"] },
      { name: "exclude1", label: "Exclude #1", placeholder: "e.g., background history", suggestions: ["background history", "technical jargon", "specific vendor names", "estimated costs", "personal opinions"] },
      { name: "exclude2", label: "Exclude #2", placeholder: "e.g., speculation", suggestions: ["speculation or unconfirmed information", "bullet points (use numbered list)", "an introduction paragraph", "statistics not from our data", "marketing language"] },
      { name: "format", label: "Format", placeholder: "e.g., concise and professional", suggestions: ["concise and professional", "in plain language for the public", "in a formal memo format", "as a table"] },
      { name: "constraint", label: "Must Not", placeholder: "e.g., exceed 200 words", suggestions: ["exceed 200 words", "use passive voice", "reference external sources", "include a conclusion", "use abbreviations without defining them"] }
    ]
  },
  {
    id: "ch28",
    number: 28,
    title: "Image Prompting",
    subtitle: "Describe visuals like a director, not a poet",
    part: "part4",
    partLabel: "Part IV: Governance & Horizon",
    difficulty: "advanced",
    icon: "🎨",
    cardType: "manual",
    riskTier: "yellow",
    qualityScore: 7,
    summary: "Writing good image prompts is about giving the model the right constraints — subject, style, composition, details, and constraints — like directing a photographer.",
    source: "Prompt Engineering Jumpstart, Ch. 11; DALL-E documentation",
    persona: "Rachel Torres",
    personaRole: "Graphic Designer, Manatee County Communications",
    content: [
      "Writing good image prompts is not about flowery adjectives. It's about giving the model the right constraints, just like directing a photographer or illustrator. This chapter shows you how to create product images, illustrations, diagrams, and concept art.",
      "Every high-quality image prompt follows the S-S-C-D-C structure: Subject (what the image is about), Style (illustration, 3D, cinematic, flat, watercolor), Composition (camera angle, framing), Details (colors, lighting, textures), and Constraints (aspect ratio, mood, realism level).",
      "For county government use: image generation is approved for internal presentations, social media graphics, and training materials. It is NOT approved for official county seals, legal documents, or content that could be mistaken for real photographs of county events.",
      "Common government use cases: creating illustrations for public safety campaigns, generating placeholder images for presentations, designing social media graphics for community events, and creating visual aids for training materials."
    ],
    promptExamples: [
      "\"Create a flat-style illustration of a friendly cartoon manatee wearing a hard hat, holding a clipboard, standing in front of a county government building. Bright colors, simple lines, suitable for a safety poster. 16:9 aspect ratio.\"",
      "\"Generate a clean infographic-style image showing 5 icons representing county services: a water droplet (utilities), a road (public works), a shield (public safety), a tree (parks), and a building (administration). White background, blue and green color scheme.\"",
      "\"Create a warm, welcoming illustration of diverse community members at a town hall meeting. Cartoon style, not photorealistic. Include people of different ages and backgrounds. Suitable for a government newsletter.\""
    ],
    keyTakeaways: [
      "Use the S-S-C-D-C structure: Subject, Style, Composition, Details, Constraints",
      "Be specific about style — 'flat illustration' gives very different results than 'photorealistic'",
      "Image generation is approved for internal and public outreach, not for official documents",
      "Always specify aspect ratio and intended use",
      "Never use AI-generated images that could be mistaken for real photographs of county events"
    ],
    tryItTemplate: "Create a {{style}} image of {{subject}}. Composition: {{composition}}. Colors: {{colors}}. The image should be {{aspect_ratio}} and suitable for {{use_case}}. Do not make it photorealistic.",
    tryItVariables: [
      { name: "style", label: "Style", placeholder: "e.g., flat illustration", suggestions: ["flat illustration", "cartoon style", "infographic", "watercolor", "minimalist icon set"] },
      { name: "subject", label: "Subject", placeholder: "e.g., a community park event", suggestions: ["a community park event", "county services icons", "a friendly manatee mascot", "a town hall meeting", "a public safety awareness graphic"] },
      { name: "composition", label: "Composition", placeholder: "e.g., centered, full scene", suggestions: ["centered, full scene", "close-up of the main character", "birds-eye view", "side-by-side comparison", "icon grid layout"] },
      { name: "colors", label: "Colors", placeholder: "e.g., blue and green county colors", suggestions: ["blue and green county colors", "warm earth tones", "bright and cheerful primary colors", "professional navy and white", "pastel palette"] },
      { name: "aspect_ratio", label: "Aspect Ratio & Use", placeholder: "e.g., 16:9 for a presentation slide", suggestions: ["16:9 for a presentation slide", "1:1 for social media", "4:3 for a newsletter", "vertical for a poster", "wide banner for a website header"] }
    ]
  },
  {
    id: "ch29",
    number: 29,
    title: "Testing Your Prompts",
    subtitle: "How to verify AI outputs and build confidence in your results",
    part: "part4",
    partLabel: "Part IV: Governance & Horizon",
    difficulty: "advanced",
    icon: "🧪",
    cardType: "governance",
    riskTier: "green",
    qualityScore: 9,
    summary: "Before relying on any AI output, you need to test it. This chapter covers practical testing methods: consistency checks, edge cases, fact verification, and the prompt scorecard.",
    source: "Prompt Engineering Jumpstart, Ch. 12; NIST AI RMF",
    persona: "Dr. Karen Liu",
    personaRole: "Quality Assurance Lead, Manatee County IT",
    content: [
      "Testing prompts is not optional — it's the difference between AI that helps and AI that creates problems. A prompt that works once might fail on different inputs. A prompt that sounds good might produce subtly wrong information.",
      "Four testing methods for county staff: (1) Consistency test — run the same prompt 3 times and check if the outputs agree. If they don't, the prompt is too vague. (2) Edge case test — try unusual inputs (empty fields, very long text, ambiguous requests). (3) Fact check — verify specific claims, numbers, and dates against known sources. (4) Audience test — show the output to someone from the target audience and ask if it makes sense.",
      "The Prompt Scorecard rates prompts on 5 dimensions: Accuracy (are the facts correct?), Completeness (does it cover all required points?), Tone (is it appropriate for the audience?), Format (is it structured as requested?), and Safety (does it comply with county AI policy?).",
      "When a prompt fails testing, don't start over. Add constraints: 'Only use data from the attached spreadsheet,' 'Do not generate any statistics — use only the numbers I provide,' 'If you are unsure about a fact, say so explicitly.'",
      "Important: Run the same prompt 3 times. If you get inconsistent results, the prompt is too vague — add more constraints until the outputs converge."
    ],
    promptExamples: [
      "\"I'm going to test this prompt 3 times. Generate a summary of the attached meeting notes. Focus only on decisions made and action items assigned. Flag anything you're uncertain about with [VERIFY].\"",
      "\"Review this AI-generated budget report. Check each number against the source data I provided. For any discrepancy, show: the AI's number, the correct number, the source row, and the percentage error.\"",
      "\"Rate this AI-generated public notice on a scale of 1-10 for: accuracy, readability (8th grade level), completeness (covers all required elements), appropriate tone for residents, and compliance with county communication standards.\""
    ],
    keyTakeaways: [
      "Test every prompt before relying on its output — consistency, edge cases, facts, audience",
      "Run the same prompt 3 times — inconsistent results mean the prompt needs more constraints",
      "Use the Prompt Scorecard: Accuracy, Completeness, Tone, Format, Safety",
      "When tests fail, add constraints rather than starting over",
      "Ask the AI to flag uncertainty with [VERIFY] tags"
    ],
    tryItTemplate: "I need to test the following prompt: '{{prompt_to_test}}'. Run it and then evaluate the output on these criteria: {{criteria}}. Score each criterion 1-10 and explain any score below 7. Suggest specific improvements.",
    tryItVariables: [
      { name: "prompt_to_test", label: "Prompt to Test", placeholder: "Paste the prompt you want to evaluate", suggestions: ["Summarize this meeting in bullet points", "Draft a public notice about road construction", "Create a budget comparison table", "Write a training plan for new employees"] },
      { name: "criteria", label: "Evaluation Criteria", placeholder: "e.g., accuracy, tone, completeness", suggestions: ["accuracy, tone, completeness, format, safety", "readability at 8th grade level, factual accuracy", "compliance with county style guide, audience appropriateness", "all five Prompt Scorecard dimensions"] }
    ]
  },
  {
    id: "ch30",
    number: 30,
    title: "Defensive Prompting",
    subtitle: "How to prevent hallucinations, bad answers, and AI overconfidence",
    part: "part4",
    partLabel: "Part IV: Governance & Horizon",
    difficulty: "advanced",
    icon: "🛡️",
    cardType: "governance",
    riskTier: "yellow",
    qualityScore: 9,
    summary: "Four techniques that eliminate 70% of AI hallucinations: the Don't Make Stuff Up clause, Source Enforcement, Uncertainty Prompting, and Boundary Setting.",
    source: "Prompt Engineering Jumpstart, Ch. 13; NIST AI RMF; County AI Working Group",
    persona: "Dr. Karen Liu",
    personaRole: "Quality Assurance Lead, Manatee County IT",
    content: [
      "LLMs are powerful but not magical. They hallucinate, misunderstand vague inputs, invent details when context is weak, overconfidently guess, and sometimes ignore constraints. This chapter teaches defensive prompting — designing prompts that prevent bad answers before they happen.",
      "The Anti-Hallucination Toolkit has four techniques. First, the 'Don't Make Stuff Up' clause: add 'If the answer is not in the context provided, say I don't know based on the given information.' Second, Source Enforcement: add 'Support every claim with text directly from the provided context. If the context does not support it, exclude it.' Third, Uncertainty Prompting: add 'If uncertain, provide the most likely answer and state your level of confidence.' Fourth, Proof Requirement: add 'Explain why your answer is correct using the available context only.'",
      "The Clarify Before Answering pattern prevents wrong assumptions. Add: 'If the question is ambiguous, ask for clarification before answering.' This single line prevents incorrect interpretations, irrelevant answers, and wrong assumptions that compound through the response.",
      "Boundary Setting tells the model what to avoid. Examples: 'Do not add examples unless I ask. Do not assume missing data. Do not guess names, values, or statistics. Do not expand or summarize unless instructed. Do not include external knowledge.' These constraints produce cleaner, safer outputs for county work.",
      "Warning: For any AI output that will be used in public-facing documents, legal correspondence, budget presentations, or personnel decisions, always include at minimum the Don't Make Stuff Up clause and Source Enforcement. These are non-negotiable for Manatee County government use.",
      "Tip: The simplest defensive prompt addition that works everywhere: 'If you are unsure about any fact, flag it with [VERIFY] so I know to check it.' This one line turns the AI from a confident guesser into a cautious assistant."
    ],
    promptExamples: [
      "\"Summarize this 10-page budget report. Only include facts directly stated in the document. If a number seems inconsistent, flag it with [VERIFY]. Do not calculate totals or percentages that aren't explicitly stated. If information is missing, say 'Not found in document.'\"",
      "\"Review this draft press release for factual accuracy. For each claim, cite the source document and paragraph. If any claim cannot be verified from the provided materials, mark it [UNVERIFIED]. Do not add context or background that isn't in the source documents.\"",
      "\"You are a county budget analyst. Analyze this vendor proposal. Think step by step. If any pricing seems unusual compared to the RFP requirements, flag it rather than explaining it away. If you are uncertain about any comparison, state your confidence level (high/medium/low). Do not invent market comparisons.\""
    ],
    keyTakeaways: [
      "The Anti-Hallucination Toolkit: Don't Make Stuff Up, Source Enforcement, Uncertainty Prompting, Proof Requirement",
      "Always add 'If unsure, say so' to government AI prompts",
      "Boundary Setting: explicitly list what the AI should NOT do",
      "The Clarify Before Answering pattern prevents wrong assumptions",
      "For public-facing work, Source Enforcement and Don't Make Stuff Up are mandatory",
      "Use [VERIFY] tags to flag uncertain facts for human review"
    ],
    tryItTemplate: "{{task}}. Only use information from the provided context. If the answer is not in the context, say 'I don't know based on the given information.' For any uncertain facts, flag with [VERIFY]. Do not {{boundary1}}. Do not {{boundary2}}. If the question is ambiguous, ask for clarification before answering.",
    tryItVariables: [
      { name: "task", label: "Task", placeholder: "e.g., Summarize this budget report", suggestions: ["Summarize this budget report", "Review this press release for accuracy", "Analyze this vendor proposal", "Draft a response to this records request"] },
      { name: "boundary1", label: "Don't Do #1", placeholder: "e.g., guess statistics", suggestions: ["guess statistics", "add examples I didn't ask for", "assume missing data", "include external knowledge"] },
      { name: "boundary2", label: "Don't Do #2", placeholder: "e.g., expand beyond scope", suggestions: ["expand beyond the scope of the document", "change the meaning of any quoted text", "invent details or names", "summarize unless instructed"] }
    ]
  }
];

export const stats = {
  chapters: chapters.length,
  prompts: "110+",
  templates: 11,
  sources: "14+",
};

export const tagLabels = [
  "MCG AI Prompt Cookbook",
];
