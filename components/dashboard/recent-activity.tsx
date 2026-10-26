"use client";

import React from "react";
import { History, ArrowUpRight, ArrowDownRight, ArrowLeftRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Movement {
  id: string;
  quantity: number;
  movementType: string;
  reason: string;
  notes: string | null;
  performedBy: string;
  createdAt: string;
  batch: {
    batchNumber: string;
    medicine: {
      name: string;
      strength: string | null;
    };
  };
  sourceLocation: {
    name: string;
    facility: { name: string };
  } | null;
  destinationLocation: {
    name: string;
    facility: { name: string };
  } | null;
}

interface RecentActivityProps {
  movements: Movement[];
}

export function RecentActivity({ movements }: RecentActivityProps) {
  const getMovementLabel = (type: string) => {
    switch (type) {
      case "intake":
        return "Stock Receipt / Intake";
      case "transfer":
        return "Inter-Department Transfer";
      case "dispense":
        return "Prescription Dispense";
      case "adjustment":
        return "Stock Audit Correction";
      case "quarantine":
        return "Clinical Quarantine";
      case "disposal":
        return "Safe Disposal";
      default:
        return type;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <History className="h-4 w-4 text-slate-500" />
          Recent Stock Movements & Audit Trail
        </CardTitle>
        <CardDescription className="text-xs">
          Verifiable clinical log of intakes, transfers, dispensing and quarantines
        </CardDescription>
      </CardHeader>
      <CardContent>
        {movements.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No stock movements recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {movements.map((m) => {
              const isTransfer = m.movementType === "transfer";
              const isIntake = m.movementType === "intake";
              const isReduction = m.movementType === "dispense" || m.movementType === "disposal";

              const formattedDate = new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(m.createdAt));

              return (
                <div key={m.id} className="flex items-center justify-between py-2.5 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full border shrink-0",
                        isTransfer
                          ? "bg-blue-50 text-blue-600 border-blue-200"
                          : isIntake
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-rose-50 text-rose-600 border-rose-200"
                      )}
                    >
                      {isTransfer ? (
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                      ) : isIntake ? (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                        <span>{m.batch.medicine.name}</span>
                        {m.batch.medicine.strength && (
                          <span className="text-[10px] text-slate-500">({m.batch.medicine.strength})</span>
                        )}
                        <span className="font-mono text-[10px] text-slate-400 font-normal">
                          Lot: {m.batch.batchNumber}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {getMovementLabel(m.movementType)} • {m.performedBy}
                        {m.sourceLocation && m.destinationLocation && (
                          <span className="ml-1 text-slate-400">
                            ({m.sourceLocation.name} → {m.destinationLocation.name})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={cn(
                        "font-mono font-bold text-xs",
                        isIntake ? "text-emerald-700" : isReduction ? "text-rose-700" : "text-blue-700"
                      )}
                    >
                      {isIntake ? `+${m.quantity}` : isReduction ? `-${m.quantity}` : `${m.quantity}`}{" "}
                      units
                    </span>
                    <p className="text-[10px] text-slate-400">{formattedDate}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
