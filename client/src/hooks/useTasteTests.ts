import { useState, useCallback } from "react";
import { tierLabels } from "@/lib/tasteTests";

const STORAGE_KEY = "cookbook-taste-tests";

export function useTasteTests() {
  const [completedTests, setCompletedTests] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const currentTier = Math.min(completedTests.length, tierLabels.length - 1);
  const tierLabel = tierLabels[currentTier];

  const markComplete = useCallback((testId: string) => {
    setCompletedTests((prev) => {
      if (prev.includes(testId)) return prev;
      const updated = [...prev, testId];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // localStorage full or unavailable
      }
      return updated;
    });
  }, []);

  const resetTests = useCallback(() => {
    setCompletedTests([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage full or unavailable
    }
  }, []);

  return { completedTests, currentTier, tierLabel, markComplete, resetTests };
}
