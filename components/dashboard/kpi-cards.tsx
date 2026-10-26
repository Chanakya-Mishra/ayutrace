"use client";

import React from "react";
import Link from "next/link";
import { Pill, Boxes, Layers, ClockAlert, AlertOctagon, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardsProps {
  registeredMedicines: number;
  totalStockUnits: number;
  activeBatches: number;
  nearExpiryBatches: number;
  expiredBatches: number;
  trackingFacilities: number;
}

export function KpiCards({
  registeredMedicines,
  totalStockUnits,
  activeBatches,
  nearExpiryBatches,
  expiredBatches,
  trackingFacilities,
}: KpiCardsProps) {
  const cards = [
    {
      title: "Registered Medicines",
      value: registeredMedicines,
      subtitle: "Unique drug formulations",
      icon: Pill,
      href: "/inventory",
      color: "text-teal-700 bg-teal-50 border-teal-200",
    },
    {
      title: "Recorded Stock Units",
      value: totalStockUnits,
      subtitle: "Packs across all wards",
      icon: Boxes,
      href: "/inventory",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Active Batches",
      value: activeBatches,
      subtitle: "Distinct lots tracked",
      icon: Layers,
      href: "/inventory",
      color: "text-blue-700 bg-blue-50 border-blue-200",
    },
    {
      title: "Near Expiry (≤90d)",
      value: nearExpiryBatches,
      subtitle: "Priority dispensing queue",
      icon: ClockAlert,
      href: "/expiry",
      color: "text-amber-700 bg-amber-50 border-amber-200",
    },
    {
      title: "Expired / Blocked",
      value: expiredBatches,
      subtitle: "Quarantined from dispensing",
      icon: AlertOctagon,
      href: "/expiry",
      color: "text-rose-700 bg-rose-50 border-rose-200",
    },
    {
      title: "Healthcare Facilities",
      value: trackingFacilities,
      subtitle: "Hospitals, clinics & stores",
      icon: Building2,
      href: "/facilities",
      color: "text-slate-700 bg-slate-100 border-slate-200",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link key={card.title} href={card.href} className="group block">
            <Card className="p-3.5 transition-all hover:border-slate-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  {card.title}
                </span>
                <div className={cn("rounded-md p-1.5 border shrink-0", card.color)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  {card.value.toLocaleString()}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-slate-400 group-hover:text-slate-600 transition-colors truncate">
                {card.subtitle} →
              </p>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
