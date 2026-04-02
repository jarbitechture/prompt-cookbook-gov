export type QuestionType = "multiple-choice" | "prompt-fix" | "fill-the-recipe" | "scenario-match";

export interface TasteTestQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string | number; // index for multiple-choice, string for others
  explanation: string;
}

export interface TasteTest {
  id: string;
  title: string;
  description: string;
  requiredParts: string[]; // parts this test covers
  questions: TasteTestQuestion[];
  passingScore: number; // out of questions.length
}

export const tierLabels = ["Starter", "Home Cook", "Sous Chef", "Head Chef", "Executive Chef"];

export const tasteTests: TasteTest[] = [
  // ── Test 1: Foundation Taste Test (Part I) ──────────────
  {
    id: "tt-basics",
    title: "Foundation Taste Test",
    description: "Test your understanding of prompt fundamentals and safety rules for county staff.",
    requiredParts: ["part1"],
    passingScore: 3,
    questions: [
      {
        id: "tt-basics-q1",
        type: "multiple-choice",
        question: "What is the primary reason Manatee County requires staff to review all AI-generated content before using it?",
        options: [
          "AI tools are too expensive to use without review",
          "AI can produce plausible-sounding but inaccurate information (hallucinations)",
          "The IT department needs to track all AI usage",
          "AI-generated content always violates copyright law",
        ],
        correctAnswer: 1,
        explanation:
          "AI models can generate text that reads well but contains factual errors, fabricated citations, or misleading information. Human review catches these hallucinations before they reach the public.",
      },
      {
        id: "tt-basics-q2",
        type: "multiple-choice",
        question: "Which of the following should NEVER be included in an AI prompt when using a public AI tool?",
        options: [
          "The name of your department",
          "A request to summarize a public meeting agenda",
          "A resident's Social Security number or home address",
          "A question about county policy language",
        ],
        correctAnswer: 2,
        explanation:
          "Personally identifiable information (PII) like Social Security numbers and home addresses must never be entered into public AI tools. County policy, department names, and public documents are acceptable.",
      },
      {
        id: "tt-basics-q3",
        type: "prompt-fix",
        question:
          "This prompt is too vague: \"Write something about our new policy.\" Rewrite it so the AI knows the audience, format, and topic.",
        correctAnswer: "audience",
        explanation:
          "A strong prompt specifies the audience (e.g., county employees), format (e.g., one-page memo), and topic (e.g., the updated telework policy). Any rewrite that includes these three elements passes.",
      },
      {
        id: "tt-basics-q4",
        type: "scenario-match",
        question:
          "A Parks & Recreation coordinator wants AI to draft social media posts about an upcoming beach cleanup event. Which risk tier does this use case fall into?",
        options: [
          "Red — requires legal review and CISO approval",
          "Yellow — departmental review needed before publication",
          "Green — low-risk, public information only",
          "This use case is prohibited under county policy",
        ],
        correctAnswer: 2,
        explanation:
          "Drafting social media about a public event uses only public information and produces external-facing content that can be reviewed before posting. This is a Green-tier (low risk) use case.",
      },
    ],
  },

  // ── Test 2: Template Taste Test (Part II) ──────────────
  {
    id: "tt-templates",
    title: "Template Taste Test",
    description: "Prove your ability to use and customize production-ready prompt templates.",
    requiredParts: ["part2"],
    passingScore: 4,
    questions: [
      {
        id: "tt-templates-q1",
        type: "multiple-choice",
        question: "What is the main advantage of using a prompt template instead of writing prompts from scratch each time?",
        options: [
          "Templates make AI responses longer",
          "Templates ensure consistency, reduce errors, and save time across departments",
          "Templates bypass the need for human review",
          "Templates are required by Florida state law",
        ],
        correctAnswer: 1,
        explanation:
          "Templates standardize the structure and quality of prompts across the organization, reducing variability and the chance of missing key instructions like role, format, or constraints.",
      },
      {
        id: "tt-templates-q2",
        type: "multiple-choice",
        question: "In a role-based prompt template, what does the 'Role' field accomplish?",
        options: [
          "It assigns a job title to the user",
          "It tells the AI what persona or expertise to adopt when generating the response",
          "It logs who submitted the prompt for auditing",
          "It restricts the AI to only answer questions from that role",
        ],
        correctAnswer: 1,
        explanation:
          "Setting a role (e.g., 'You are an experienced public communications specialist for a county government') steers the AI's tone, vocabulary, and framing to match the expected output.",
      },
      {
        id: "tt-templates-q3",
        type: "fill-the-recipe",
        question:
          "Complete this template variable: 'Summarize the following [DOCUMENT_TYPE] for an audience of _____ in no more than 3 paragraphs.' What should fill the blank?",
        correctAnswer: "county staff",
        explanation:
          "Specifying the target audience (e.g., 'county staff', 'department directors', 'residents') is a key template variable that controls reading level and jargon in the output.",
      },
      {
        id: "tt-templates-q4",
        type: "fill-the-recipe",
        question:
          "A prompt template includes: 'Format the output as a _____.' Name one structured format that would help a county analyst quickly scan AI output.",
        correctAnswer: "table",
        explanation:
          "Structured formats like tables, numbered lists, or bullet points make AI output scannable. 'Table', 'bulleted list', 'numbered list', or 'markdown table' are all valid.",
      },
      {
        id: "tt-templates-q5",
        type: "prompt-fix",
        question:
          "This template is missing constraints: 'You are a county HR assistant. Answer the employee's question about benefits.' Add at least one constraint to make it safer.",
        correctAnswer: "only",
        explanation:
          "Adding constraints like 'Only reference official Manatee County benefits documents', 'Do not provide legal advice', or 'If unsure, direct the employee to HR' prevents the AI from overstepping its scope.",
      },
    ],
  },

  // ── Test 3: Strategy Taste Test (Part III) ──────────────
  {
    id: "tt-strategy",
    title: "Strategy Taste Test",
    description: "Apply risk-tiered thinking and efficiency strategies to real county scenarios.",
    requiredParts: ["part3"],
    passingScore: 3,
    questions: [
      {
        id: "tt-strategy-q1",
        type: "scenario-match",
        question:
          "The County Attorney's office wants to use AI to summarize 200 pages of contract language and flag non-standard clauses. Which risk tier applies?",
        options: [
          "Green — routine summarization task",
          "Yellow — contains sensitive but non-PII business data",
          "Red — involves legally binding documents that require expert review",
          "This use case is prohibited",
        ],
        correctAnswer: 2,
        explanation:
          "Contract analysis involves legally significant content where AI errors could have financial or legal consequences. This is Red-tier: it requires legal review, CISO awareness, and human verification of every flagged clause.",
      },
      {
        id: "tt-strategy-q2",
        type: "scenario-match",
        question:
          "A Building Services supervisor wants to use AI to generate a weekly safety checklist for facility inspectors. Which risk tier applies?",
        options: [
          "Green — internal operational content with no PII",
          "Yellow — could affect public safety if errors are not caught",
          "Red — requires executive approval",
          "This is not an appropriate use of AI",
        ],
        correctAnswer: 0,
        explanation:
          "A safety checklist using standard inspection criteria and internal procedures is Green-tier. The content is operational, contains no PII, and the supervisor reviews it before distribution.",
      },
      {
        id: "tt-strategy-q3",
        type: "multiple-choice",
        question: "What is the recommended first step when a department wants to adopt AI for a new workflow?",
        options: [
          "Purchase an enterprise AI license immediately",
          "Start a pilot with a low-risk (Green-tier) use case and measure results",
          "Have every staff member begin using AI the same day",
          "Wait for the state legislature to pass AI regulations",
        ],
        correctAnswer: 1,
        explanation:
          "Starting with a low-risk pilot allows the department to learn prompt patterns, establish review workflows, and measure time savings before scaling to higher-risk use cases.",
      },
      {
        id: "tt-strategy-q4",
        type: "prompt-fix",
        question:
          "A staff member's prompt says: 'Analyze this resident complaint and decide what action to take.' What is wrong with this prompt, and how should it be reworded?",
        correctAnswer: "recommend",
        explanation:
          "AI should never 'decide' actions that affect residents. The prompt should ask the AI to 'summarize the complaint and recommend possible next steps for staff review.' The human makes the decision.",
      },
    ],
  },

  // ── Test 4: Governance Taste Test (Part IV) ──────────────
  {
    id: "tt-governance",
    title: "Governance Taste Test",
    description: "Demonstrate your knowledge of AI scoring, auditing, training, and future readiness.",
    requiredParts: ["part4"],
    passingScore: 3,
    questions: [
      {
        id: "tt-governance-q1",
        type: "multiple-choice",
        question: "What is the purpose of a quality score on an AI-generated output?",
        options: [
          "To rank employees by their AI skill level",
          "To provide a repeatable measure of accuracy, relevance, and safety for audit trails",
          "To determine which AI vendor to purchase",
          "To automatically publish content that scores above 80%",
        ],
        correctAnswer: 1,
        explanation:
          "Quality scores give departments a consistent way to evaluate AI outputs over time, support audit requirements, and identify which prompt templates produce the most reliable results.",
      },
      {
        id: "tt-governance-q2",
        type: "multiple-choice",
        question: "Who is responsible for the final accuracy of AI-generated content used in official county communications?",
        options: [
          "The AI vendor",
          "The IT department",
          "The staff member who prompted the AI and their supervisor",
          "The AI Working Group",
        ],
        correctAnswer: 2,
        explanation:
          "Under county policy, the human who uses the AI output bears responsibility for verifying its accuracy. Their supervisor shares accountability for content published under department authority.",
      },
      {
        id: "tt-governance-q3",
        type: "fill-the-recipe",
        question:
          "An AI audit log should capture at minimum: the prompt used, the output generated, the reviewer's name, and _____. What is the fourth element?",
        correctAnswer: "date",
        explanation:
          "A complete audit log includes the date/timestamp of the interaction. This enables traceability, supports public records requests, and helps identify when outdated AI outputs need updating.",
      },
      {
        id: "tt-governance-q4",
        type: "scenario-match",
        question:
          "The AI Working Group is planning quarterly training sessions. Which approach will produce the most lasting behavior change among county staff?",
        options: [
          "A single 4-hour lecture covering all AI policies",
          "Hands-on workshops where staff practice prompting with real department scenarios",
          "Sending a PDF of the prompt cookbook to all employees via email",
          "Requiring staff to pass a certification exam before using any AI tool",
        ],
        correctAnswer: 1,
        explanation:
          "Hands-on practice with real scenarios builds muscle memory and confidence. Research on adult learning shows that interactive, contextual training produces stronger retention than passive content delivery.",
      },
    ],
  },
];
