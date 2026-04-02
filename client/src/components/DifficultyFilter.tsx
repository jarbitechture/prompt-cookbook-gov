import type { Difficulty } from "@/lib/cookbookData";

interface DifficultyFilterProps {
  active: Difficulty | "all";
  onChange: (d: Difficulty | "all") => void;
}

const filters: { value: Difficulty | "all"; label: string; color: string; activeColor: string }[] = [
  { value: "all", label: "All Recipes", color: "oklch(0.50 0.04 50)", activeColor: "oklch(0.55 0.12 45)" },
  { value: "beginner", label: "Beginner", color: "oklch(0.45 0.10 145)", activeColor: "oklch(0.55 0.14 145)" },
  { value: "intermediate", label: "Intermediate", color: "oklch(0.55 0.14 70)", activeColor: "oklch(0.65 0.16 70)" },
  { value: "advanced", label: "Advanced", color: "oklch(0.50 0.15 25)", activeColor: "oklch(0.60 0.18 25)" },
];

export default function DifficultyFilter({ active, onChange }: DifficultyFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {filters.map((f) => {
        const isActive = active === f.value;
        return (
          <button
            key={f.value}
            onClick={() => onChange(f.value)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={{
              background: isActive ? f.activeColor : "oklch(0.94 0.01 75)",
              color: isActive ? "oklch(0.98 0.01 75)" : f.color,
              border: isActive ? "none" : `1px solid oklch(0.85 0.02 75)`,
            }}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
