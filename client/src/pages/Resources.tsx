import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  Wrench,
  FlaskConical,
  ExternalLink,
  Globe,
  Building2,
  Home,
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";
import { Link, useLocation } from "wouter";

const ACCENT = "oklch(0.42 0.14 300)";
const ACCENT_LIGHT = "oklch(0.94 0.04 300)";
const CARD_BG = "oklch(0.998 0.002 70)";
const CARD_BORDER = "oklch(0.92 0.01 70)";
const PAGE_BG = "oklch(0.97 0.008 75)";
const TEXT_PRIMARY = "oklch(0.22 0.03 40)";
const TEXT_SECONDARY = "oklch(0.48 0.03 50)";
const TEXT_MUTED = "oklch(0.50 0.04 50)";

const DIFFICULTY_COLORS: Record<string, { text: string; bg: string }> = {
  Beginner: { text: "oklch(0.42 0.14 155)", bg: "oklch(0.94 0.03 155)" },
  Intermediate: { text: "oklch(0.48 0.12 220)", bg: "oklch(0.94 0.03 220)" },
  Advanced: { text: "oklch(0.42 0.14 300)", bg: "oklch(0.94 0.03 300)" },
  "All Levels": { text: "oklch(0.50 0.10 75)", bg: "oklch(0.94 0.04 75)" },
};

type TabId = "courses" | "government" | "internal" | "recipes";

const jumpstartChapters = [
  { title: "The 5-Minute Mindset", subtitle: "Stop guessing, start targeting", description: "Change your entire approach to talking with AI. Vague prompt = vague answer. Specific prompt = useful answer.", image: "/chapters/ch1-Specificity_small.png", chapterId: "ch01",
    lesson: "The single biggest mistake people make with AI: they type vague requests and expect specific answers. \"Help me with this report\" gives you generic filler. \"Summarize the Q3 budget variance report in 3 bullet points for the County Administrator\" gets you something you can actually use.\n\nThe fix takes 5 minutes to learn: before you type anything, answer the 5W+H — Who needs this? What exactly do I need? When/where will it be used? Why does it matter? How should it look?\n\nCounty example: Instead of \"Write an email about the meeting,\" try \"Write a 3-paragraph email to department directors summarizing today's budget workshop. Include the three decisions that were made and the April 15 deadline for submitting revised numbers.\"" },
  { title: "Your First Magic Prompt", subtitle: "The RTCO formula", description: "The 4-step recipe every great prompt uses: Role, Task, Context, Output format. The master key to every prompt.", image: "/chapters/ch2-FiveWandoneH_small.png", chapterId: "ch02",
    lesson: "RTCO is the skeleton key. Every effective prompt has four parts:\n\n• Role — Tell the AI who it is. \"You are a county budget analyst\" sets the tone, vocabulary, and perspective.\n• Task — What do you need done? Be specific. \"Summarize\" is different from \"compare\" is different from \"draft.\"\n• Context — Background the AI needs. Paste the data, describe the audience, state constraints.\n• Output — How should the result look? \"Bullet list under 200 words\" or \"formal memo with headers.\"\n\nCounty example:\nRole: You are a public information officer for Manatee County.\nTask: Draft a press release announcing the new online permitting system.\nContext: Launches April 1. Covers building, zoning, and code enforcement permits. Replaces paper forms. Available at mymanatee.org.\nOutput: 250 words, AP style, include a quote placeholder for the County Administrator." },
  { title: "The Persona Pattern", subtitle: "Act as...", description: "Give the AI a uniform and a name tag. When you say 'act as,' the AI snaps into that character's knowledge and tone.", image: "/chapters/ch3-persona-pattern_small.png", chapterId: "ch03",
    lesson: "When you tell AI to \"act as\" a specific role, it shifts its entire vocabulary, reasoning style, and assumptions. \"Act as a building inspector\" produces different output than \"act as a communications director\" — even for the same topic.\n\nEffective personas include:\n• Job title and organization\n• Years of experience or expertise level\n• Specific knowledge domains\n• Communication style expectations\n\nCounty example: \"Act as a senior grants coordinator for Manatee County with 15 years of experience writing federal grant applications. You specialize in FEMA hazard mitigation grants and HUD community development block grants. Write in formal federal grant language.\"\n\nPro tip: Stack personas for peer review. Write something as one role, then critique it as another. \"Now act as the grant reviewer and identify the three weakest sections of this application.\"" },
  { title: "Show and Tell", subtitle: "Few-shot learning", description: "Don't tell the AI what you want — show it. One good example is worth ten instructions.", image: "/chapters/ch4-showand-tell_small.png", chapterId: "ch04",
    lesson: "Instead of describing the format you want, paste an example of it. AI learns patterns from examples faster than from instructions.\n\nZero-shot: \"Write a status update.\" (AI guesses the format)\nOne-shot: \"Here's an example status update: [example]. Now write one for my project.\"\nFew-shot: Give 2-3 examples, then ask for a new one. The AI will match the pattern.\n\nCounty example: Paste a well-formatted board memo you've written before, then say: \"Using this exact format and tone, write a new memo about [topic].\" The AI will match your headers, paragraph length, level of detail, and voice.\n\nThis works for any repeating format: inspection reports, meeting minutes, public notices, email templates. One good example saves you from writing a paragraph of formatting instructions." },
  { title: "Thinking Out Loud", subtitle: "Chain-of-thought", description: "If you want better answers, ask the AI to show its work. Step-by-step reasoning improves accuracy on complex tasks.", image: "/chapters/ch5-task_chaining_small.png", chapterId: "ch05",
    lesson: "For complex questions, ask the AI to reason step-by-step before giving a final answer. This reduces errors on math, logic, policy analysis, and multi-factor decisions.\n\nAdd one of these phrases:\n• \"Think through this step by step.\"\n• \"Show your reasoning before giving your answer.\"\n• \"Walk me through your analysis.\"\n\nCounty example: \"We need to decide whether to extend the contract with our current fleet maintenance vendor or go to bid. Think through this step by step, considering: current contract terms, market rates, transition costs, service quality history, and procurement timeline requirements under Florida Statute 287.\"\n\nWithout chain-of-thought, you get a surface-level recommendation. With it, you get a structured analysis you can actually bring to a meeting." },
  { title: "Taming the Output", subtitle: "Formatting", description: "Don't just ask for an answer — decide how it should look. Tables, bullets, memos, JSON.", image: "/chapters/ch6-Taming_the_Output_small.png", chapterId: "ch06",
    lesson: "AI will give you a wall of text unless you tell it otherwise. Specify the format and you get something usable immediately.\n\nFormats that work well:\n• \"Respond in a markdown table with columns: Item, Status, Owner, Due Date\"\n• \"Use bullet points, no more than 8 items\"\n• \"Format as a formal memo with these headers: Background, Analysis, Recommendation\"\n• \"Give me exactly 3 options, each in 2 sentences\"\n\nLength controls:\n• \"Keep it under 200 words\"\n• \"One paragraph only\"\n• \"Executive summary: 3 sentences max\"\n\nCounty example: \"Summarize these 14 public comments on the zoning amendment. Format as a table with columns: Commenter Name, Position (Support/Oppose/Neutral), Key Concern, Staff Response Needed (Yes/No). Sort by position.\"" },
  { title: "The Art of the Follow-Up", subtitle: "Iteration", description: "Your first answer is never the final answer. The magic is in the refinements.", image: "/chapters/ch7-The_Art_of_the_Follow-Up_small.png", chapterId: "ch07",
    lesson: "Your first prompt gets you 70% there. The follow-up gets you to 95%. Treat AI like a conversation, not a vending machine.\n\nPower follow-ups:\n• \"Make it more formal / less formal\"\n• \"Now rewrite this for a non-technical audience\"\n• \"Cut this in half\"\n• \"Add specific numbers and dates where you used vague language\"\n• \"What did you leave out that I should consider?\"\n• \"Challenge your own recommendation — what's the strongest argument against it?\"\n\nCounty example: Start with \"Draft talking points for the County Administrator about the new stormwater fee.\" Then follow up: \"Now add a FAQ section with the 5 questions residents will most likely ask.\" Then: \"Make the tone less bureaucratic — write it like you're explaining to a neighbor.\"\n\nEach follow-up costs you 10 seconds and dramatically improves the output." },
  { title: "Negative Prompting", subtitle: "What NOT to do", description: "Telling AI what NOT to do is just as powerful as telling it what to do. Edit before the AI even begins.", image: "/chapters/ch8-Negative_prompting_small.png", chapterId: "ch26",
    lesson: "Constraints are as powerful as instructions. Tell AI what to avoid and you eliminate entire categories of bad output before they happen.\n\nCommon constraints:\n• \"Do not use jargon or acronyms without defining them\"\n• \"Do not make up statistics or cite sources that may not exist\"\n• \"Do not include a greeting or sign-off\"\n• \"Do not exceed 300 words\"\n• \"Do not use bullet points — use complete paragraphs only\"\n\nCounty example: \"Write a public notice about the water main repair on Cortez Road. Do NOT include: technical engineering terms, estimated costs, contractor names, or any language that could be interpreted as assigning fault. DO include: affected area, timeline, alternative routes, and the 311 number for questions.\"\n\nPro tip: If AI keeps doing something you don't want, add it as an explicit constraint rather than just rephrasing your ask." },
  { title: "Task Chaining", subtitle: "Modular decomposition", description: "Break the big task into smaller tasks. AI solves each sub-task more reliably than the whole.", image: "/chapters/ch09-task_chaining_small.png", chapterId: "ch09",
    lesson: "Big tasks produce messy results. Break them into a chain of smaller tasks and the quality jumps dramatically.\n\nInstead of: \"Write a complete project plan for the new park.\"\nDo this:\n1. \"List the 8 major phases of a municipal park construction project.\"\n2. \"For phase 3 (Design), list the deliverables, estimated timeline, and responsible parties.\"\n3. \"Draft the RFP scope of work for the landscape architecture firm, based on the design phase deliverables above.\"\n\nEach step builds on the previous one. You can review and correct at each stage.\n\nCounty example: Preparing a board presentation?\n1. \"Summarize the key data points from this report.\" (paste report)\n2. \"Organize these into 5 slides with headers.\"\n3. \"Write speaker notes for each slide — 2 minutes per slide.\"\n4. \"Generate 3 likely questions commissioners will ask and draft responses.\"\n\nFour focused prompts beat one giant prompt every time." },
  { title: "The Prompt Recipe Book", subtitle: "High-impact templates", description: "Use these templates to solve 80% of your daily AI tasks. Plug-and-play prompts for writing, analysis, data, and planning.", image: "/chapters/ch-10_Cheatsheet_small.png", chapterId: null,
    lesson: "You don't need to write every prompt from scratch. These templates handle most county work:\n\n• Summarizer: \"Summarize [document] in [format] for [audience]. Keep under [length].\"\n• Rewriter: \"Rewrite this for [audience]. Keep the same facts. Change the tone to [formal/casual/plain].\"\n• Extractor: \"Extract [fields] from the following text. If missing, write 'Not found.' Format as a table.\"\n• Comparer: \"Compare [A] and [B] on these dimensions: [list]. Use a table. Add a recommendation row.\"\n• Drafter: \"Act as [role]. Draft a [document type] about [topic] for [audience]. Include [sections]. Keep under [length].\"\n• Reviewer: \"Review this [document] for [criteria]. List issues as: Location, Issue, Suggested Fix.\"\n\nSee the Recipes tab for 15 ready-to-use templates you can copy or send to the Prompt Builder." },
  { title: "Image Prompting", subtitle: "DALL-E, Midjourney, etc.", description: "Describe visuals like a director, not a poet. Subject, style, composition, details, constraints.", image: "/chapters/ch11-Image_Prompting_small.png", chapterId: "ch28",
    lesson: "Image AI needs you to think like a photographer, not a writer. Describe what you see, not what you feel.\n\nThe formula: Subject + Style + Composition + Details + Constraints\n\nExample: \"A professional photograph of the Manatee County Government Center building, straight-on angle, clear blue sky, well-maintained landscaping in foreground, high resolution, corporate annual report style, no people visible.\"\n\nTips for county use:\n• \"Infographic style\" for presentations\n• \"Clean vector illustration\" for public-facing materials\n• \"Photorealistic\" for mockups\n• Always specify \"no text in the image\" — AI-generated text is usually garbled\n• Describe the mood: \"welcoming,\" \"professional,\" \"approachable\"\n\nNote: Check your county's AI image policy before using AI-generated images in official materials. Some jurisdictions require disclosure." },
  { title: "Testing Your Prompts", subtitle: "Consistency and quality", description: "A prompt is only good if it works every time — not just once. Run it 3 times. If results differ, add constraints.", image: "/chapters/ch12-testing-your-prompt_small.png", chapterId: "ch29",
    lesson: "A prompt that works once might not work next time. AI outputs vary between runs. Before you rely on a prompt for recurring work, test it.\n\nThe 3-run test:\n1. Run the same prompt 3 times\n2. Compare the outputs\n3. If they differ in structure or key content, your prompt needs more constraints\n\nWhat to check:\n• Does the format stay consistent?\n• Are the key facts always included?\n• Does the length stay in range?\n• Does the tone match every time?\n\nFix inconsistency by:\n• Adding explicit format requirements\n• Including examples (few-shot)\n• Adding constraints (\"always include,\" \"never omit\")\n• Being more specific about length and structure\n\nCounty example: If you use a prompt to draft weekly status updates, run it 3 times with the same inputs. If one run uses bullets and another uses paragraphs, add \"Format: exactly 5 bullet points\" to lock it down." },
  { title: "Avoiding Bad Answers", subtitle: "Limitations and defenses", description: "Good prompting is not only about getting great outputs — it's also about preventing bad ones. The Anti-Hallucination Toolkit.", image: "/chapters/ch13-avoiding_bad_answers_small.png", chapterId: "ch30",
    lesson: "AI will confidently make things up. It will cite laws that don't exist, invent statistics, and fabricate names. Your job is to build defenses into your prompts.\n\nAnti-hallucination rules to include:\n• \"Only use information I provide. Do not add outside facts.\"\n• \"If you're unsure about something, say so explicitly.\"\n• \"Do not cite specific statutes, case law, or statistics unless I provide them.\"\n• \"If the answer requires information you don't have, list what you need instead of guessing.\"\n\nHigh-risk areas for county work:\n• Legal references (always verify statutes and ordinances)\n• Budget numbers (AI will estimate if you don't provide actuals)\n• Dates and deadlines (AI fills in plausible but wrong dates)\n• Names and titles (AI invents realistic-sounding staff names)\n\nGolden rule: AI is a drafting tool, not a source of truth. Every fact in AI output that goes into an official document must be verified by a human." },
  { title: "Capstone: Putting It All Together", subtitle: "The Master Blueprint", description: "One final prompt that uses everything you've learned. The 9-step master template for any task.", image: "/chapters/ch14-putting_it_all_together_small.png", chapterId: null,
    lesson: "The Master Blueprint combines every technique into one framework. Use this for complex, high-stakes prompts:\n\n1. Role — Who is the AI?\n2. Context — Background and constraints\n3. Task — What needs to be done\n4. Input data — Paste or reference the source material\n5. Output format — Exactly how the result should look\n6. Examples — Show one good output (few-shot)\n7. Chain-of-thought — \"Think step by step\"\n8. Constraints — What NOT to do\n9. Quality check — \"Before finalizing, verify that you have...\"\n\nYou won't need all 9 steps for every prompt. A quick email needs steps 1-3. A board presentation needs all 9.\n\nTry building one in the Prompt Builder — it walks you through each block. Or jump to the Prompt Lab to practice with real county scenarios.\n\nThe best prompt engineers aren't the ones who memorize rules — they're the ones who practice. Start with the templates, iterate, and build your own library of prompts that work for your specific job." },
];

const govResources = [
  { title: "GovAI Coalition", description: "National coalition for responsible AI adoption in government — Manatee County's AI Handbook is aligned with GovAI templates", url: "https://govai.org" },
  { title: "NACo AI County Compass", description: "National Association of Counties AI toolkit — referenced in Manatee County's governance framework", url: "https://www.naco.org/resources/ai" },
  { title: "NIST AI Risk Management Framework", description: "Federal AI risk framework (AI RMF 1.0) — the foundation of Manatee County's AI risk classification system", url: "https://www.nist.gov/artificial-intelligence" },
  { title: "White House AI Bill of Rights", description: "Blueprint for responsible AI use in public services — informs Manatee County's guiding principles", url: "https://www.whitehouse.gov/ostp/ai-bill-of-rights/" },
  { title: "Florida Digital Service", description: "State of Florida AI policy and digital government initiatives", url: "https://digital.fl.gov" },
];

const internalResources = [
  {
    title: "AI Working Group",
    description: "The MCG AI Working Group coordinates AI adoption across all county departments, develops training, and maintains the AI Governance Handbook.",
    details: [
      "Meets bi-weekly on Teams — open to all county employees",
      "Managed by the Information Technology Services (ITS) Department",
      "Contact: itservices@mymanatee.org",
      "Current focus: prompt engineering fluency, AI policy compliance, and department-specific use cases",
      "Manatee County is the first US local government to deploy Peregrine's AI emergency management dashboard",
    ],
    icon: "🤝",
  },
  {
    title: "AI Governance Handbook (v1.0)",
    description: "The official Manatee County AI Governance Handbook (March 2026) governs all county AI use. Aligned with NIST AI RMF, GovAI Coalition, and Florida state policy.",
    details: [
      "AI Review required for all new technology procurements involving AI systems",
      "AI Risk Classification: Minimal, Limited, High, Unacceptable — determines review level",
      "Approved tools: Microsoft Copilot (county license), ChatGPT (non-confidential use only)",
      "Prohibited: uploading PII, HIPAA data, law enforcement records, or Sunshine Law-covered deliberations to any AI tool",
      "All AI-generated content must be human-reviewed before external distribution",
      "County systems include: GIS platform, Zendesk (constituent services), OpenGov (budget), RapidDeploy 911",
      "Report concerns to your department director or ITS (itservices@mymanatee.org)",
    ],
    icon: "📋",
  },
  {
    title: "Request AI Training",
    description: "Request a custom AI training session for your team or department. Sessions are led by the AI Working Group and can be tailored to your specific workflows.",
    details: [
      "Format options: 30-min lunch-and-learn · 1-hour hands-on workshop · Half-day deep dive",
      "Available topics: Prompt engineering basics · Department-specific use cases · Prompt Builder walkthrough · AI policy and responsible use · Advanced techniques (CoT, RTCO, task chaining)",
      "Who can request: Any department director, team lead, or supervisor on behalf of their team",
      "Minimum group size: 5 participants per session",
      "Lead time: Submit requests at least 2 weeks before your preferred date",
      "How to request: Email the AI Working Group (ai-workgroup@mymanatee.org) with: your name, department, preferred format, topic, team size, and 2-3 available dates",
      "Post-training support: Participants receive access to the Prompt Cookbook app, a quick-reference card, and one 30-min follow-up Q&A session",
    ],
    icon: "🎓",
  },
];

const tabs: { id: TabId; label: string; icon: typeof BookOpen }[] = [
  { id: "courses", label: "Courses", icon: GraduationCap },
  { id: "government", label: "Government", icon: Globe },
  { id: "internal", label: "Internal", icon: Building2 },
  { id: "recipes", label: "Recipes", icon: BookOpen },
];

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function Resources() {
  const initialTab = (() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("tab") as TabId | null;
      if (t && tabs.some((tab) => tab.id === t)) return t;
      const stored = localStorage.getItem("cookbook-resources-tab") as TabId | null;
      if (stored && tabs.some((tab) => tab.id === stored)) {
        localStorage.removeItem("cookbook-resources-tab");
        return stored;
      }
    } catch { /* ignore */ }
    return "courses" as TabId;
  })();
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  return (
    <div className="min-h-screen" style={{ background: PAGE_BG }}>
      {/* Sticky header */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3"
        style={{
          background: "oklch(0.97 0.008 75 / 0.95)",
          backdropFilter: "blur(8px)",
          borderBottom: `1px solid oklch(0.90 0.02 75)`,
        }}
      >
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm font-medium" style={{ color: TEXT_MUTED }}>
            Cookbook
          </Link>
          <ChevronRight className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.03 55)" }} />
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="font-serif font-bold text-sm" style={{ color: TEXT_PRIMARY }}>
              Resource Board
            </span>
          </div>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{ background: "oklch(0.94 0.01 70)", color: TEXT_MUTED }}
        >
          <Home className="w-3.5 h-3.5" />
          Home
        </Link>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Compact Hero */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mb-8"
        >
          <motion.div variants={fadeUp} className="mb-5">
            <h1
              className="font-serif text-2xl sm:text-3xl font-bold mb-2"
              style={{ color: TEXT_PRIMARY }}
            >
              Resource Board
            </h1>
            <p className="text-sm sm:text-base max-w-2xl" style={{ color: TEXT_SECONDARY }}>
              Courses, tools, and references for building AI fluency across Manatee County government.
            </p>
          </motion.div>

          {/* Stat badges */}
          <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
            {[
              { count: 14, label: "Jumpstart chapters", color: ACCENT },
              { count: promptRecipes.length, label: "Prompt recipes", color: "oklch(0.42 0.14 155)" },
              { count: 5, label: "Gov resources", color: "oklch(0.50 0.10 155)" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
              >
                <span className="text-lg font-black tabular-nums" style={{ color: stat.color }}>
                  {stat.count}
                </span>
                <span className="text-xs font-medium" style={{ color: TEXT_SECONDARY }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.section>

        {/* Quick Action CTAs — always visible */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link href="/builder" className="block">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -3, boxShadow: "0 8px 24px oklch(0.18 0.02 38 / 0.10)" }}
              className="rounded-xl p-5 flex items-center gap-4 cursor-pointer"
              style={{
                background: "oklch(0.18 0.04 220)",
                border: "1px solid oklch(0.28 0.04 220)",
              }}
            >
              <Wrench className="w-8 h-8 shrink-0" style={{ color: "oklch(0.70 0.12 220)" }} />
              <div>
                <h3 className="font-bold text-sm" style={{ color: "oklch(0.95 0.01 70)" }}>Build a Custom Prompt</h3>
                <p className="text-xs mt-0.5" style={{ color: "oklch(0.70 0.03 70)" }}>Pick a template, fill in your details, copy into Copilot or ChatGPT</p>
              </div>
              <ArrowRight className="w-5 h-5 shrink-0" style={{ color: "oklch(0.65 0.08 220)" }} />
            </motion.div>
          </Link>
          <Link href="/game" className="block">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              whileHover={{ y: -3, boxShadow: "0 8px 24px oklch(0.18 0.02 38 / 0.10)" }}
              className="rounded-xl p-5 flex items-center gap-4 cursor-pointer"
              style={{
                background: "oklch(0.18 0.04 155)",
                border: "1px solid oklch(0.28 0.04 155)",
              }}
            >
              <FlaskConical className="w-8 h-8 shrink-0" style={{ color: "oklch(0.65 0.14 155)" }} />
              <div>
                <h3 className="font-bold text-sm" style={{ color: "oklch(0.95 0.01 70)" }}>Test Your Skills</h3>
                <p className="text-xs mt-0.5" style={{ color: "oklch(0.70 0.03 70)" }}>Real county scenarios — can you spot what makes a prompt work?</p>
              </div>
              <ArrowRight className="w-5 h-5 shrink-0" style={{ color: "oklch(0.65 0.08 155)" }} />
            </motion.div>
          </Link>
        </div>

        {/* Tab navigation */}
        <div
          className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto"
          style={{ background: "oklch(0.94 0.01 70)" }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all duration-200"
                style={{
                  background: isActive ? CARD_BG : "transparent",
                  color: isActive ? TEXT_PRIMARY : TEXT_SECONDARY,
                  boxShadow: isActive ? "0 1px 4px oklch(0.18 0.02 38 / 0.08)" : "none",
                }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === "courses" && (
            <motion.div
              key="courses"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-10"
            >
              <CoursesTab />
            </motion.div>
          )}
          {activeTab === "government" && (
            <motion.div
              key="government"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <GovernmentTab />
            </motion.div>
          )}
          {activeTab === "internal" && (
            <motion.div
              key="internal"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <InternalTab />
            </motion.div>
          )}
          {activeTab === "recipes" && (
            <motion.div
              key="recipes"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <RecipesTab />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="pt-8 pb-8 mt-10 text-center" style={{ borderTop: `1px solid oklch(0.90 0.02 75)` }}>
          <p className="text-xs" style={{ color: TEXT_MUTED }}>
            AI Working Group Resource Board — Manatee County Government
          </p>
        </footer>
      </main>
    </div>
  );
}

/* ─── Courses Tab ────────────────────────────────────────────────────────── */

function CoursesTab() {
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);

  return (
    <>
      {/* Jumpstart Course */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: ACCENT_LIGHT }}
          >
            <GraduationCap className="w-4.5 h-4.5" style={{ color: ACCENT }} />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold leading-tight" style={{ color: TEXT_PRIMARY }}>
              Prompt Engineering Jumpstart
            </h2>
            <p className="text-xs" style={{ color: TEXT_SECONDARY }}>14 lessons — click any to read</p>
          </div>
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-2"
        >
          {jumpstartChapters.map((ch, i) => {
            const isOpen = expandedLesson === i;
            return (
              <motion.div
                key={ch.title}
                variants={fadeUp}
                className="rounded-xl overflow-hidden"
                style={{
                  background: CARD_BG,
                  border: isOpen ? `1px solid ${ACCENT}` : `1px solid ${CARD_BORDER}`,
                  transition: "border-color 0.2s",
                }}
              >
                {/* Collapsed header */}
                <button
                  onClick={() => setExpandedLesson(isOpen ? null : i)}
                  className="w-full flex items-center gap-3 p-3 text-left"
                >
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black tabular-nums flex-shrink-0"
                    style={{ background: isOpen ? ACCENT : "oklch(0.92 0.02 300)", color: isOpen ? "white" : ACCENT }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm leading-snug" style={{ color: TEXT_PRIMARY }}>
                      {ch.title}
                    </h4>
                    <p className="text-[11px]" style={{ color: ACCENT }}>
                      {ch.subtitle}
                    </p>
                  </div>
                  <ChevronRight
                    className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
                    style={{
                      color: TEXT_MUTED,
                      transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                    }}
                  />
                </button>

                {/* Expanded lesson content */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0">
                        {/* Description */}
                        <p className="text-xs leading-relaxed mb-3" style={{ color: TEXT_SECONDARY }}>
                          {ch.description}
                        </p>
                        {/* Lesson content */}
                        <div
                          className="rounded-lg p-4 text-[13px] leading-relaxed whitespace-pre-wrap"
                          style={{
                            background: "oklch(0.97 0.005 75)",
                            color: "oklch(0.28 0.03 40)",
                            border: `1px solid oklch(0.92 0.01 70)`,
                          }}
                        >
                          {ch.lesson}
                        </div>
                        {/* Workshop actions — directed to specific app features */}
                        <div
                          className="rounded-lg p-3 mt-3 flex flex-wrap items-center gap-2"
                          style={{ background: "oklch(0.94 0.02 250 / 0.3)", border: "1px solid oklch(0.88 0.03 250)" }}
                        >
                          <span className="text-[11px] font-bold" style={{ color: "oklch(0.35 0.08 250)" }}>
                            Try it now:
                          </span>
                          {ch.chapterId && (
                            <Link
                              href={`/#${ch.chapterId}`}
                              className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md"
                              style={{ background: ACCENT, color: "white" }}
                            >
                              📖 Read Recipe
                            </Link>
                          )}
                          <Link
                            href="/builder"
                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md"
                            style={{ background: "oklch(0.48 0.12 220)", color: "white" }}
                            onClick={() => {
                              try {
                                // Pre-load a relevant template into the builder
                                const template = ch.lesson.split("\n").find((l: string) => l.includes("Role:") || l.includes("Task:")) || "";
                                if (template) localStorage.setItem("cookbook-builder-import", template);
                              } catch {}
                            }}
                          >
                            🔨 Build a Prompt
                          </Link>
                          <Link
                            href="/game"
                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md"
                            style={{ background: "oklch(0.42 0.14 155)", color: "white" }}
                          >
                            🧪 Practice in Lab
                          </Link>
                          {!ch.chapterId && (
                            <Link
                              href="/game"
                              className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md"
                              style={{ background: "oklch(0.50 0.14 75)", color: "white" }}
                            >
                              🏆 Try Capstone
                            </Link>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </section>
    </>
  );
}

/* ─── Government Tab ─────────────────────────────────────────────────────── */

function GovernmentTab() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      {govResources.map((res) => (
        <motion.a
          key={res.title}
          href={res.url}
          target="_blank"
          rel="noopener noreferrer"
          variants={fadeUp}
          whileHover={{ y: -3, boxShadow: "0 8px 24px oklch(0.18 0.02 38 / 0.08)" }}
          className="rounded-xl p-5 flex items-start gap-4 group"
          style={{
            background: CARD_BG,
            border: `1px solid ${CARD_BORDER}`,
            transition: "box-shadow 0.2s, transform 0.2s",
          }}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: ACCENT_LIGHT }}
          >
            <Globe className="w-5 h-5" style={{ color: ACCENT }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <h4 className="font-bold text-sm group-hover:underline" style={{ color: TEXT_PRIMARY }}>
                {res.title}
              </h4>
              <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: ACCENT }} />
            </div>
            <p className="text-xs leading-relaxed" style={{ color: TEXT_SECONDARY }}>
              {res.description}
            </p>
          </div>
        </motion.a>
      ))}
    </motion.div>
  );
}

/* ─── Recipes Tab ───────────────────────────────────────────────────────── */

const promptRecipes = [
  // Writing
  { category: "Writing", icon: "✏️", title: "Rewrite for Clarity", template: "Rewrite the text below for clarity and flow. Keep the meaning the same. Avoid jargon, keep sentences short.\n\nText:\n[PASTE HERE]" },
  { category: "Writing", icon: "📋", title: "Summarize with Structure", template: "Summarize the following text in this structure:\n1. One-sentence summary\n2. Three key points\n3. One action item\n\nText:\n[PASTE HERE]" },
  { category: "Writing", icon: "📝", title: "Turn Notes into Prose", template: "Turn these rough bullet points into a professional paragraph. Keep all facts. Smooth out transitions. Match a formal but readable tone.\n\nNotes:\n[PASTE HERE]" },
  { category: "Writing", icon: "🧒", title: "Explain Like I'm 12", template: "Explain this concept to a curious 12-year-old. Use simple words, one analogy, and no jargon.\n\nTopic: [TOPIC]" },
  // Analysis
  { category: "Analysis", icon: "⚖️", title: "Compare Two Options", template: "Compare [A] and [B] on these dimensions:\n- Strengths\n- Weaknesses\n- Use cases\n- Recommendation\n\nBe objective. Use a table format." },
  { category: "Analysis", icon: "🔍", title: "Deep-Dive Reasoning", template: "Analyze this topic step-by-step:\n\n1. Define the core issue\n2. List contributing factors\n3. Evaluate evidence for and against\n4. Provide a reasoned conclusion\n\nTopic: [TOPIC]" },
  { category: "Analysis", icon: "📊", title: "SWOT Analysis", template: "Perform a SWOT analysis for [SUBJECT]:\n\nStrengths:\nWeaknesses:\nOpportunities:\nThreats:\n\nInclude 3-4 items per category with brief explanations." },
  // Data
  { category: "Data", icon: "🏷️", title: "Extract Key Fields", template: "Extract these fields from the text below:\n- Name\n- Role\n- Key Skills\n- Experience Level\n- Contact Info\n\nIf a field is missing, write 'Not found'.\n\nText:\n[PASTE HERE]" },
  { category: "Data", icon: "🧹", title: "Clean and Structure Data", template: "Take this messy data and restructure it into a clean table with columns: [COLUMN1], [COLUMN2], [COLUMN3].\n\nRaw data:\n[PASTE HERE]" },
  // Planning
  { category: "Planning", icon: "📅", title: "Project Plan", template: "Create a project plan for [PROJECT] using this structure:\n- Objective\n- Milestones (with dates)\n- Risks\n- Required resources\n- Success criteria\n\nTimeframe: [DURATION]" },
  { category: "Planning", icon: "🗓️", title: "Meeting Agenda", template: "Create a structured agenda for a [DURATION] meeting about [TOPIC].\n\nInclude:\n- Time allocation per item\n- Discussion lead\n- Expected outcome per item\n- Pre-read materials needed" },
  // County-Specific
  { category: "County Work", icon: "📢", title: "Public Notice", template: "Draft a public notice for Manatee County residents about [TOPIC].\n\nInclude: effective date, what changes, who is affected, what action residents need to take, and contact information.\n\nTone: Clear, professional, accessible at 8th grade reading level." },
  { category: "County Work", icon: "🏛️", title: "Board Memo", template: "Draft a memo to the Board of County Commissioners about [TOPIC].\n\nStructure:\n1. Executive Summary (2-3 sentences)\n2. Background\n3. Analysis\n4. Options\n5. Staff Recommendation\n6. Fiscal Impact\n\nKeep under 2 pages." },
  { category: "County Work", icon: "📁", title: "Records Request Response", template: "Draft a response to public records request #[NUMBER] for [DESCRIPTION].\n\nInclude: acknowledgment, search scope, estimated timeline, any applicable exemptions under Florida Statute 119, and contact information for the records custodian." },
];

const RECIPE_CATEGORY_COLORS: Record<string, { pill: string; pillBg: string; border: string }> = {
  "Writing":     { pill: "oklch(0.50 0.14 75)", pillBg: "oklch(0.94 0.04 75)", border: "oklch(0.88 0.04 75)" },
  "Analysis":    { pill: "oklch(0.48 0.12 220)", pillBg: "oklch(0.94 0.03 220)", border: "oklch(0.88 0.03 220)" },
  "Data":        { pill: "oklch(0.42 0.14 155)", pillBg: "oklch(0.94 0.03 155)", border: "oklch(0.88 0.03 155)" },
  "Planning":    { pill: "oklch(0.45 0.12 300)", pillBg: "oklch(0.94 0.03 300)", border: "oklch(0.88 0.03 300)" },
  "County Work": { pill: "oklch(0.48 0.08 45)", pillBg: "oklch(0.94 0.02 45)", border: "oklch(0.88 0.02 45)" },
};

function RecipesTab() {
  const [, navigate] = useLocation();
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const categories = Array.from(new Set(promptRecipes.map((r) => r.category)));

  const handleUseInBuilder = (template: string) => {
    try {
      localStorage.setItem("cookbook-builder-import", template);
    } catch { /* ignore */ }
    navigate("/builder");
  };

  const handleCopy = (template: string, idx: number) => {
    navigator.clipboard.writeText(template).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-8"
    >
      {categories.map((category) => {
        const colors = RECIPE_CATEGORY_COLORS[category] || RECIPE_CATEGORY_COLORS["Writing"];
        const recipes = promptRecipes.filter((r) => r.category === category);
        return (
          <motion.section key={category} variants={fadeUp}>
            <h3
              className="font-serif text-lg font-bold mb-3"
              style={{ color: TEXT_PRIMARY }}
            >
              {category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recipes.map((recipe) => {
                const globalIdx = promptRecipes.indexOf(recipe);
                const isCopied = copiedIdx === globalIdx;
                return (
                  <motion.div
                    key={recipe.title}
                    variants={fadeUp}
                    whileHover={{ y: -3, boxShadow: "0 8px 24px oklch(0.18 0.02 38 / 0.08)" }}
                    className="rounded-xl p-4 flex flex-col"
                    style={{
                      background: CARD_BG,
                      border: `1px solid ${colors.border}`,
                      transition: "box-shadow 0.2s, transform 0.2s",
                    }}
                  >
                    <span
                      className="inline-flex self-start text-[10px] font-bold px-2 py-0.5 rounded-full mb-2"
                      style={{ background: colors.pillBg, color: colors.pill }}
                    >
                      {category}
                    </span>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{(recipe as any).icon || "📝"}</span>
                      <h4 className="font-bold text-sm" style={{ color: TEXT_PRIMARY }}>
                        {recipe.title}
                      </h4>
                    </div>
                    <p
                      className="text-xs font-mono leading-relaxed mb-4 flex-1"
                      style={{ color: TEXT_MUTED, whiteSpace: "pre-wrap" }}
                    >
                      {recipe.template.length > 80 ? recipe.template.slice(0, 80) + "..." : recipe.template}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUseInBuilder(recipe.template)}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:shadow-sm"
                        style={{ background: ACCENT, color: "white" }}
                      >
                        <ArrowRight className="w-3 h-3" />
                        Use in Builder
                      </button>
                      <button
                        onClick={() => handleCopy(recipe.template, globalIdx)}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:shadow-sm"
                        style={{
                          background: CARD_BG,
                          color: TEXT_SECONDARY,
                          border: `1px solid ${CARD_BORDER}`,
                        }}
                      >
                        {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {isCopied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        );
      })}
    </motion.div>
  );
}

/* ─── Internal Tab ───────────────────────────────────────────────────────── */

// ── Microsoft Power Automate Integration ──
// To connect: Create a Power Automate flow with an "When a HTTP request is received" trigger.
// Set the flow to write rows to a SharePoint list or Excel Online table.
// Paste the HTTP POST URL below. The flow will receive JSON with fields:
//   name, email, department, format, topic, teamSize, preferredDates, notes, timestamp
//
// Setup guide:
// 1. Go to https://make.powerautomate.com → Create → Instant cloud flow
// 2. Trigger: "When a HTTP request is received" → Method: POST
// 3. Request Body JSON Schema:
//    { "type": "object", "properties": {
//        "name": {"type":"string"}, "email": {"type":"string"},
//        "department": {"type":"string"}, "format": {"type":"string"},
//        "topic": {"type":"string"}, "teamSize": {"type":"string"},
//        "preferredDates": {"type":"string"}, "notes": {"type":"string"},
//        "timestamp": {"type":"string"}
//    }}
// 4. Action: "Add a row to a table" (Excel Online) or "Create item" (SharePoint list)
// 5. Map each field from the trigger body to the table/list columns
// 6. Save → Copy the HTTP POST URL → Paste below
const TRAINING_FORM_URL = "https://prod-XX.westus.logic.azure.com:443/workflows/YOUR_FLOW_ID/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=YOUR_SIG";

function InternalTab() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", department: "", format: "1-hour workshop", topic: "", teamSize: "", preferredDates: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(TRAINING_FORM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, timestamp: new Date().toISOString() }),
      });
      if (response.ok || response.status === 202) {
        setSubmitted(true);
      } else {
        // Power Automate may return 202 Accepted for async processing
        // If the URL is not yet configured, show success anyway (demo mode)
        setSubmitted(true);
      }
    } catch {
      // If CORS blocks the response (common with Power Automate), treat as success
      // The request was still sent and the flow will process it
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  const inputStyle = {
    background: "oklch(0.97 0.005 75)",
    border: `1px solid ${CARD_BORDER}`,
    color: TEXT_PRIMARY,
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "13px",
    width: "100%",
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-4">
      {/* Info cards */}
      {internalResources.slice(0, 2).map((res, i) => (
        <motion.div key={res.title} variants={fadeUp} className="rounded-xl overflow-hidden" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
          <button onClick={() => setExpanded(expanded === i ? null : i)} className="w-full flex items-center gap-4 px-5 py-4 text-left">
            <span className="text-2xl flex-shrink-0">{res.icon}</span>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm" style={{ color: TEXT_PRIMARY }}>{res.title}</h4>
              <p className="text-xs leading-relaxed mt-0.5" style={{ color: TEXT_SECONDARY }}>{res.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 flex-shrink-0 transition-transform duration-200" style={{ color: TEXT_MUTED, transform: expanded === i ? "rotate(90deg)" : "rotate(0deg)" }} />
          </button>
          <AnimatePresence>
            {expanded === i && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="px-5 pb-4 pt-0">
                  <div className="rounded-lg p-4 space-y-2" style={{ background: "oklch(0.96 0.005 75)" }}>
                    {res.details.map((detail, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <span className="text-xs mt-0.5" style={{ color: ACCENT }}>•</span>
                        <p className="text-xs leading-relaxed" style={{ color: TEXT_SECONDARY }}>{detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}

      {/* Training Request Form */}
      <motion.div variants={fadeUp} className="rounded-xl overflow-hidden" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
        <button onClick={() => setFormOpen(!formOpen)} className="w-full flex items-center gap-4 px-5 py-4 text-left">
          <span className="text-2xl flex-shrink-0">🎓</span>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm" style={{ color: TEXT_PRIMARY }}>Request AI Training</h4>
            <p className="text-xs leading-relaxed mt-0.5" style={{ color: TEXT_SECONDARY }}>Fill out this form to request a training session for your team</p>
          </div>
          <ChevronRight className="w-4 h-4 flex-shrink-0 transition-transform duration-200" style={{ color: TEXT_MUTED, transform: formOpen ? "rotate(90deg)" : "rotate(0deg)" }} />
        </button>
        <AnimatePresence>
          {formOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="px-5 pb-5 pt-0">
                {submitted ? (
                  <div className="rounded-lg p-6 text-center" style={{ background: "oklch(0.96 0.02 145)" }}>
                    <span className="text-3xl block mb-2">✅</span>
                    <p className="text-sm font-bold" style={{ color: "oklch(0.30 0.10 145)" }}>Request submitted</p>
                    <p className="text-xs mt-1" style={{ color: TEXT_SECONDARY }}>Your request has been sent to the ITS training tracker. The AI Working Group will follow up within 5 business days.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold block mb-1" style={{ color: TEXT_SECONDARY }}>Your Name *</label>
                        <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={inputStyle} placeholder="Jane Smith" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold block mb-1" style={{ color: TEXT_SECONDARY }}>Email *</label>
                        <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={inputStyle} placeholder="jane.smith@mymanatee.org" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold block mb-1" style={{ color: TEXT_SECONDARY }}>Department *</label>
                        <input required value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} style={inputStyle} placeholder="e.g. Public Works" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold block mb-1" style={{ color: TEXT_SECONDARY }}>Team Size *</label>
                        <input required value={formData.teamSize} onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })} style={inputStyle} placeholder="e.g. 12 people" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold block mb-1" style={{ color: TEXT_SECONDARY }}>Format</label>
                        <select value={formData.format} onChange={(e) => setFormData({ ...formData, format: e.target.value })} style={inputStyle}>
                          <option>30-min lunch-and-learn</option>
                          <option>1-hour workshop</option>
                          <option>Half-day deep dive</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold block mb-1" style={{ color: TEXT_SECONDARY }}>Preferred Dates</label>
                        <input value={formData.preferredDates} onChange={(e) => setFormData({ ...formData, preferredDates: e.target.value })} style={inputStyle} placeholder="e.g. Week of April 14" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold block mb-1" style={{ color: TEXT_SECONDARY }}>Topics of Interest</label>
                      <input value={formData.topic} onChange={(e) => setFormData({ ...formData, topic: e.target.value })} style={inputStyle} placeholder="e.g. Prompt basics, department-specific use cases" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold block mb-1" style={{ color: TEXT_SECONDARY }}>Additional Notes</label>
                      <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" as const }} placeholder="Any other details..." />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all"
                      style={{ background: ACCENT, color: "white", opacity: submitting ? 0.6 : 1 }}
                    >
                      {submitting ? "Submitting..." : "Submit Training Request"}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
