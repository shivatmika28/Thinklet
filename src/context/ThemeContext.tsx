"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  const applyTheme = useCallback((mode: ThemeMode) => {
    if (typeof window === "undefined") return;
    try {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const isDark = mode === "dark" || (mode === "system" && prefersDark);
      const root = document.documentElement;

      // Temporary class for max 150ms color transition
      root.classList.add("theme-transitioning");
      const timeoutId = setTimeout(() => {
        root.classList.remove("theme-transitioning");
      }, 150);

      if (isDark) {
        root.classList.add("dark");
        root.setAttribute("data-theme", "dark");
        root.style.colorScheme = "dark";
        setResolvedTheme("dark");
      } else {
        root.classList.remove("dark");
        root.setAttribute("data-theme", "light");
        root.style.colorScheme = "light";
        setResolvedTheme("light");
      }

      return () => clearTimeout(timeoutId);
    } catch (e) {
      console.warn("Theme apply error:", e);
    }
  }, []);

  useEffect(() => {
    let savedMode: ThemeMode = "system";
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "light" || stored === "dark" || stored === "system") {
        savedMode = stored;
      }
    } catch {}

    setThemeState(savedMode);
    applyTheme(savedMode);

    // Listen to OS prefers-color-scheme changes when in system mode
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = () => {
      try {
        const currentSaved = localStorage.getItem("theme") as ThemeMode | null;
        if (!currentSaved || currentSaved === "system") {
          applyTheme("system");
        }
      } catch {}
    };

    if (media.addEventListener) {
      media.addEventListener("change", handleMediaChange);
      return () => media.removeEventListener("change", handleMediaChange);
    } else if ("addListener" in media) {
      // Legacy Safari fallback
      (media as any).addListener(handleMediaChange);
      return () => (media as any).removeListener(handleMediaChange);
    }
  }, [applyTheme]);

  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem("theme", newTheme);
      } catch (e) {
        console.warn("Theme storage error:", e);
      }
      applyTheme(newTheme);
    },
    [applyTheme]
  );

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next: ThemeMode = current === "light" ? "dark" : current === "dark" ? "system" : "light";
      try {
        localStorage.setItem("theme", next);
      } catch (e) {
        console.warn("Theme storage error:", e);
      }
      applyTheme(next);
      return next;
    });
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
