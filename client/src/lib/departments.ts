// ═══════════════════════════════════════════════════════════════════════════
// Manatee County Department/Service Hierarchy
// 7 top-level categories → sub-categories → leaf services
// ═══════════════════════════════════════════════════════════════════════════

export interface LeafService {
  name: string; // verb-first: "Pay...", "Report...", "Apply..."
  description: string;
}

export interface SubCategory {
  name: string;
  services: LeafService[];
}

export interface DeptPersonalization {
  /** Hero section greeting when department is active */
  heroGreeting: string;
  /** 3 recommended starter chapter IDs */
  starterChapters: string[];
  /** Department-specific prompt of the week */
  promptOfTheWeek: {
    title: string;
    description: string;
    template: string;
    technique: string;
  };
  /** Tailored quick action card descriptions */
  quickActions: {
    lab: string;
    builder: string;
    resources: string;
  };
  /** Default builder template text */
  builderTemplate: string;
  /** Chatbot system prompt addition */
  chatbotContext: string;
  /** Recipe category most relevant to this department */
  recommendedRecipeCategories: string[];
}

export interface Department {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string; // oklch accent
  subCategories: SubCategory[];
  /** Chapter IDs most relevant to this department */
  relevantChapters: string[];
  /** Prompt case studies specific to this department */
  caseStudies: CaseStudy[];
  /** Per-touchpoint personalization content */
  personalization: DeptPersonalization;
}

export interface CaseStudy {
  title: string;
  scenario: string;
  weakPrompt: string;
  strongPrompt: string;
  technique: string;
}

export const departments: Department[] = [
  {
    id: "resident-services",
    name: "Resident Services",
    icon: "🏠",
    description: "Day-to-day services for residents — utilities, trash, library, 311",
    color: "oklch(0.48 0.14 220)",
    subCategories: [
      {
        name: "Core Services",
        services: [
          { name: "Pay Your Utility Bill", description: "Water, sewer, and stormwater billing" },
          { name: "Report Missed Garbage Pickup", description: "Trash or recycling not collected" },
          { name: "Request Big Bin Pickup", description: "Large item or yard waste collection" },
          { name: "Get a Beach Parking Permit", description: "Annual or daily beach access permits" },
          { name: "File a Manatee 311 Report", description: "General county service requests" },
          { name: "Report a Road or Traffic Issue", description: "Potholes, signals, signs" },
        ],
      },
      {
        name: "Engagement & Information",
        services: [
          { name: "Watch a Meeting Livestream", description: "Board and commission meetings" },
          { name: "View Meeting Agendas", description: "Upcoming meeting documents" },
          { name: "Sign Up for County Alerts", description: "Emergency and service notifications" },
          { name: "Access Transparency Portals", description: "Budget, spending, performance data" },
        ],
      },
      {
        name: "Library & Leisure",
        services: [
          { name: "Get a Library Card", description: "Access to all county libraries" },
          { name: "Reserve a Library Room", description: "Meeting and study space" },
          { name: "Register for Library Programs", description: "Classes, workshops, events" },
        ],
      },
      {
        name: "Natural Resources",
        services: [
          { name: "Report Environmental Concern", description: "Pollution, erosion, or habitat issues" },
          { name: "Learn About Conservation Lands", description: "County-managed preserves and natural areas" },
          { name: "View Water Quality Reports", description: "Surface water and watershed monitoring data" },
        ],
      },
    ],
    relevantChapters: ["ch01", "ch02", "ch03", "ch04", "ch05", "ch08", "ch14"],
    caseStudies: [
      {
        title: "Utility Billing Inquiry Response",
        scenario: "A resident emails asking why their water bill doubled this month.",
        weakPrompt: "Help me respond to a billing complaint",
        strongPrompt: "You are a Manatee County Utilities customer service representative. A resident on Cortez Road reports their water bill went from $45 to $92 this month. Draft a response that: acknowledges their concern, lists the 3 most common causes (seasonal irrigation, leak, meter read timing), offers to schedule a meter check, and provides the direct phone number for billing disputes. Professional but empathetic tone, under 200 words.",
        technique: "Persona + Specificity",
      },
      {
        title: "Missed Pickup Follow-Up",
        scenario: "Recycling was not collected on Oak Street for the second week in a row.",
        weakPrompt: "Write about the recycling problem",
        strongPrompt: "Act as a county solid waste coordinator. A resident on Oak Street reports recycling missed for 2 consecutive weeks. Draft an email that: apologizes for the inconvenience, explains the route adjustment that caused the issue, confirms a special pickup is scheduled for Thursday, and provides the direct contact for future missed pickups. Keep under 150 words, empathetic but factual.",
        technique: "Persona + Negative Constraints",
      },
      {
        title: "Library Program Announcement",
        scenario: "The library is launching a new digital literacy program for seniors.",
        weakPrompt: "Write about the new library program",
        strongPrompt: "You are a Manatee County library communications specialist. Write a 150-word announcement for the new 'Tech for Seniors' program: 4 weekly sessions, Tuesdays at 2 PM, Central Library, covers smartphone basics, email, and video calls. Include registration link placeholder [URL], who to contact (Reference Desk, 941-748-5555), and note that devices are provided. Warm, encouraging tone targeting adults 65+. Do not use jargon or assume any prior tech knowledge.",
        technique: "RTCO Framework",
      },
    ],
    personalization: {
      heroGreeting: "Better prompts mean faster responses to residents, clearer public notices, and fewer back-and-forth emails. Master the techniques that help you serve Manatee County residents more effectively.",
      starterChapters: ["ch01", "ch02", "ch03"],
      promptOfTheWeek: {
        title: "311 Response Drafting",
        description: "Generate a professional response to a common 311 service request using persona and tone constraints.",
        template: "Role: You are a Manatee County 311 customer service representative.\nTask: A resident has submitted a 311 request about [ISSUE TYPE, e.g., missed trash pickup, streetlight outage, noise complaint]. Their tone is [frustrated/neutral/appreciative].\nConstraints: Under 150 words, empathetic but factual, include reference number [REF#], provide direct contact number 941-748-4501, and set a realistic timeline for resolution.\nOutput: A professional email response ready to send.",
        technique: "RTCO Framework",
      },
      quickActions: {
        lab: "Practice drafting resident responses, public notices, and library announcements with instant feedback.",
        builder: "Build prompts for utility billing replies, 311 responses, and community event announcements.",
        resources: "Templates and examples for resident-facing communications, FAQ responses, and service notifications.",
      },
      builderTemplate: "Role: You are a Manatee County [Utilities/Library/311] staff member.\nTask: Draft a [response/notice/announcement] regarding [SPECIFIC SITUATION].\nConstraints: Professional and empathetic tone, under [WORD COUNT] words, include contact number and next steps. Reading level appropriate for general public.\nOutput: Ready-to-send [email/notice/post].",
      chatbotContext: "Resident Services covers Manatee County's direct-to-public operations: utility billing (water, sewer, stormwater), solid waste and recycling collection, the public library system, beach parking permits, and the 311 service request system. Staff regularly draft billing explanations, service disruption notices, event announcements, and responses to resident complaints. Common tools include the 311 system, utility billing portal, and library management software.",
      recommendedRecipeCategories: ["Writing", "County Work", "Planning"],
    },
  },
  {
    id: "infrastructure-safety",
    name: "Infrastructure, Safety & Environment",
    icon: "🏗️",
    description: "Roads, public safety, emergency management, transit",
    color: "oklch(0.45 0.14 155)",
    subCategories: [
      {
        name: "Accessibility & Mobility",
        services: [
          { name: "Plan a Transit Trip", description: "MCAT bus routes and schedules" },
          { name: "Request Accessibility Accommodation", description: "ADA compliance requests" },
        ],
      },
      {
        name: "Roads & Traffic",
        services: [
          { name: "Report a Pothole", description: "Road surface damage" },
          { name: "Request a Traffic Study", description: "Speed, volume, or signal analysis" },
          { name: "View Capital Projects", description: "Road and bridge construction updates" },
          { name: "Report a Signal Issue", description: "Broken or malfunctioning traffic signals" },
        ],
      },
      {
        name: "Trash & Recycling Operations",
        services: [
          { name: "View Collection Schedule", description: "Regular and holiday pickup dates" },
          { name: "Request Special Collection", description: "Hazardous waste, electronics" },
          { name: "Learn About Recycling", description: "What goes where, contamination rules" },
        ],
      },
      {
        name: "Public Safety & Emergencies",
        services: [
          { name: "View Hurricane Evacuation Info", description: "Zones, routes, shelters" },
          { name: "Sign Up for Emergency Alerts", description: "AlertManatee notifications" },
          { name: "Check Fire Ban Status", description: "Current burn restrictions" },
          { name: "Access Preparedness Resources", description: "Checklists and supply guides" },
        ],
      },
      {
        name: "Public Safety",
        services: [
          { name: "Report a Fire Hazard", description: "Vegetation, structural, or wildfire risks" },
          { name: "Request Emergency Management Info", description: "Disaster planning and preparedness resources" },
          { name: "View Hurricane Preparedness Guide", description: "Seasonal storm readiness checklists" },
        ],
      },
    ],
    relevantChapters: ["ch01", "ch02", "ch04", "ch14", "ch15", "ch23", "ch25"],
    caseStudies: [
      {
        title: "Emergency Alert Draft",
        scenario: "Tropical storm warning issued, shelters opening tomorrow morning.",
        weakPrompt: "Write an emergency alert",
        strongPrompt: "You are the Manatee County Emergency Management public information officer. A tropical storm warning is in effect. Draft 3 communications: (1) A 280-character AlertManatee text message with shelter locations and when they open, (2) A 500-word website update with preparation checklist, evacuation zones, and pet-friendly shelter list, (3) A 100-word social media post for Facebook. All must include the Emergency Hotline: 941-749-3500. Tone: urgent but calm, factual, no speculation about storm intensity.",
        technique: "Format + Structure",
      },
      {
        title: "Pothole Repair Status Update",
        scenario: "Resident reported a pothole 10 days ago, asking for status.",
        weakPrompt: "Respond about the pothole",
        strongPrompt: "Act as a Manatee County road maintenance supervisor. A resident reported pothole #RD-2026-4421 on Manatee Avenue 10 days ago. Status: crew scheduled for next Wednesday. Draft a response that: confirms receipt with the reference number, explains the prioritization process (safety hazards first, then high-traffic, then residential), gives the specific repair date, and provides the 311 number for future reports. Professional, under 150 words.",
        technique: "Persona + Specificity",
      },
    ],
    personalization: {
      heroGreeting: "From emergency alerts to road project updates, clear communication saves lives and keeps infrastructure running. Learn prompt techniques that help you write faster, more accurate public safety communications.",
      starterChapters: ["ch01", "ch02", "ch04"],
      promptOfTheWeek: {
        title: "Multi-Format Emergency Communication",
        description: "Draft emergency notifications across multiple channels simultaneously with consistent messaging.",
        template: "Role: You are the Manatee County Emergency Management public information officer.\nTask: A [EVENT TYPE, e.g., tropical storm warning, boil water notice, road closure] is in effect for [AREA]. Draft communications for 3 channels: (1) AlertManatee text message under 280 characters, (2) Website update of 300-500 words with actionable steps, (3) Social media post under 150 words.\nConstraints: All must include the Emergency Hotline 941-749-3500. Urgent but calm tone. No speculation. Include specific dates, times, and locations.\nOutput: Three formatted messages ready for distribution.",
        technique: "Format + Structure",
      },
      quickActions: {
        lab: "Practice writing emergency alerts, capital project updates, and transit service change notices.",
        builder: "Build prompts for road closure notifications, hurricane prep guides, and fleet maintenance reports.",
        resources: "Templates for emergency communications, project status updates, and public safety advisories.",
      },
      builderTemplate: "Role: You are a Manatee County [Emergency Management/Public Works/Transit] staff member.\nTask: Draft a [alert/update/report] about [SPECIFIC INFRASTRUCTURE OR SAFETY EVENT].\nConstraints: Include Emergency Hotline 941-749-3500 if safety-related. Factual, no speculation. Specify affected areas, timeline, and alternative routes or actions residents should take.\nOutput: [AlertManatee text / website post / internal report] ready for review.",
      chatbotContext: "Infrastructure & Safety covers Manatee County's roads and bridges, traffic signals, MCAT public transit, solid waste operations, fleet management, and Emergency Management. Staff write emergency alerts (hurricane, flood, boil water), capital project status reports, traffic advisories, collection schedule changes, and inter-departmental maintenance coordination. They use AlertManatee, the 311 system, and capital project tracking tools daily.",
      recommendedRecipeCategories: ["Writing", "Planning", "County Work"],
    },
  },
  {
    id: "development-building",
    name: "Development, Building & Business",
    icon: "🏢",
    description: "Permits, inspections, procurement, GIS, land use",
    color: "oklch(0.50 0.14 75)",
    subCategories: [
      {
        name: "Building & Land Development",
        services: [
          { name: "Apply for a Building Permit", description: "New construction or renovation" },
          { name: "Schedule an Inspection", description: "Building, electrical, plumbing" },
          { name: "Check Zoning Requirements", description: "Land use and development codes" },
          { name: "Calculate Impact Fees", description: "Transportation, parks, utilities" },
          { name: "Access Accela Online Services", description: "Permit portal" },
        ],
      },
      {
        name: "Business with the County",
        services: [
          { name: "Submit a Bid", description: "Procurement and RFP responses" },
          { name: "Register as a Vendor", description: "County supplier database" },
          { name: "View Surplus Property", description: "County assets for sale" },
          { name: "Apply for Grants", description: "Community and economic development funding" },
        ],
      },
      {
        name: "Maps & Geo-Data",
        services: [
          { name: "Search Property Records", description: "Ownership, value, history" },
          { name: "View GIS Maps", description: "Interactive county mapping" },
          { name: "Download Spatial Data", description: "Shapefiles and geodatabases" },
          { name: "Check Flood Zone Maps", description: "FEMA flood hazard zones" },
        ],
      },
      {
        name: "Neighborhood Services",
        services: [
          { name: "Report Code Violation", description: "Property maintenance or zoning violations" },
          { name: "Apply for Housing Assistance", description: "Affordable housing and rehabilitation programs" },
          { name: "Request Neighborhood Improvement", description: "Streetscaping, lighting, and community enhancements" },
        ],
      },
    ],
    relevantChapters: ["ch01", "ch02", "ch05", "ch06", "ch09", "ch15", "ch24"],
    caseStudies: [
      {
        title: "Permit Application Response",
        scenario: "A contractor asks why their permit was flagged for additional review.",
        weakPrompt: "Explain the permit issue",
        strongPrompt: "You are a Manatee County planning analyst. Permit application #BLD-2026-0847 for a commercial renovation at 123 Main St was flagged because the proposed use change from retail to restaurant requires a conditional use approval under LDC Section 7.3.4. Draft a letter to the applicant that: explains the specific code requirement, lists the 3 documents needed for conditional use (site plan, traffic study, parking analysis), provides the timeline (45-60 days for review), and offers a pre-application conference. Professional tone, reference applicable code sections.",
        technique: "Chain-of-Thought",
      },
      {
        title: "Bid Summary for Leadership",
        scenario: "Three vendors submitted bids for the new records management system.",
        weakPrompt: "Summarize the bids",
        strongPrompt: "Think step by step: We received 3 bids for RFP-IT-2026-012 (Records Management System). Step 1: Create a comparison table with columns for vendor name, total cost, implementation timeline, key features, references, and compliance with requirements. Step 2: Score each vendor against the 5 evaluation criteria in the RFP (cost 30%, features 25%, experience 20%, timeline 15%, support 10%). Step 3: Identify the top-ranked vendor and any concerns. Step 4: Write a 1-paragraph executive recommendation for the County Administrator.",
        technique: "Chain-of-Thought",
      },
    ],
    personalization: {
      heroGreeting: "Permits, zoning letters, and bid evaluations require precision and code references. Good prompts help you draft accurate, legally sound documents faster and reduce revision cycles.",
      starterChapters: ["ch01", "ch02", "ch05"],
      promptOfTheWeek: {
        title: "Permit Status Explanation Letter",
        description: "Draft a clear letter explaining why a permit application requires additional review, with specific code references.",
        template: "Role: You are a Manatee County planning analyst.\nTask: Permit application #[PERMIT NUMBER] for [PROJECT TYPE] at [ADDRESS] has been [flagged/denied/held] because [REASON, e.g., conditional use required, setback variance needed, incomplete submittal].\nConstraints: Reference the specific Land Development Code section. List all required documents with deadlines. Provide the pre-application conference option and contact info. Professional tone, under 300 words.\nOutput: A formal letter to the applicant ready for supervisor review.",
        technique: "Chain-of-Thought",
      },
      quickActions: {
        lab: "Practice writing permit explanations, zoning analysis summaries, and procurement evaluation memos.",
        builder: "Build prompts for code enforcement notices, bid comparison tables, and GIS data summaries.",
        resources: "Templates for permit correspondence, RFP evaluations, and development review checklists.",
      },
      builderTemplate: "Role: You are a Manatee County [Building/Planning/Procurement] specialist.\nTask: Draft a [letter/memo/evaluation] regarding [PERMIT #, BID #, or ZONING CASE].\nConstraints: Reference applicable code sections (LDC, Florida Statutes, county ordinances). Include specific deadlines, required documents, and next steps. Formal tone appropriate for official correspondence.\nOutput: [Letter/memo/table] formatted for county letterhead.",
      chatbotContext: "Development & Building handles Manatee County's building permits, land development review, zoning and code enforcement, impact fee calculations, procurement (bids and RFPs), vendor management, and GIS/property records. Staff draft permit status letters, code violation notices, bid evaluation summaries, conditional use analyses, and inter-agency coordination memos. They reference the Land Development Code, Florida Building Code, and county procurement ordinances daily.",
      recommendedRecipeCategories: ["Analysis", "Writing", "Data"],
    },
  },
  {
    id: "human-services",
    name: "Human Services, Community & Veterans",
    icon: "🤝",
    description: "Social support, aging services, animal services, veterans",
    color: "oklch(0.50 0.14 25)",
    subCategories: [
      {
        name: "Adult & Aging Services",
        services: [
          { name: "Get Ambulance Bill Pay Assistance", description: "Financial hardship programs" },
          { name: "Access Prescription Assistance", description: "Medication cost help" },
          { name: "Find Senior Support Services", description: "Meals, transport, activities" },
          { name: "Get Aging Agency Referrals", description: "Area Agency on Aging" },
        ],
      },
      {
        name: "Community Assistance",
        services: [
          { name: "Apply for Utility Assistance", description: "Help with water/power bills" },
          { name: "Find Rent Assistance", description: "Emergency housing help" },
          { name: "Access Food Resources", description: "Food banks and pantries" },
          { name: "Get Hospital Bill Help", description: "Medical debt assistance" },
          { name: "Find Homelessness Resources", description: "Shelters, case management" },
        ],
      },
      {
        name: "Pets & Animals",
        services: [
          { name: "Adopt a Pet", description: "Dogs, cats, and other animals" },
          { name: "Report a Lost or Found Pet", description: "Missing animal database" },
          { name: "File a Nuisance Animal Complaint", description: "Noise, roaming, aggression" },
          { name: "License Your Pet", description: "Annual registration" },
        ],
      },
      {
        name: "Veterans & Special Populations",
        services: [
          { name: "Access Veterans Services", description: "Benefits, advocacy, support" },
          { name: "Get Disability Support", description: "Accommodations and resources" },
          { name: "Find Legal Aid Resources", description: "Pro bono and low-cost legal help" },
        ],
      },
    ],
    relevantChapters: ["ch01", "ch02", "ch03", "ch05", "ch14", "ch25", "ch27"],
    caseStudies: [
      {
        title: "Assistance Program Communication",
        scenario: "Notifying a family they've been approved for utility assistance.",
        weakPrompt: "Write a letter about utility assistance",
        strongPrompt: "You are a Manatee County Human Services case worker. A family of 4 has been approved for the Emergency Utility Assistance Program covering up to $500 toward their water bill. Draft an approval letter that: congratulates them, states the approved amount and which bills it covers, explains next steps (funds sent directly to Utilities within 10 business days), lists any conditions (must maintain active account, reapply after 12 months), and provides your direct contact for questions. Warm but professional, reading level suitable for ESL residents.",
        technique: "Persona + Specificity",
      },
      {
        title: "Animal Services Public Notice",
        scenario: "Free pet vaccination clinic this Saturday at GT Bray Park.",
        weakPrompt: "Write about the pet vaccination event",
        strongPrompt: "Draft a public notice for Manatee County Animal Services' free pet vaccination clinic. Details: Saturday March 22, 9 AM - 1 PM, GT Bray Park Pavilion #3. Offering: rabies, distemper, bordetella for dogs; rabies, FVRCP for cats. Limit 3 pets per household. Bring proof of Manatee County residency. No appointment needed, first-come-first-served. Include: what to bring (leash/carrier, ID), parking info, rain-or-shine status. Format as: social media post (150 words), flyer text (100 words), and website blurb (75 words). Do not include medical advice or dosage information.",
        technique: "Format + Structure",
      },
    ],
    personalization: {
      heroGreeting: "Compassionate, clear communication changes lives. Whether writing approval letters, resource guides, or outreach materials, good prompts help you reach vulnerable populations with the right information at the right reading level.",
      starterChapters: ["ch01", "ch02", "ch03"],
      promptOfTheWeek: {
        title: "Client Assistance Approval Letter",
        description: "Draft an approval notification for a social services program that is clear, warm, and accessible to ESL residents.",
        template: "Role: You are a Manatee County Human Services case worker.\nTask: A [individual/family of SIZE] has been approved for the [PROGRAM NAME, e.g., Emergency Utility Assistance, Rent Stabilization, Prescription Assistance] program covering up to $[AMOUNT] toward [SPECIFIC EXPENSE].\nConstraints: Congratulate them. State approved amount and what it covers. Explain next steps and timeline. List any conditions (reapplication period, account requirements). Provide direct case worker contact. Warm but professional, 6th-grade reading level suitable for ESL residents. Under 200 words.\nOutput: An approval letter ready to print and mail.",
        technique: "Persona + Specificity",
      },
      quickActions: {
        lab: "Practice writing client letters, resource guides, community event flyers, and veterans outreach materials.",
        builder: "Build prompts for case notes, program eligibility summaries, and multi-language outreach content.",
        resources: "Templates for client correspondence, community resource lists, and public health notices.",
      },
      builderTemplate: "Role: You are a Manatee County [Human Services/Veterans Services/Animal Services] staff member.\nTask: Draft a [letter/flyer/guide] for [CLIENT SITUATION or COMMUNITY EVENT].\nConstraints: Reading level appropriate for general public (6th grade). Warm and encouraging tone. Include all relevant contact numbers, addresses, and deadlines. If multilingual outreach is needed, note translation requirements.\nOutput: [Letter/flyer/guide] ready for supervisor approval.",
      chatbotContext: "Human Services covers Manatee County's social safety net: aging and adult services, community assistance (utility/rent/food), veterans services, animal services, and disability support. Staff write client approval and denial letters, program eligibility explanations, community outreach materials, pet adoption posts, and case coordination notes. Materials must often be accessible to ESL residents and populations with limited literacy. Common programs include Emergency Utility Assistance, SNAP navigation, and Area Agency on Aging referrals.",
      recommendedRecipeCategories: ["Writing", "County Work", "Planning"],
    },
  },
  {
    id: "government-admin",
    name: "Government Administration & Civic Participation",
    icon: "🏛️",
    description: "Records, HR, public engagement, budget, data, transparency",
    color: "oklch(0.42 0.14 300)",
    subCategories: [
      {
        name: "Administrative Services",
        services: [
          { name: "Submit a Public Records Request", description: "Florida Sunshine Law requests" },
          { name: "Apply for a County Job", description: "Current openings and internships" },
          { name: "Access Clerk Functions", description: "Recording, minutes, records" },
          { name: "Request Board Support", description: "Commission meeting logistics" },
        ],
      },
      {
        name: "Public Engagement & Feedback",
        services: [
          { name: "Submit Public Comment", description: "Board meetings and hearings" },
          { name: "Take a County Survey", description: "Resident feedback opportunities" },
          { name: "Volunteer with the County", description: "Programs and sign-up" },
          { name: "Make a Donation", description: "Parks, library, community programs" },
          { name: "Government Relations", description: "Legislative tracking and intergovernmental coordination" },
        ],
      },
      {
        name: "Information & Data",
        services: [
          { name: "View the County Budget", description: "Annual budget documents" },
          { name: "Access Performance Dashboards", description: "KPIs and metrics" },
          { name: "Download Open Data", description: "Public datasets" },
          { name: "Use Transparency Portals", description: "Spending and contract data" },
        ],
      },
      {
        name: "Property Management",
        services: [
          { name: "Request Facility Maintenance", description: "County building repairs and upkeep" },
          { name: "Reserve County Meeting Space", description: "Conference rooms and public hearing rooms" },
        ],
      },
    ],
    relevantChapters: ["ch01", "ch02", "ch04", "ch12", "ch15", "ch16", "ch17", "ch24", "ch29"],
    caseStudies: [
      {
        title: "Public Records Request Response",
        scenario: "Media outlet requests all AI-related contracts from the past 2 years.",
        weakPrompt: "Respond to the records request",
        strongPrompt: "You are a Manatee County public records specialist. The Bradenton Herald has filed a public records request (#PR-2026-0219) for 'all contracts, agreements, and purchase orders related to artificial intelligence tools or services from January 2024 to present.' Draft a response that: acknowledges receipt within the statutory timeframe, confirms the search scope (all departments, AI/ML keywords), provides an estimated response timeline (14 business days for initial review), notes any potential exemptions (security configurations under F.S. 119.071), and includes your contact information. Formal tone, cite Florida Statute 119 where applicable.",
        technique: "RTCO Framework",
      },
      {
        title: "Job Posting Draft",
        scenario: "HR needs to post a new Data Analyst position for the IT department.",
        weakPrompt: "Write a job posting for a data analyst",
        strongPrompt: "Act as a Manatee County HR recruitment specialist. Draft a job posting for a Data Analyst II in the Information Technology department. Include: position summary (3 sentences), 6 essential duties (data visualization, SQL queries, dashboard maintenance, report generation, stakeholder consulting, data quality), minimum qualifications (Bachelor's in related field, 3 years experience, SQL and Power BI required), preferred qualifications (government experience, Python, Tableau), salary range ($55,000-$72,000), benefits highlights (Florida Retirement, health, 12 holidays), and application instructions. Do not include age, gender, or any language that could be construed as discriminatory. Keep under 500 words.",
        technique: "Persona + Negative Constraints",
      },
    ],
    personalization: {
      heroGreeting: "Public records responses, budget summaries, job postings, and policy memos form the backbone of county operations. Precise prompts help you produce accurate, legally compliant documents on tight deadlines.",
      starterChapters: ["ch01", "ch02", "ch04"],
      promptOfTheWeek: {
        title: "Public Records Request Response",
        description: "Draft a compliant response to a Florida Sunshine Law public records request with proper statutory citations.",
        template: "Role: You are a Manatee County public records specialist.\nTask: Respond to public records request #[PR NUMBER] from [REQUESTER] requesting [DESCRIPTION OF RECORDS REQUESTED, e.g., all contracts related to X, emails between Y and Z from DATE to DATE].\nConstraints: Acknowledge receipt within statutory timeframe. Confirm search scope (departments, keywords, date range). Provide estimated response timeline. Note any potential exemptions under F.S. 119.071 (security configs, personnel records, etc.). Include your direct contact information. Cite Florida Statute 119 where applicable. Formal tone, under 250 words.\nOutput: A response letter ready for the Records Custodian's signature.",
        technique: "RTCO Framework",
      },
      quickActions: {
        lab: "Practice writing public records responses, budget narratives, HR postings, and policy memos.",
        builder: "Build prompts for board agenda items, performance dashboard summaries, and procurement justifications.",
        resources: "Templates for Sunshine Law responses, job descriptions, budget presentations, and IT project briefs.",
      },
      builderTemplate: "Role: You are a Manatee County [Clerk/HR/Finance/IT/Legal] staff member.\nTask: Draft a [memo/response/posting/report] regarding [SPECIFIC ADMINISTRATIVE MATTER].\nConstraints: Cite applicable Florida Statutes or county policies. Formal government tone. Include all required approvals, deadlines, and distribution lists. If budget-related, include fund codes and fiscal year references.\nOutput: [Document type] formatted for internal distribution or public posting.",
      chatbotContext: "Government Administration covers Manatee County's internal operations: the Clerk of the Board (public records, meeting minutes, recording), Human Resources (recruitment, benefits, classification), Finance and Budget (annual budget, audit, accounts payable), Information Technology (systems, cybersecurity, data governance), Legal (county attorney opinions, contracts), and Procurement. Staff handle Florida Sunshine Law records requests, board agenda preparation, job postings, budget narratives, IT project justifications, and policy memos. Florida Statute 119 compliance is a daily requirement.",
      recommendedRecipeCategories: ["Writing", "Analysis", "Data"],
    },
  },
  {
    id: "partner-agencies",
    name: "Partner & Related Agencies",
    icon: "🤝",
    description: "Constitutional offices, airport, port, school district, health department",
    color: "oklch(0.50 0.10 180)",
    subCategories: [
      {
        name: "Constitutional Offices & Agencies",
        services: [
          { name: "Contact Clerk of Court", description: "Court records, marriage, passports" },
          { name: "Contact Property Appraiser", description: "Property values and exemptions" },
          { name: "Contact Tax Collector", description: "Property tax, vehicle registration" },
          { name: "Contact Supervisor of Elections", description: "Voter registration, elections" },
          { name: "Contact Sheriff's Office", description: "Law enforcement, corrections" },
        ],
      },
      {
        name: "Infrastructure Entities",
        services: [
          { name: "Sarasota-Bradenton Airport", description: "SRQ airport services" },
          { name: "SeaPort Manatee", description: "Port operations and commerce" },
          { name: "Mosquito Control District", description: "Spraying schedules and requests" },
        ],
      },
      {
        name: "Other Governments",
        services: [
          { name: "School District of Manatee County", description: "Public schools and enrollment" },
          { name: "Florida Department of Health", description: "County health services" },
          { name: "City of Bradenton", description: "Incorporated municipality" },
          { name: "Town of Longboat Key", description: "Incorporated municipality" },
        ],
      },
    ],
    relevantChapters: ["ch01", "ch02", "ch14"],
    caseStudies: [
      {
        title: "Inter-Agency Referral",
        scenario: "A resident calls the county about a property tax question that's actually handled by the Tax Collector.",
        weakPrompt: "Help with the tax question",
        strongPrompt: "You are a Manatee County 311 operator. A resident is asking about their property tax bill, which is handled by the Tax Collector (a separate constitutional office, not the county government). Draft a warm handoff response that: explains the difference between county services and constitutional offices, provides the Tax Collector's phone number (941-741-4800) and website (taxcollector.com), offers to transfer the call, and mentions that the Property Appraiser (941-748-8208) handles value disputes if that's their actual issue. Friendly, helpful, do not attempt to answer the tax question directly.",
        technique: "Persona + Negative Constraints",
      },
    ],
    personalization: {
      heroGreeting: "Coordinating across independent agencies requires clear, precise communication. Good prompts help you draft referral scripts, inter-agency memos, and public-facing guides that reduce misdirected calls and improve resident experience.",
      starterChapters: ["ch01", "ch02", "ch14"],
      promptOfTheWeek: {
        title: "Inter-Agency Referral Script",
        description: "Draft a warm handoff script for redirecting residents to the correct constitutional office or partner agency.",
        template: "Role: You are a Manatee County 311 operator or front-desk staff member.\nTask: A resident is asking about [TOPIC, e.g., property tax bill, court records, vehicle registration, voter registration] which is handled by the [AGENCY NAME, e.g., Tax Collector, Clerk of Court, Supervisor of Elections], not by county government directly.\nConstraints: Explain the difference between county services and constitutional offices in plain language. Provide the correct agency's phone number, website, and office address. Offer to transfer the call if applicable. If the issue could involve multiple agencies (e.g., Property Appraiser vs. Tax Collector), clarify which handles what. Friendly and helpful, do not attempt to answer the agency-specific question. Under 150 words.\nOutput: A response script for phone or in-person use.",
        technique: "Persona + Negative Constraints",
      },
      quickActions: {
        lab: "Practice writing referral scripts, agency coordination emails, and public-facing service guides.",
        builder: "Build prompts for inter-agency meeting summaries, joint press releases, and service boundary explanations.",
        resources: "Templates for agency referral guides, joint initiative communications, and service directory entries.",
      },
      builderTemplate: "Role: You are a Manatee County staff member coordinating with [PARTNER AGENCY, e.g., Sheriff's Office, Health Department, School District, Tax Collector].\nTask: Draft a [referral script/coordination memo/joint announcement] regarding [SPECIFIC TOPIC OR INITIATIVE].\nConstraints: Clearly distinguish county responsibilities from partner agency responsibilities. Include correct contact information for all agencies involved. Professional and collaborative tone.\nOutput: [Script/memo/announcement] ready for use.",
      chatbotContext: "Partner Agencies covers Manatee County's relationships with independent constitutional offices (Clerk of Court, Property Appraiser, Tax Collector, Supervisor of Elections, Sheriff), the Sarasota-Bradenton Airport, SeaPort Manatee, Mosquito Control District, School District, Florida Department of Health, and incorporated municipalities (Bradenton, Longboat Key). County staff regularly field misdirected calls and need to explain the distinction between county departments and independent agencies. Common tasks include writing referral scripts, inter-agency coordination memos, joint event announcements, and public-facing guides about which agency handles which service.",
      recommendedRecipeCategories: ["Writing", "County Work", "Planning"],
    },
  },
  {
    id: "parks-culture",
    name: "Parks, Recreation & Culture",
    icon: "🌴",
    description: "Parks, beaches, sports facilities, historic sites, and leisure programming",
    color: "oklch(0.50 0.14 145)",
    subCategories: [
      {
        name: "Parks & Beaches",
        services: [
          { name: "Reserve a Park Pavilion", description: "Shelter and picnic area reservations" },
          { name: "Find a Dog Park", description: "Off-leash dog park locations and rules" },
          { name: "Get Beach Access Info", description: "Beach conditions, parking, and amenities" },
          { name: "Report Park Maintenance Issue", description: "Playground, trail, or facility concerns" },
        ],
      },
      {
        name: "Recreation & Athletics",
        services: [
          { name: "Register for Youth Sports", description: "Seasonal athletics programs for kids" },
          { name: "Find Adult Fitness Classes", description: "County-run wellness and fitness programs" },
          { name: "Reserve an Athletic Field", description: "Sports field and court bookings" },
          { name: "View Aquatic Center Schedule", description: "Pool hours and swim lessons" },
        ],
      },
      {
        name: "Culture & Events",
        services: [
          { name: "Visit a Historic Site", description: "County heritage locations and tours" },
          { name: "Find Community Events", description: "County-sponsored events calendar" },
          { name: "Book the Convention Center", description: "Bradenton Area Convention Center reservations" },
        ],
      },
    ],
    relevantChapters: ["ch01", "ch02", "ch03", "ch06", "ch08", "ch14"],
    caseStudies: [
      {
        title: "Summer Camp Registration Announcement",
        scenario: "Registration opens next week for summer youth camps at 12 park locations.",
        weakPrompt: "Write about summer camp registration",
        strongPrompt: "You are a Manatee County Parks & Recreation communications coordinator. Draft a 200-word announcement for summer youth camp registration opening March 15. Include: 12 locations, ages 5-14, weekly sessions June-August, $75/week, financial assistance available, online registration at mymanatee.org/parks. Emphasize early registration discount (10% off by April 1). Enthusiastic but informative tone targeting parents. Include phone number 941-742-5923.",
        technique: "RTCO Framework",
      },
      {
        title: "Park Trail Closure Notice",
        scenario: "A popular nature trail is closing for 3 weeks for bridge repair.",
        weakPrompt: "Tell people about the trail closure",
        strongPrompt: "Act as a Manatee County Parks maintenance supervisor. Write a public notice about the Riverwalk Nature Trail closure at Emerson Point Preserve. Details: closed April 7-25 for pedestrian bridge replacement, alternate trail access via North Trail entrance, parking lot remains open. Include 311 number for questions. Clear, factual, under 100 words. Do not use apologetic language — state facts and alternatives.",
        technique: "Persona + Constraints",
      },
    ],
    personalization: {
      heroGreeting: "From summer camp announcements to trail maps and event promotions, clear communications keep residents engaged with county parks and programs. Build prompts that make your outreach inviting and informative.",
      starterChapters: ["ch01", "ch02", "ch03"],
      promptOfTheWeek: {
        title: "Event Promotion Multi-Channel",
        description: "Create promotional copy for a county event across website, social media, and email in one prompt.",
        template: "Role: You are a Manatee County Parks & Recreation marketing specialist.\nTask: Create promotional materials for [EVENT NAME] at [LOCATION] on [DATE].\nOutput 3 versions:\n1. Website description (200 words) with logistics, audience, registration link\n2. Social media post (100 words) with hook and hashtags\n3. Email subject line + preview text (50 words)\nConstraints: Family-friendly tone, include phone 941-742-5923, mention free parking. Do not overuse exclamation marks.",
        technique: "Multi-Format Output",
      },
      quickActions: {
        lab: "Practice writing park announcements, event promotions, and facility notices with real scenarios.",
        builder: "Build prompts for recreation program marketing, trail guides, and community event outreach.",
        resources: "Templates for event flyers, program descriptions, and public park communications.",
      },
      builderTemplate: "Role: You are a Manatee County Parks & Recreation [communications/programming] staff member.\nTask: Draft a [announcement/flyer/notice] for [EVENT OR PROGRAM].\nConstraints: Family-friendly tone, include registration info and contact number 941-742-5923. Under [WORD COUNT] words.\nOutput: [Website post / social media / email] ready for review.",
      chatbotContext: "Parks, Recreation & Culture manages Manatee County's 90+ parks, beaches, athletic facilities, aquatic centers, nature preserves, and historic sites. Staff coordinate youth and adult recreation programs, special events, facility rentals, and the Convention & Visitors Bureau. Common tasks include writing program announcements, event promotions, trail closure notices, facility reservation confirmations, and seasonal activity guides.",
      recommendedRecipeCategories: ["Writing", "Planning", "County Work"],
    },
  },
];

/** Get a department by ID */
export function getDepartment(id: string): Department | undefined {
  return departments.find((d) => d.id === id);
}

/** Get all leaf services for a department */
export function getLeafServices(dept: Department): LeafService[] {
  return dept.subCategories.flatMap((sc) => sc.services);
}
