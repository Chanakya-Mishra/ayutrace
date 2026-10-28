"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ClockAlert,
  AlertOctagon,
  Calendar,
  AlertTriangle,
  HelpCircle,
  SlidersHorizontal,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Building2,
  Lock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDisplayDate } from "@/lib/inventory/dates";
import { StockAdjustModal } from "@/components/inventory/stock-adjust-modal";
import { useInventory } from "@/lib/hooks/use-swr-api";

export function ExpiryMonitorView() {
  const {
    batches,
    isLoading,
    mutate: loadData,
  } = useInventory({
    sortBy: "normalizedExpiryDate",
    sortOrder: "asc",
  });

  // Filter Tab: "all" | "expired" | "urgent" | "critical" | "near" | "unverified"
  const [filterTab, setFilterTab] = useState<string>("all");
  const [horizonDays, setHorizonDays] = useState<number>(90); // 90, 60, 30

  const [selectedBatchForAdjust, setSelectedBatchForAdjust] = useState<any | null>(null);

  const activeBatches = batches.filter((b) => b.status !== "depleted");

  const expiredBatches = activeBatches.filter(
    (b) => b.evaluation && b.evaluation.status === "expired"
  );
  const urgentBatches = activeBatches.filter(
    (b) => b.evaluation && b.evaluation.status === "urgent"
  );
  const criticalBatches = activeBatches.filter(
    (b) => b.evaluation && b.evaluation.status === "critical"
  );
  const nearExpiryBatches = activeBatches.filter(
    (b) =>
      b.evaluation &&
      b.evaluation.status === "near_expiry" &&
      b.evaluation.daysRemaining !== null &&
      b.evaluation.daysRemaining <= horizonDays
  );
  const unverifiedBatches = activeBatches.filter(
    (b) => !b.normalizedExpiryDate || b.evaluation?.status === "unverified"
  );

  const displayedList =
    filterTab === "expired"
      ? expiredBatches
      : filterTab === "urgent"
      ? urgentBatches
      : filterTab === "critical"
      ? criticalBatches
      : filterTab === "near"
      ? nearExpiryBatches
      : filterTab === "unverified"
      ? unverifiedBatches
      : activeBatches.filter(
          (b) =>
            b.evaluation?.status === "expired" ||
            b.evaluation?.status === "urgent" ||
            b.evaluation?.status === "critical" ||
            (b.evaluation?.daysRemaining !== null &&
              b.evaluation?.daysRemaining <= horizonDays) ||
            !b.normalizedExpiryDate
        );

  return (
    <div className="space-y-6">
      {/* Statutory Expiry Policy Banner */}
      <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-teal-700 mt-0.5 shrink-0" />
            <div className="text-xs text-teal-950">
              <span className="font-bold text-sm block mb-0.5">
                Statutory Medicine Expiry & FEFO Protocol
              </span>
              Under pharmaceutical safety regulations, expired and unverified batches are{" "}
              <strong>strictly blocked from clinical dispensing</strong>.
              For packages labeled with month/year (e.g. &ldquo;EXP 08/2026&rdquo;), the drug is deterministically
              deemed to expire on the <strong>last calendar day of the stated month</strong>.
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 bg-white border border-teal-200 rounded-lg p-1 text-xs">
            <span className="text-[11px] font-semibold text-slate-500 px-2">Near Horizon:</span>
            {[90, 60, 30].map((days) => (
              <button
                key={days}
                onClick={() => setHorizonDays(days)}
                className={`rounded px-2.5 py-1 text-xs font-bold transition-colors ${
                  horizonDays === days
                    ? "bg-teal-700 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Metrics Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          onClick={() => setFilterTab("expired")}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            filterTab === "expired"
              ? "border-rose-400 bg-rose-50/70 ring-2 ring-rose-300"
              : "border-slate-200 bg-white hover:border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700">Expired (Blocked)</span>
            <AlertOctagon className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-900">{expiredBatches.length}</p>
          <p className="mt-0.5 text-[11px] text-rose-600 font-medium">Immediate disposal / return</p>
        </div>

        <div
          onClick={() => setFilterTab("urgent")}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            filterTab === "urgent"
              ? "border-orange-400 bg-orange-50/70 ring-2 ring-orange-300"
              : "border-slate-200 bg-white hover:border-orange-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-700">Urgent (≤7 Days)</span>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-orange-900">{urgentBatches.length}</p>
          <p className="mt-0.5 text-[11px] text-orange-600 font-medium">Do not issue for long courses</p>
        </div>

        <div
          onClick={() => setFilterTab("critical")}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            filterTab === "critical"
              ? "border-amber-400 bg-amber-50/70 ring-2 ring-amber-300"
              : "border-slate-200 bg-white hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700">Critical (≤30 Days)</span>
            <ClockAlert className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-900">{criticalBatches.length}</p>
          <p className="mt-0.5 text-[11px] text-amber-600 font-medium">Priority FEFO dispensing</p>
        </div>

        <div
          onClick={() => setFilterTab("unverified")}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            filterTab === "unverified"
              ? "border-slate-400 bg-slate-100 ring-2 ring-slate-300"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Unverified Date</span>
            <HelpCircle className="h-4 w-4 text-slate-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{unverifiedBatches.length}</p>
          <p className="mt-0.5 text-[11px] text-slate-500 font-medium">Audit packaging label</p>
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={filterTab === "all" ? "primary" : "ghost"}
            onClick={() => setFilterTab("all")}
            className={`text-xs h-8 ${filterTab === "all" ? "bg-teal-700 hover:bg-teal-800" : ""}`}
          >
            All Actionable ({displayedList.length})
          </Button>
          <Button
            size="sm"
            variant={filterTab === "expired" ? "destructive" : "ghost"}
            onClick={() => setFilterTab("expired")}
            className="text-xs h-8"
          >
            Expired ({expiredBatches.length})
          </Button>
          <Button
            size="sm"
            variant={filterTab === "urgent" ? "secondary" : "ghost"}
            onClick={() => setFilterTab("urgent")}
            className="text-xs h-8"
          >
            Urgent ≤7d ({urgentBatches.length})
          </Button>
          <Button
            size="sm"
            variant={filterTab === "critical" ? "secondary" : "ghost"}
            onClick={() => setFilterTab("critical")}
            className="text-xs h-8"
          >
            Critical ≤30d ({criticalBatches.length})
          </Button>
          <Button
            size="sm"
            variant={filterTab === "near" ? "secondary" : "ghost"}
            onClick={() => setFilterTab("near")}
            className="text-xs h-8"
          >
            Near ≤{horizonDays}d ({nearExpiryBatches.length})
          </Button>
        </div>

        <span className="text-xs text-slate-400">
          Showing {displayedList.length} prioritized medicine batch{displayedList.length === 1 ? "" : "es"}
        </span>
      </div>

      {/* Expiry Action Queue */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900">
            Clinical Priority & Quarantine Queue
          </CardTitle>
          <CardDescription className="text-xs">
            Medicines ranked by closest printed expiration date. Quarantine or adjust stock directly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-sm text-slate-400">Evaluating clinical cutoffs...</div>
          ) : displayedList.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-700 mb-2">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="font-bold text-slate-900 text-sm">No medicine batches in this risk queue</p>
              <p className="text-xs text-slate-500 mt-1">
                All tracked inventory batches are within valid shelf-life standards.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {displayedList.map((batch) => (
                <div
                  key={batch.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-3"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">
                        {batch.medicine.name}
                      </span>
                      {batch.medicine.strength && (
                        <span className="text-xs font-semibold text-teal-900 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/70">
                          {batch.medicine.strength}
                        </span>
                      )}
                      <Badge variant={batch.evaluation?.badgeVariant || "neutral"}>
                        {batch.evaluation?.label || batch.status}
                      </Badge>
                      {batch.evaluation?.isDispensingBlocked && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                          <Lock className="h-2.5 w-2.5" />
                          Dispensing Blocked
                        </span>
                      )}
                    </div>

                    {batch.medicine.genericName && (
                      <p className="text-xs text-slate-500 font-medium italic mt-0.5">
                        {batch.medicine.genericName}
                      </p>
                    )}

                    <div className="mt-1 flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
                      <span className="font-mono text-slate-700 font-semibold">
                        Lot: {batch.batchNumber}
                      </span>
                      <span>•</span>
                      <span className="font-bold text-slate-900">
                        In Hand: {batch.totalQuantity} units
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        Cutoff: {formatDisplayDate(batch.normalizedExpiryDate)}
                      </span>
                      {batch.expiryDateText && (
                        <>
                          <span>•</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Packaging Label: &quot;{batch.expiryDateText}&quot;
                          </span>
                        </>
                      )}
                    </div>

                    <p className="mt-1 text-[11px] text-slate-600 bg-slate-50 rounded px-2 py-0.5 border border-slate-100 max-w-2xl">
                      <strong>Policy:</strong> {batch.evaluation?.policyNotes}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedBatchForAdjust(batch)}
                      className="text-xs h-8 gap-1.5"
                    >
                      <SlidersHorizontal className="h-3 w-3" />
                      Adjust / Quarantine
                    </Button>
                    <Link
                      href={`/inventory?search=${encodeURIComponent(batch.batchNumber || batch.medicine.name)}`}
                    >
                      <Button variant="ghost" size="sm" className="text-xs h-8 gap-1">
                        Audit
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adjust Modal */}
      <StockAdjustModal
        batch={selectedBatchForAdjust}
        isOpen={Boolean(selectedBatchForAdjust)}
        onClose={() => setSelectedBatchForAdjust(null)}
        onSuccess={loadData}
      />
    </div>
  );
}
