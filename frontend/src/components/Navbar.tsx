"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrainCircuit, Sparkles, Database, BarChart3, Home, Sun, Moon, Activity } from "lucide-react";
import { IconButton, Tooltip } from "@mui/material";
import { useThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/evaluate", label: "Evaluate Studio", icon: Sparkles },
  { href: "/dataset", label: "Dataset Explorer", icon: Database },
  { href: "/dashboard", label: "Analytics", icon: BarChart3 },
];

export function Navbar() {
  const pathname = usePathname();
  const { mode, toggleTheme } = useThemeMode();
  const [healthy, setHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => setHealthy(r.ok))
      .catch(() => setHealthy(false));
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
              SmartGrader
            </span>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 -mt-1">
              AI Short Answer Studio
            </p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900/90 p-1.5 border border-slate-200/60 dark:border-slate-800">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all",
                  active
                    ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-1 text-xs font-medium">
            <Activity
              className={cn(
                "h-3.5 w-3.5",
                healthy === true
                  ? "text-emerald-500 animate-pulse"
                  : healthy === false
                  ? "text-rose-500"
                  : "text-amber-500"
              )}
            />
            <span className="text-slate-600 dark:text-slate-300">
              {healthy === true ? "NLP Engine Ready" : healthy === false ? "API Offline" : "Checking..."}
            </span>
          </div>

          <Tooltip title={`Switch to ${mode === "dark" ? "Light" : "Dark"} Mode`}>
            <IconButton
              onClick={toggleTheme}
              size="small"
              className="!border !border-slate-200 dark:!border-slate-800 !rounded-xl"
            >
              {mode === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-700" />
              )}
            </IconButton>
          </Tooltip>
        </div>
      </div>

      <div className="flex md:hidden overflow-x-auto border-t border-slate-200/70 dark:border-slate-800 px-3 py-2 gap-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold",
                active
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
