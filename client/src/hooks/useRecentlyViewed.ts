import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "cookbook-recently-viewed";
const MAX_ITEMS = 5;

export interface RecentItem {
  id: string;
  title: string;
  timestamp: number;
}

export function useRecentlyViewed() {
  const [recentItems, setRecentItems] = useState<RecentItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentItems));
    } catch {
      // localStorage full or unavailable
    }
  }, [recentItems]);

  const addRecentItem = useCallback((id: string, title: string) => {
    setRecentItems((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      const updated = [{ id, title, timestamp: Date.now() }, ...filtered];
      return updated.slice(0, MAX_ITEMS);
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentItems([]);
  }, []);

  return { recentItems, addRecentItem, clearRecent };
}
