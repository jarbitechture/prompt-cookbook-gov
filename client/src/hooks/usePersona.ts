import { useState, useCallback } from "react";
import type { Persona } from "@/lib/personas";
import { personas } from "@/lib/personas";

const STORAGE_KEY = "cookbook-persona";

export function usePersona() {
  const [persona, setPersonaState] = useState<Persona | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const found = personas.find((p) => p.id === stored);
        return found || null;
      }
      return null;
    } catch {
      return null;
    }
  });

  const setPersona = useCallback((p: Persona) => {
    setPersonaState(p);
    try {
      localStorage.setItem(STORAGE_KEY, p.id);
    } catch {
      // localStorage full or unavailable
    }
  }, []);

  const clearPersona = useCallback(() => {
    setPersonaState(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage full or unavailable
    }
  }, []);

  return { persona, setPersona, clearPersona };
}
