"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Calendar, MapPin, ShieldAlert } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDisplayDate } from "@/lib/inventory/dates";

interface AttentionBatch {
  id: string;
  batchNumber: string;
  totalQuantity: number;
  datePrecision: string;
  normalizedExpiryDate: string | null;
  expiryDateText: string | null;
  medicine: {
    name: string;
    genericName: string | null;
    strength: string | null;
    dosageForm: string;
    category: string;
  };
  balances: Array<{
    quantity: number;
    location: {
      name: string;
      facility: {
        name: string;
      };
    };
  }>;
  evaluation: {
    daysRemaining: number | null;
    status: "expired" | "urgent" | "critical" | "near_expiry" | "valid" | "unverified";
    label: string;
    badgeVariant: "destructive" | "warning" | "alert" | "success" | "neutral";
    isDispensingBlocked: boolean;
    policyNotes: string;
  };
}

interface AttentionRequiredProps {
  items: AttentionBatch[];
}

export function AttentionRequired({ items }: AttentionRequiredProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-600" />
            Critical Clinical Attention Queue
          </CardTitle>
          <CardDescription className="text-xs">
            Medicines that are expired, within urgent rotation horizons, or unverified
          </CardDescription>
        </div>
        <Link
          href="/expiry"
          className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
        >
          View all in Expiry Monitor
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            ✅ All active medicine batches are within normal shelf-life parameters.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((batch) => {
              const primaryLocation = batch.balances[0]?.location;
              return (
                <div
                  key={batch.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">
                        {batch.medicine.name}
                      </span>
                      {batch.medicine.strength && (
                        <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60">
                          {batch.medicine.strength}
                        </span>
                      )}
                      <Badge variant={batch.evaluation.badgeVariant}>
                        {batch.evaluation.label}
                      </Badge>
                      {batch.evaluation.isDispensingBlocked && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          Dispensing Blocked
                        </span>
                      )}
                    </div>

                    {batch.medicine.genericName && (
                      <p className="text-xs text-slate-500 mt-0.5 font-medium italic">
                        {batch.medicine.genericName}
                      </p>
                    )}

                    <div className="mt-1 flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500">
                      <span className="font-mono text-slate-700 font-semibold">
                        Lot: {batch.batchNumber}
                      </span>
                      <span>•</span>
                      <span className="font-bold text-slate-800">
                        Total Stock: {batch.totalQuantity} units
                      </span>
                      {primaryLocation && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {primaryLocation.facility.name} — {primaryLocation.name}
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        Cutoff: {formatDisplayDate(batch.normalizedExpiryDate)}
                      </span>
                    </div>

                    <p className="mt-1 text-[11px] text-slate-600 bg-slate-50 rounded px-2 py-0.5 border border-slate-100 max-w-2xl">
                      <strong>Policy:</strong> {batch.evaluation.policyNotes}
                    </p>
                  </div>

                  <Link
                    href={`/inventory?search=${encodeURIComponent(batch.batchNumber || batch.medicine.name)}`}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shrink-0 self-end sm:self-auto"
                  >
                    Audit Batch
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
