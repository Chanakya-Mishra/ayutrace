"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Building2, Pill, ShieldAlert, AlertTriangle } from "lucide-react";

export function AnalyticsView() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setStats(json.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="py-16 text-center text-sm text-slate-400">Loading pharmaceutical analytics...</div>;
  }

  const facilityData = stats?.inventoryByFacility || [];
  const categoryData = stats?.quantityByCategory || [];
  const dosageData = stats?.quantityByDosageForm || [];
  const riskData = stats?.riskDistribution || [];
  const timelineData = stats?.expiryTimeline || [];

  return (
    <div className="space-y-6">
      {/* High-Level Overview Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Medicines</span>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats?.totalStockUnits || 0}</p>
          <p className="text-[11px] text-slate-400">Packs across {stats?.registeredMedicines || 0} registered lines</p>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-bold text-slate-500 uppercase">Active Lots</span>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats?.activeBatches || 0}</p>
          <p className="text-[11px] text-slate-400">Independent batches tracked</p>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-bold text-amber-700 uppercase">Expiry Exposure (≤90d)</span>
          <p className="mt-1 text-2xl font-bold text-amber-700">
            {(stats?.nearExpiryBatches || 0) + (stats?.criticalBatches || 0) + (stats?.urgentBatches || 0)}
          </p>
          <p className="text-[11px] text-amber-600">Batches needing priority rotation</p>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-bold text-rose-700 uppercase">Quarantined / Expired</span>
          <p className="mt-1 text-2xl font-bold text-rose-700">{stats?.expiredBatches || 0}</p>
          <p className="text-[11px] text-rose-600">Blocked from patient dispensing</p>
        </Card>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Medicine Inventory by Facility */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-teal-700" />
              Stock Volume by Facility
            </CardTitle>
            <CardDescription className="text-xs">
              Physical packs registered across hospital wards and clinics
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {facilityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={facilityData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="facility"
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <Tooltip
                    formatter={(val: number) => [`${val} units`, "Stock"]}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="units" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p className="text-xs text-slate-400">No facility data logged.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quantity by Dosage Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Pill className="h-4 w-4 text-teal-700" />
              Stock by Dosage Form
            </CardTitle>
            <CardDescription className="text-xs">
              Breakdown across tablets, capsules, syrups, and injections
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {dosageData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dosageData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis dataKey="form" type="category" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    formatter={(val: number) => [`${val} units`, "Units"]}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="units" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p className="text-xs text-slate-400">No dosage records logged.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Future Expiry Timeline Exposure (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-teal-700" />
              Future Expiry Exposure Curve
            </CardTitle>
            <CardDescription className="text-xs">
              Projected volume of medicines reaching printed expiry milestones over upcoming months
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <Tooltip
                    formatter={(val: number) => [`${val} units`, "Packs Expiring"]}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="units"
                    stroke="#0d9488"
                    fill="#f0fdfa"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <AlertTriangle className="h-8 w-8 text-slate-300" />
                <p className="text-xs text-slate-400 mt-2">No scheduled future expirations found.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
