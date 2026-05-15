/**
 * welcomeStorage.test.ts — U5 strict TDD (2026-05-14)
 *
 * Pure-function tests for getWelcomeSeen / setWelcomeSeen.
 * Uses node environment (no jsdom) — localStorage is mocked manually.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { getWelcomeSeen, setWelcomeSeen, WELCOME_KEY } from "./welcomeStorage";

// Minimal localStorage mock for node test environment
const store: Record<string, string> = {};
const mockStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
};

beforeEach(() => {
  // Clear store between tests
  for (const k of Object.keys(store)) delete store[k];
  // Inject mock into globalThis for node environment
  (globalThis as unknown as Record<string, unknown>).localStorage = mockStorage;
});

describe("WELCOME_KEY", () => {
  it("exports the correct localStorage key", () => {
    expect(WELCOME_KEY).toBe("builder-welcome-seen");
  });
});

describe("getWelcomeSeen", () => {
  it("returns false when key is absent", () => {
    expect(getWelcomeSeen()).toBe(false);
  });

  it("returns true when key is 'true'", () => {
    store[WELCOME_KEY] = "true";
    expect(getWelcomeSeen()).toBe(true);
  });

  it("returns false when key is any other value", () => {
    store[WELCOME_KEY] = "yes";
    expect(getWelcomeSeen()).toBe(false);
  });

  it("returns false when localStorage throws", () => {
    (globalThis as unknown as Record<string, unknown>).localStorage = {
      getItem: () => { throw new Error("SecurityError"); },
    };
    expect(getWelcomeSeen()).toBe(false);
  });
});

describe("setWelcomeSeen", () => {
  it("writes 'true' to the correct key", () => {
    setWelcomeSeen(true);
    expect(store[WELCOME_KEY]).toBe("true");
  });

  it("removes the key when called with false", () => {
    store[WELCOME_KEY] = "true";
    setWelcomeSeen(false);
    expect(store[WELCOME_KEY]).toBeUndefined();
  });

  it("does not throw when localStorage throws", () => {
    (globalThis as unknown as Record<string, unknown>).localStorage = {
      setItem: () => { throw new Error("SecurityError"); },
      removeItem: () => { throw new Error("SecurityError"); },
    };
    expect(() => setWelcomeSeen(true)).not.toThrow();
  });
});
