"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

/** Shared with the pre-paint script in `app/layout.tsx` — keep them in sync. */
export const THEME_STORAGE_KEY = "adesua-theme";
/** Older builds wrote to plain `theme`; read it so nobody loses their choice. */
const LEGACY_STORAGE_KEY = "theme";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored =
    window.localStorage.getItem(THEME_STORAGE_KEY) ??
    window.localStorage.getItem(LEGACY_STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "light";
}

/** Writes the theme to the DOM. Returns what actually ended up applied. */
function applyTheme(theme: Theme): ResolvedTheme {
  const root = document.documentElement;
  const isDark = theme === "dark" || (theme === "system" && systemPrefersDark());

  root.classList.toggle("dark", isDark);
  root.dataset.theme = isDark ? "dark" : "light";
  root.style.colorScheme = isDark ? "dark" : "light";

  return isDark ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Deliberately deterministic on the first render so the server HTML and the
  // client's first pass match. The pre-paint script has already put the right
  // class on <html>, so the page never flashes the wrong colours.
  const [theme, setThemeState] = useState<Theme>("light");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [ready, setReady] = useState(false);

  // Pick up the stored preference once we are on the client.
  useEffect(() => {
    setThemeState(readStoredTheme());
    setReady(true);
  }, []);

  // Apply + persist. Guarded by `ready` so the initial "light" default can't
  // overwrite a stored preference before it has been read.
  useEffect(() => {
    if (!ready) return;
    setResolvedTheme(applyTheme(theme));
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, ready]);

  // Follow the OS while in "system" mode.
  useEffect(() => {
    if (!ready || theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setResolvedTheme(applyTheme("system"));
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme, ready]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  // A single, unambiguous flip: whatever is on screen becomes the opposite.
  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const isDark =
        current === "dark" || (current === "system" && systemPrefersDark());
      return isDark ? "light" : "dark";
    });
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
