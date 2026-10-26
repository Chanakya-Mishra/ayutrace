"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  LogOut,
  LogIn,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { RoleLabels } from "@/lib/validations/auth";

interface SidebarProps {
  alertCount?: number;
}

export function Sidebar({ alertCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();

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
          {/* AyuTrace Logo */}
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl shadow-xs transition-transform group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="AyuTrace Logo"
              width={36}
              height={36}
              className="h-full w-full object-cover"
              priority
            />
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

      {/* User Status / Account Footer */}
      <div className="p-3 border-t border-slate-200/70 bg-slate-50/60">
        {!isCollapsed ? (
          user ? (
            <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs mb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-[10px] font-bold text-white uppercase">
                    {user.name.slice(0, 2)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-teal-700 font-medium truncate leading-tight mt-0.5">
                      {RoleLabels[user.role] || user.role}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => logout()}
                  className="rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs mb-2">
              <p className="text-[11px] font-semibold text-slate-700">Clinical Workstation</p>
              <div className="mt-2 flex gap-1.5">
                <Link
                  href="/login"
                  className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded py-1 transition-colors"
                >
                  <LogIn className="h-3 w-3" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/register"
                  className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded py-1 transition-colors"
                >
                  <span>Sign Up</span>
                </Link>
              </div>
            </div>
          )
        ) : user ? (
          <div className="flex justify-center mb-2" title={`Signed in as ${user.name}`}>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-700 text-[10px] font-bold text-white uppercase">
              {user.name.slice(0, 2)}
            </div>
          </div>
        ) : null}

        {/* Microcopy & Protocol Footer */}
        {!isCollapsed && (
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
        )}
      </div>

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
