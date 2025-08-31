"use client"; 

import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<string | null>(null);

  // initialize on mount to avoid server/client markup differences
  useEffect(() => {
    const initial = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setTheme(initial);
  }, []);

  useEffect(() => {
    if (theme === null) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <button
      className="px-4 py-2 rounded border hover:bg-gray-200 dark:hover:bg-gray-700"
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
    >
      {theme === null ? "" : theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
    </button>
  );
}
