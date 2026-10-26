"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ScanLine, Building2, Calendar, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  alertCount?: number;
  orgName?: string;
  selectedFacilityId?: string;
  onFacilityChange?: (facilityId: string) => void;
}

export function Navbar({
  alertCount = 0,
  orgName = "AyuTrace Health Network",
  selectedFacilityId = "all",
  onFacilityChange,
}: NavbarProps) {
  const pathname = usePathname();
  const [facilities, setFacilities] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetch("/api/facilities")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setFacilities(json.data);
        }
      })
      .catch(() => {});
  }, []);

  const getPageInfo = (path: string) => {
    switch (path) {
      case "/dashboard":
        return {
          title: "Clinical Inventory Overview",
          subtitle: "Real-time stock visibility across wards and facilities. Because every dose matters.",
        };
      case "/scanner":
        return {
          title: "AI Medicine Scanner",
          subtitle: "Evidence-grounded label parsing via Gemma 4. Mandatory pharmacist review required.",
        };
      case "/inventory":
        return {
          title: "Medicine Inventory Register",
          subtitle: "Batch-wise stock balance, strength specifications & location allocations.",
        };
      case "/facilities":
        return {
          title: "Facilities & Storage Locations",
          subtitle: "Track hospitals, clinics, outpatient dispensaries, and cold chain stockrooms.",
        };
      case "/transfers":
        return {
          title: "Inter-Facility Stock Transfers",
          subtitle: "Atomic location-to-location reallocations with verified clinical audit trails.",
        };
      case "/expiry":
        return {
          title: "Medicine Expiry Monitor",
          subtitle: "Statutory drug cutoff alerts, FEFO dispatch queues & unverified batch quarantine.",
        };
      case "/analytics":
        return {
          title: "Pharmaceutical Analytics",
          subtitle: "Batch risk vectors, category allocations & future expiry exposure.",
        };
      case "/settings":
        return {
          title: "System Settings & Configuration",
          subtitle: "Organization profile, statutory warning horizons & Gemma 4 API status.",
        };
      default:
        return {
          title: "AyuTrace",
          subtitle: "Intelligent Medicine Tracking. Safer Healthcare Workflows.",
        };
    }
  };

  const { title, subtitle } = getPageInfo(pathname);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-6 backdrop-blur-xs">
      {/* Title & Healthcare Microcopy */}
      <div className="flex flex-col">
        <h1 className="text-base font-bold text-slate-900 leading-tight">
          {title}
        </h1>
        <p className="text-[11px] text-slate-500 leading-none mt-0.5">
          {subtitle}
        </p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Facility Selector */}
        {facilities.length > 0 && onFacilityChange && (
          <div className="hidden lg:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
            <Building2 className="h-3.5 w-3.5 text-teal-700" />
            <select
              value={selectedFacilityId}
              onChange={(e) => onFacilityChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer"
            >
              <option value="all">All Facilities ({facilities.length})</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date Display */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200/60 rounded-lg px-2.5 py-1.5">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>{formattedDate}</span>
        </div>

        {/* Organization Tag */}
        <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-teal-900 bg-teal-50 border border-teal-200/70 rounded-lg px-2.5 py-1.5">
          <Shield className="h-3.5 w-3.5 text-teal-700" />
          <span className="truncate max-w-[150px]">{orgName}</span>
        </div>

        {/* Expiry Alert Bell */}
        <Link
          href="/expiry"
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          title={`${alertCount} medicine batches require attention or quarantine`}
        >
          <Bell className="h-4 w-4" />
          {alertCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-600" />
            </span>
          )}
        </Link>

        {/* Primary CTA: Scan Medicine */}
        <Link href="/scanner">
          <Button size="sm" className="gap-1.5 text-xs h-8 bg-teal-700 hover:bg-teal-800">
            <ScanLine className="h-3.5 w-3.5" />
            <span>Scan Medicine</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
