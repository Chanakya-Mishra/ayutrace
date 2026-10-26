"use client";

import React from "react";
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

interface ChartProps {
  facilityData: Array<{ facility: string; type: string; units: number }>;
  riskData: Array<{ name: string; count: number; color: string }>;
  timelineData: Array<{ month: string; units: number }>;
}

export function InventoryCharts({ facilityData, riskData, timelineData }: ChartProps) {
  const hasFacilityData = facilityData.length > 0 && facilityData.some((f) => f.units > 0);
  const hasTimelineData = timelineData.length > 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Inventory by Facility Chart (6 cols) */}
      <Card className="lg:col-span-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-slate-900">
            Stock Distribution by Facility
          </CardTitle>
          <CardDescription className="text-xs">
            Physical stock allocation across registered hospital units and clinics
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64 pt-3">
          {hasFacilityData ? (
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
                  formatter={(val: number) => [`${val} packs`, "Stock In Hand"]}
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
              <p className="text-xs text-slate-400">No facility stock records logged.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Expiry Risk Health Donut (6 cols) */}
      <Card className="lg:col-span-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-slate-900">
            Batch Expiry Risk Proximity
          </CardTitle>
          <CardDescription className="text-xs">
            Batch breakdown by statutory cutoff horizons and verification state
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64 pt-3">
          {riskData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [`${val} batches`, "Batches"]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-[11px] text-slate-600 font-medium">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-xs text-slate-400">No active batches to evaluate.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expiry Timeline Exposure (12 cols) */}
      <Card className="lg:col-span-12">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-slate-900">
            Future Expiry Horizon Timeline
          </CardTitle>
          <CardDescription className="text-xs">
            Projected stock volume reaching statutory expiration over upcoming calendar months
          </CardDescription>
        </CardHeader>
        <CardContent className="h-56 pt-2">
          {hasTimelineData ? (
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
                  formatter={(val: number) => [`${val} units`, "Units Expiring"]}
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
              <p className="text-xs text-slate-400">No scheduled future expirations found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
