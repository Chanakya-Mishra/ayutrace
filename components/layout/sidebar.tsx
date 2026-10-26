"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ScanLine,
  Pill,
  Building2,
  ArrowLeftRight,
  ClockAlert,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  alertCount?: number;
}

export function Sidebar({ alertCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation = [
    {
      name: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "AI Medicine Scanner",
      href: "/scanner",
      icon: ScanLine,
      badge: "Gemma 4",
      badgeColor: "bg-teal-100 text-teal-800",
    },
    {
      name: "Medicine Inventory",
      href: "/inventory",
      icon: Pill,
    },
    {
      name: "Facilities & Departments",
      href: "/facilities",
      icon: Building2,
    },
    {
      name: "Stock Transfers",
      href: "/transfers",
      icon: ArrowLeftRight,
    },
    {
      name: "Expiry Monitor",
      href: "/expiry",
      icon: ClockAlert,
      count: alertCount > 0 ? alertCount : undefined,
      countColor: "bg-rose-100 text-rose-700 font-bold",
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-slate-200/80 bg-white transition-all duration-200 ease-in-out select-none",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header with AyuTrace Minimalist Medicine / Cross Icon */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200/70">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 overflow-hidden group"
        >
          {/* Custom SVG logo: Medicine capsule with cross & trace path */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-white shadow-xs group-hover:bg-teal-800 transition-colors">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Capsule body */}
              <rect x="3" y="5" width="18" height="14" rx="7" />
              {/* Center dividing line */}
              <line x1="12" y1="5" x2="12" y2="19" />
              {/* Healthcare cross on left half */}
              <line x1="7.5" y1="9.5" x2="7.5" y2="14.5" />
              <line x1="5" y1="12" x2="10" y2="12" />
              {/* Pulse / trace dot on right half */}
              <circle cx="16.5" cy="12" r="1.5" fill="currentColor" />
            </svg>
          </div>

          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 leading-tight">
                AyuTrace
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-teal-700">
                Healthcare Logistics
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-teal-50 text-teal-800 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon
                className={cn(
                  "h-4.5 w-4.5 shrink-0 transition-colors",
                  isActive
                    ? "text-teal-700"
                    : "text-slate-400 group-hover:text-slate-600"
                )}
              />
              {!isCollapsed && (
                <div className="flex flex-1 items-center justify-between overflow-hidden">
                  <span className="truncate text-xs">{item.name}</span>
                  {item.count !== undefined && (
                    <span
                      className={cn(
                        "ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold",
                        item.countColor
                      )}
                    >
                      {item.count}
                    </span>
                  )}
                  {item.badge && (
                    <span
                      className={cn(
                        "ml-auto flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide uppercase",
                        item.badgeColor
                      )}
                    >
                      <Activity className="h-2.5 w-2.5" />
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Microcopy & Protocol Footer */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-200/70 bg-slate-50/60">
          <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
              <span>AyuTrace Protocol</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 italic leading-snug">
              &ldquo;Trace every batch. Protect every step.&rdquo;
            </p>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-1.5 font-mono">
              <span>Gemma 4 Vision</span>
              <span className="text-teal-700 font-semibold">Active</span>
            </div>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-xs hover:bg-slate-50 hover:text-slate-800 transition-colors"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>
    </aside>
  );
}
