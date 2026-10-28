"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { useStats, useSettings } from "@/lib/hooks/use-swr-api";
import { useAuth } from "@/lib/auth/auth-context";
import type { SafeUser } from "@/lib/auth/session";

interface PortalShellProps {
  children: React.ReactNode;
  user?: SafeUser | null;
}

export function PortalShell({ children, user: initialUser }: PortalShellProps) {
  const { user: authUser, isLoading: isAuthLoading } = useAuth();
  const currentUser = authUser || initialUser;
  const [selectedFacilityId, setSelectedFacilityId] = useState("all");
  const { stats } = useStats();
  const { settings } = useSettings();

  // 1. Client-side authentication guard: redirect immediately if user is signed out
  useEffect(() => {
    if (!isAuthLoading && !currentUser) {
      window.location.replace("/login");
    }
  }, [currentUser, isAuthLoading]);

  // 2. Prevent Back/Forward Cache (bfcache) restoration on left-swipe / browser back
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      // event.persisted is true when restored from bfcache
      if (event.persisted) {
        window.location.reload();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // If user is unauthenticated, do not render portal content
  if (!isAuthLoading && !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
          <p className="mt-3 text-xs text-slate-500 font-medium">Verifying session security...</p>
        </div>
      </div>
    );
  }

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
