import { useState, useMemo } from "react";
import { Search, BookOpen, ChefHat, FlaskConical, Wrench, Clock, ChevronDown, ChevronRight, X } from "lucide-react";
import { chapters, parts } from "@/lib/cookbookData";
import { tasteTests } from "@/lib/tasteTests";
import { departments } from "@/lib/departments";
import type { Department } from "@/lib/departments";
import type { RecentItem } from "@/hooks/useRecentlyViewed";
import { search as semanticSearch } from "@/lib/searchIndex";

interface SidebarProps {
  activeChapter: string | null;
  onSelectChapter: (id: string) => void;
  recentItems: RecentItem[];
  isOpen: boolean;
  onClose: () => void;
  completedTests?: string[];
  onOpenTest?: (testId: string) => void;
  selectedDepartment?: Department | null;
  onSelectDepartment?: (dept: Department | null) => void;
}

export default function Sidebar({ activeChapter, onSelectChapter, recentItems, isOpen, onClose, completedTests = [], onOpenTest, selectedDepartment, onSelectDepartment }: SidebarProps) {
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedParts, setExpandedParts] = useState<Record<string, boolean>>({
    part1: true,
    part2: true,
    part3: true,
    part4: true,
  });

  const togglePart = (partId: string) => {
    setExpandedParts((prev) => ({ ...prev, [partId]: !prev[partId] }));
  };

  const searchResults = useMemo(
    () => (searchQuery.length >= 2 ? semanticSearch(searchQuery) : []),
    [searchQuery]
  );

  const handleSelect = (id: string) => {
    onSelectChapter(id);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-50 lg:z-auto lg:sticky lg:top-0 w-72 flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ background: "oklch(0.18 0.02 40)" }}
      >
        {/* Header */}
        <div className="p-4 pb-3 flex items-center justify-between" style={{ borderBottom: "1px solid oklch(0.26 0.03 40)" }}>
          <button
            onClick={() => {
              window.location.hash = "";
              window.location.href = "/";
              onClose();
            }}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.26 0.04 48)" }}
            >
              <ChefHat className="w-4.5 h-4.5" style={{ color: "oklch(0.78 0.14 55)" }} />
            </div>
            <div className="text-left">
              <span className="font-serif font-bold text-sm block leading-tight" style={{ color: "oklch(0.92 0.025 75)" }}>
                Prompt Cookbook
              </span>
              <span className="text-[10px] block" style={{ color: "oklch(0.52 0.04 55)" }}>
                MCG AI Working Group
              </span>
            </div>
          </button>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-md hover:bg-[oklch(0.24_0.03_40)]" style={{ color: "oklch(0.55 0.03 55)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "oklch(0.50 0.03 55)" }} />
            <input
              type="text"
              placeholder="Search everything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded text-sm"
              style={{
                background: "oklch(0.24 0.02 40)",
                color: "oklch(0.85 0.02 75)",
                border: "1px solid oklch(0.30 0.03 40)",
              }}
            />
          </div>
        </div>

        {/* Department dropdown */}
        {onSelectDepartment && (
          <div className="px-3 pb-2">
            <button
              onClick={() => setDeptDropdownOpen((p) => !p)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors"
              style={{
                background: selectedDepartment ? "oklch(0.26 0.03 40)" : "oklch(0.24 0.02 40)",
                border: selectedDepartment ? `1px solid ${selectedDepartment.color}` : "1px solid oklch(0.30 0.03 40)",
                color: "oklch(0.85 0.02 75)",
              }}
            >
              <span className="text-sm">{selectedDepartment?.icon || "🏛️"}</span>
              <span className="flex-1 truncate text-xs font-medium">
                {selectedDepartment?.name || "All Departments"}
              </span>
              <ChevronDown
                className="w-3.5 h-3.5 transition-transform duration-200"
                style={{
                  color: "oklch(0.55 0.03 55)",
                  transform: deptDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>
            {deptDropdownOpen && (
              <div
                className="mt-1 rounded-lg overflow-hidden"
                style={{
                  background: "oklch(0.22 0.02 40)",
                  border: "1px solid oklch(0.30 0.03 40)",
                }}
              >
                <button
                  onClick={() => { onSelectDepartment(null); setDeptDropdownOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-[oklch(0.28_0.03_40)]"
                  style={{
                    color: !selectedDepartment ? "oklch(0.90 0.03 75)" : "oklch(0.70 0.02 55)",
                    background: !selectedDepartment ? "oklch(0.28 0.04 45)" : "transparent",
                  }}
                >
                  <span>🏛️</span>
                  <span>All Departments</span>
                </button>
                {departments.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => { onSelectDepartment(dept); setDeptDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-[oklch(0.28_0.03_40)]"
                    style={{
                      color: selectedDepartment?.id === dept.id ? "oklch(0.90 0.03 75)" : "oklch(0.70 0.02 55)",
                      background: selectedDepartment?.id === dept.id ? "oklch(0.28 0.04 45)" : "transparent",
                    }}
                  >
                    <span>{dept.icon}</span>
                    <span className="truncate">{dept.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick links */}
        <div className="px-3 pb-2 space-y-0.5">
          {recentItems.length > 0 && (
            <button
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left"
              style={{ color: "oklch(0.75 0.03 55)" }}
              onClick={() => {
                window.location.href = "/";
                setTimeout(() => {
                  const el = document.getElementById("recently-viewed");
                  el?.scrollIntoView({ behavior: "smooth" });
                }, 100);
                onClose();
              }}
            >
              <Clock className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.10 55)" }} />
              Recently Viewed
            </button>
          )}
          <button
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left hover:opacity-80"
            style={{ color: "oklch(0.75 0.03 55)" }}
            onClick={() => {
              try { localStorage.setItem("cookbook-resources-tab", "recipes"); } catch {}
              window.location.href = "/resources?tab=recipes";
              onClose();
            }}
          >
            <BookOpen className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.10 55)" }} />
            All Recipes
          </button>
          <button
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left hover:opacity-80"
            style={{ color: "oklch(0.75 0.03 55)" }}
            onClick={() => { window.location.href = "/resources"; }}
          >
            <BookOpen className="w-3.5 h-3.5" style={{ color: "oklch(0.42 0.14 300)" }} />
            Resources
          </button>
          <button
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left hover:opacity-80"
            style={{ color: "oklch(0.75 0.03 55)" }}
            onClick={() => { window.location.href = "/builder"; }}
          >
            <Wrench className="w-3.5 h-3.5" style={{ color: "oklch(0.55 0.12 220)" }} />
            Build a Prompt
          </button>
          <button
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left hover:opacity-80"
            style={{ color: "oklch(0.75 0.03 55)" }}
            onClick={() => { window.location.href = "/game"; }}
          >
            <FlaskConical className="w-3.5 h-3.5" style={{ color: "oklch(0.42 0.14 155)" }} />
            Prompt Lab
          </button>
        </div>

        <div style={{ borderBottom: "1px solid oklch(0.28 0.03 40)" }} className="mx-3" />

        {/* Chapter list */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll px-2 py-2">
          {searchQuery.length >= 2 ? (
            <div className="space-y-px">
              {searchResults.map((result, idx) => {
                const typeColors: Record<string, string> = {
                  chapter: "oklch(0.55 0.12 55)",
                  recipe: "oklch(0.50 0.14 220)",
                  department: "oklch(0.50 0.12 155)",
                  lesson: "oklch(0.45 0.14 300)",
                  "case-study": "oklch(0.50 0.10 75)",
                };
                return (
                  <button
                    key={`${result.type}-${idx}`}
                    onClick={() => {
                      if (result.href.startsWith("/#")) {
                        handleSelect(result.href.replace("/#", ""));
                      } else {
                        window.location.href = result.href;
                        onClose();
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150 hover:bg-[oklch(0.24_0.03_40)]"
                    style={{ color: "oklch(0.62 0.02 55)" }}
                  >
                    <span className="text-[13px] flex-shrink-0">{result.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="truncate text-[12px] font-medium block" style={{ color: "oklch(0.88 0.02 65)" }}>
                        {result.title}
                      </span>
                      <span className="truncate text-[10px] block" style={{ color: "oklch(0.50 0.03 55)" }}>
                        {result.subtitle}
                      </span>
                    </div>
                    <span
                      className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ background: `color-mix(in oklch, ${typeColors[result.type] || typeColors.chapter} 20%, transparent)`, color: typeColors[result.type] || typeColors.chapter }}
                    >
                      {result.type === "case-study" ? "case" : result.type}
                    </span>
                  </button>
                );
              })}
              {searchResults.length === 0 && (
                <p className="text-xs px-3 py-6 text-center" style={{ color: "oklch(0.45 0.03 55)" }}>
                  No results for "{searchQuery}"
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {parts.map((part) => {
                const partChapters = chapters.filter((ch) => ch.part === part.id);
                const isExpanded = expandedParts[part.id];
                return (
                  <div key={part.id}>
                    {/* Part header */}
                    <button
                      onClick={() => togglePart(part.id)}
                      className="w-full flex items-center gap-2 px-3 py-1 rounded-md"
                      style={{ color: "oklch(0.48 0.04 50)" }}
                    >
                      {isExpanded
                        ? <ChevronDown className="w-3 h-3 flex-shrink-0" />
                        : <ChevronRight className="w-3 h-3 flex-shrink-0" />
                      }
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        {part.label}
                      </span>
                    </button>

                    {/* Chapter items + taste test */}
                    {isExpanded && (
                      <div className="mt-1 space-y-px">
                        {partChapters.map((ch) => {
                          const isActive = activeChapter === ch.id;
                          return (
                            <button
                              key={ch.id}
                              onClick={() => handleSelect(ch.id)}
                              className="w-full flex items-center gap-2.5 pl-5 pr-3 py-[7px] rounded-lg text-left transition-all duration-150"
                              style={{
                                background: isActive ? "oklch(0.28 0.06 50)" : "transparent",
                                color: isActive ? "oklch(0.95 0.03 65)" : "oklch(0.60 0.02 55)",
                              }}
                            >
                              <span className="text-[11px] flex-shrink-0 w-4 text-center">{ch.icon}</span>
                              <span className="truncate text-[12px] font-medium leading-tight">{ch.title}</span>
                            </button>
                          );
                        })}
                        {/* Taste test for this part */}
                        {(() => {
                          const partTest = tasteTests.find((t) => t.requiredParts.includes(part.id));
                          if (!partTest || !onOpenTest) return null;
                          const done = completedTests.includes(partTest.id);
                          return (
                            <button
                              onClick={() => onOpenTest(partTest.id)}
                              className="w-full flex items-center gap-2 pl-5 pr-3 py-[6px] rounded-lg text-left transition-all duration-150"
                              style={{
                                color: done ? "oklch(0.58 0.14 145)" : "oklch(0.58 0.10 55)",
                              }}
                            >
                              <span className="text-[10px] flex-shrink-0">{done ? "✅" : "📝"}</span>
                              <span className="truncate text-[11px] font-medium">
                                {done ? "Test passed" : "Take quiz →"}
                              </span>
                            </button>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-3 text-center" style={{ borderTop: "1px solid oklch(0.28 0.03 40)" }}>
          <p className="text-xs" style={{ color: "oklch(0.45 0.03 50)" }}>
            Manatee County AI Working Group
          </p>
          <p className="text-xs mt-0.5" style={{ color: "oklch(0.38 0.02 50)" }}>
            2026 Edition
          </p>
        </div>
      </aside>
    </>
  );
}
