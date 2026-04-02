export interface Persona {
  id: string;
  label: string;
  department: string;
  icon: string;
  greeting: string;
  interests: string[]; // chapter part IDs that are most relevant
}

export const personas: Persona[] = [
  { id: "hr", label: "Human Resources", department: "HR", icon: "👥", greeting: "Ready to streamline your HR workflows", interests: ["part1", "part2"] },
  { id: "it", label: "Information Technology", department: "IT", icon: "💻", greeting: "Let's optimize your IT operations", interests: ["part2", "part4"] },
  { id: "comms", label: "Communications", department: "Communications", icon: "📢", greeting: "Let's craft better public messages", interests: ["part2", "part3"] },
  { id: "ops", label: "Operations", department: "Operations", icon: "⚙️", greeting: "Ready to improve your workflows", interests: ["part2", "part3"] },
  { id: "emergency", label: "Emergency Management", department: "Emergency Mgmt", icon: "🚨", greeting: "Prepared to support your mission", interests: ["part3", "part4"] },
  { id: "general", label: "General Staff", department: "General", icon: "🏛️", greeting: "Welcome to the MCG AI Prompt Cookbook", interests: ["part1", "part2", "part3", "part4"] },
];
