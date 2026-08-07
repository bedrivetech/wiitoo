"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface DarkModeContextType {
  isDark: boolean;
  toggleDark: () => void;
}

const DarkModeContext = createContext<DarkModeContextType>({
  isDark: true,
  toggleDark: () => {},
});

export function DarkModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("fusion-theme");
    if (stored === "light" || stored === "dark") {
      setIsDark(stored === "dark");
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute(
        "data-theme",
        isDark ? "dark" : "light"
      );
      localStorage.setItem("fusion-theme", isDark ? "dark" : "light");
    }
  }, [isDark, mounted]);

  const toggleDark = useCallback(() => setIsDark((prev) => !prev), []);

  return (
    <DarkModeContext.Provider value={{ isDark, toggleDark }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  return useContext(DarkModeContext);
}