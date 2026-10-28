"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { useStats, useSettings } from "@/lib/hooks/use-swr-api";

interface PortalShellProps {
  children: React.ReactNode;
}

export function PortalShell({ children }: PortalShellProps) {
  const [selectedFacilityId, setSelectedFacilityId] = useState("all");
  const { stats } = useStats();
  const { settings } = useSettings();

  const alertCount = stats
    ? (stats.expiredBatches || 0) +
      (stats.urgentBatches || 0) +
      (stats.unverifiedCount || 0)
    : 0;

  const orgName = settings?.orgName || "AyuTrace Health Network";

  return (
    <div className="flex min-h-screen bg-slate-50/70 font-sans text-slate-900 antialiased">
      <Sidebar alertCount={alertCount} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar
          alertCount={alertCount}
          orgName={orgName}
          selectedFacilityId={selectedFacilityId}
          onFacilityChange={setSelectedFacilityId}
        />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
