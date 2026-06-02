/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon, Laptop } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center bg-slate-100/80 dark:bg-[#0f172a]/85 border border-slate-300/30 dark:border-slate-803 p-[3px] rounded-full shadow-md backdrop-blur select-none shrink-0">
      <button
        onClick={() => setTheme("light")}
        className={`p-2 rounded-full transition-all cursor-pointer ${
          theme === "light"
            ? "bg-white text-indigo-650 shadow-sm scale-102"
            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
        title="Light Mode"
      >
        <Sun className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-2 rounded-full transition-all cursor-pointer ${
          theme === "dark"
            ? "bg-indigo-950/40 text-indigo-400 shadow-sm scale-102 border border-indigo-500/10"
            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
        title="Dark Mode"
      >
        <Moon className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`p-2 rounded-full transition-all cursor-pointer ${
          theme === "system"
            ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-indigo-300 shadow-sm scale-102"
            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
        title="System Preference"
      >
        <Laptop className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
