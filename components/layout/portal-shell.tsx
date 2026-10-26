"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";

interface PortalShellProps {
  children: React.ReactNode;
}

export function PortalShell({ children }: PortalShellProps) {
  const [alertCount, setAlertCount] = useState(0);
  const [orgName, setOrgName] = useState("AyuTrace Health Network");
  const [selectedFacilityId, setSelectedFacilityId] = useState("all");

  useEffect(() => {
    async function loadMeta() {
      try {
        const [statsRes, settingsRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/settings"),
        ]);

        if (statsRes.ok) {
          const stats = await statsRes.json();
          if (stats.success && stats.data) {
            const count =
              (stats.data.expiredBatches || 0) +
              (stats.data.urgentBatches || 0) +
              (stats.data.unverifiedCount || 0);
            setAlertCount(count);
          }
        }

        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          if (settings.success && settings.data?.orgName) {
            setOrgName(settings.data.orgName);
          }
        }
      } catch (err) {
        console.warn("Could not load portal metadata:", err);
      }
    }

    loadMeta();
  }, []);

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
