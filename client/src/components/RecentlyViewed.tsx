import { Clock, X } from "lucide-react";
import type { RecentItem } from "@/hooks/useRecentlyViewed";
import { chapters } from "@/lib/cookbookData";

interface RecentlyViewedProps {
  items: RecentItem[];
  onSelect: (id: string) => void;
  onClear: () => void;
}

export default function RecentlyViewed({ items, onSelect, onClear }: RecentlyViewedProps) {
  if (items.length === 0) return null;

  return (
    <div className="mb-8" id="recently-viewed">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" style={{ color: "oklch(0.55 0.08 50)" }} />
          <h3 className="font-serif font-bold text-base" style={{ color: "oklch(0.25 0.03 40)" }}>
            Recently Viewed
          </h3>
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-xs transition-colors"
          style={{ color: "oklch(0.55 0.04 50)" }}
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const ch = chapters.find((c) => c.id === item.id);
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
              style={{
                background: "oklch(0.99 0.005 75)",
                border: "1px solid oklch(0.90 0.02 75)",
                color: "oklch(0.30 0.03 40)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "oklch(0.72 0.10 55)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "oklch(0.90 0.02 75)";
              }}
            >
              <span className="text-sm">{ch?.icon || "📄"}</span>
              <span className="font-medium">{item.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
