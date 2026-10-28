"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  SlidersHorizontal,
  Trash2,
  Eye,
  Building2,
  Pill,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDisplayDate } from "@/lib/inventory/dates";
import { StockAdjustModal } from "@/components/inventory/stock-adjust-modal";
import { BatchDetailsModal } from "@/components/inventory/batch-details-modal";
import { useFacilities, useInventory } from "@/lib/hooks/use-swr-api";

export function InventoryView() {
  // Filters
  const [search, setSearch] = useState("");
  const [facilityId, setFacilityId] = useState("all");
  const [dosageForm, setDosageForm] = useState("all");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("normalizedExpiryDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // SWR data hooks
  const { facilities } = useFacilities();
  const {
    batches,
    isLoading,
    mutate: fetchInventory,
  } = useInventory({
    search,
    facilityId,
    dosageForm,
    status,
    sortBy,
    sortOrder,
  });

  // Modals
  const [selectedBatchForAdjust, setSelectedBatchForAdjust] = useState<any | null>(null);
  const [selectedBatchForDetails, setSelectedBatchForDetails] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to archive / delete batch for "${name}"?`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchInventory();
      } else {
        alert(json.error || "Failed to remove batch");
      }
    } catch (err: any) {
      alert(err.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medicine, generic, lot, manufacturer..."
              className="pl-8 text-xs"
            />
          </div>

          <Select
            value={facilityId}
            onChange={(e) => setFacilityId(e.target.value)}
            className="w-36 text-xs"
          >
            <option value="all">All Facilities</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>

          <Select
            value={dosageForm}
            onChange={(e) => setDosageForm(e.target.value)}
            className="w-32 text-xs"
          >
            <option value="all">All Forms</option>
            <option value="Tablet">Tablet</option>
            <option value="Capsule">Capsule</option>
            <option value="Syrup">Syrup</option>
            <option value="Injection">Injection</option>
            <option value="Drops">Drops</option>
            <option value="IV Fluid">IV Fluid</option>
          </Select>

          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-32 text-xs"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="near_expiry">Near Expiry</option>
            <option value="critical">Critical</option>
            <option value="expired">Expired</option>
            <option value="quarantined">Quarantined</option>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split("-");
              setSortBy(sb);
              setSortOrder(so as "asc" | "desc");
            }}
            className="w-40 text-xs"
          >
            <option value="normalizedExpiryDate-asc">Sort: Nearest Expiry</option>
            <option value="normalizedExpiryDate-desc">Sort: Furthest Expiry</option>
            <option value="name-asc">Sort: Medicine Name (A-Z)</option>
            <option value="createdAt-desc">Sort: Recently Added</option>
          </Select>

          <Link href="/scanner">
            <Button size="sm" className="gap-1.5 text-xs bg-teal-700 hover:bg-teal-800">
              <Plus className="h-3.5 w-3.5" />
              Intake Stock
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none">
              <tr>
                <th className="py-3 px-4">Medicine & Formulation</th>
                <th className="py-3 px-4">Strength & Form</th>
                <th className="py-3 px-4">Batch / Lot</th>
                <th className="py-3 px-4">Storage Facilities & Wards</th>
                <th className="py-3 px-4 text-right">In Hand</th>
                <th className="py-3 px-4">Expiry Cutoff</th>
                <th className="py-3 px-4">Dispensing State</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading medicine inventory records...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="mx-auto flex max-w-xs flex-col items-center">
                      <div className="rounded-full bg-slate-100 p-3 text-slate-400">
                        <Pill className="h-6 w-6" />
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-700">No medicines found</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {search || facilityId !== "all" || status !== "all"
                          ? "Try clearing filters to display records."
                          : "Start by scanning or manually adding your first medicine batch."}
                      </p>
                      <Link href="/scanner" className="mt-3">
                        <Button size="sm" variant="outline">
                          Scan Medicine
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Medicine Name & Generic Composition */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedBatchForDetails(batch.id)}
                        className="text-left font-bold text-slate-900 hover:text-teal-700 hover:underline block leading-tight"
                      >
                        {batch.medicine.name}
                      </button>
                      {batch.medicine.genericName && (
                        <span className="text-[11px] text-slate-500 italic block mt-0.5">
                          {batch.medicine.genericName}
                        </span>
                      )}
                      {batch.medicine.manufacturer && (
                        <span className="text-[10px] text-slate-400 block">
                          Mfg: {batch.medicine.manufacturer}
                        </span>
                      )}
                    </td>

                    {/* Strength & Dosage Form */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">
                        {batch.medicine.strength || "—"}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 font-medium">
                        {batch.medicine.dosageForm}
                      </span>
                    </td>

                    {/* Batch Number */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {batch.batchNumber}
                      </span>
                      {batch.expiryDateText && (
                        <span className="text-[10px] text-slate-400 block font-mono">
                          Label: &quot;{batch.expiryDateText}&quot;
                        </span>
                      )}
                    </td>

                    {/* Facilities & Locations */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5 max-w-[200px]">
                        {batch.balances.map((b: any) => (
                          <div key={b.id} className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600 truncate">
                              {b.location.facility.name} — {b.location.name}
                            </span>
                            <span className="font-mono font-bold text-slate-800 ml-1">
                              {b.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* In Hand Total Quantity */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-bold text-sm text-slate-900">
                        {batch.totalQuantity}
                      </span>
                      <span className="text-slate-400 text-[11px] ml-1">units</span>
                    </td>

                    {/* Expiry Date */}
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {formatDisplayDate(batch.normalizedExpiryDate)}
                    </td>

                    {/* Dispensing State */}
                    <td className="py-3 px-4">
                      <Badge variant={batch.evaluation?.badgeVariant || "neutral"}>
                        {batch.evaluation?.label || batch.status}
                      </Badge>
                      {batch.evaluation?.isDispensingBlocked && (
                        <span className="block text-[9px] font-bold uppercase text-rose-700 mt-0.5">
                          Blocked
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedBatchForAdjust(batch)}
                          className="h-7 text-xs px-2 gap-1 text-slate-700"
                          title="Adjust stock balance"
                        >
                          <SlidersHorizontal className="h-3 w-3" />
                          Adjust
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedBatchForDetails(batch.id)}
                          className="h-7 w-7 text-slate-500 hover:text-slate-800"
                          title="View clinical batch details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deletingId === batch.id}
                          onClick={() => handleDelete(batch.id, batch.medicine.name)}
                          className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Archive batch"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Adjust Modal */}
      <StockAdjustModal
        batch={selectedBatchForAdjust}
        isOpen={Boolean(selectedBatchForAdjust)}
        onClose={() => setSelectedBatchForAdjust(null)}
        onSuccess={fetchInventory}
      />

      {/* Batch Details Modal */}
      <BatchDetailsModal
        batchId={selectedBatchForDetails}
        isOpen={Boolean(selectedBatchForDetails)}
        onClose={() => setSelectedBatchForDetails(null)}
      />
    </div>
  );
}
