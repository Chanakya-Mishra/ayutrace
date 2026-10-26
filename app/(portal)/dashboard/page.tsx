"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ScanLine, Plus, ClockAlert, RefreshCw, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { InventoryCharts } from "@/components/dashboard/inventory-charts";
import { AttentionRequired } from "@/components/dashboard/attention-required";
import { RecentActivity } from "@/components/dashboard/recent-activity";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/stats");
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      }
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header & CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            AyuTrace Operations Center
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time medicine inventory, lot traceability & statutory expiry compliance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={isLoading}
            className="text-xs h-8 gap-1.5"
            title="Refresh metrics"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Link href="/facilities">
            <Button variant="secondary" size="sm" className="text-xs h-8 gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-slate-600" />
              Facilities
            </Button>
          </Link>

          <Link href="/expiry">
            <Button variant="secondary" size="sm" className="text-xs h-8 gap-1.5">
              <ClockAlert className="h-3.5 w-3.5 text-amber-600" />
              Expiring Stock
            </Button>
          </Link>

          <Link href="/scanner">
            <Button size="sm" className="text-xs h-8 gap-1.5 font-bold bg-teal-700 hover:bg-teal-800">
              <ScanLine className="h-3.5 w-3.5" />
              Scan Medicine
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <KpiCards
        registeredMedicines={stats?.registeredMedicines || 0}
        totalStockUnits={stats?.totalStockUnits || 0}
        activeBatches={stats?.activeBatches || 0}
        nearExpiryBatches={stats?.nearExpiryBatches || 0}
        expiredBatches={stats?.expiredBatches || 0}
        trackingFacilities={stats?.trackingFacilities || 0}
      />

      {/* Critical Attention Queue (Expired, Urgent, Unverified) */}
      <AttentionRequired items={stats?.criticalAttentionList || []} />

      {/* Recharts Data Visualizations */}
      <InventoryCharts
        facilityData={stats?.inventoryByFacility || []}
        riskData={stats?.riskDistribution || []}
        timelineData={stats?.expiryTimeline || []}
      />

      {/* Recent Activity Audit Trail */}
      <RecentActivity movements={stats?.recentStockMovements || []} />
    </div>
  );
}
