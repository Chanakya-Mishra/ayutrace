"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";

interface StockAdjustModalProps {
  batch: {
    id: string;
    batchNumber: string;
    medicine: {
      name: string;
      strength: string | null;
      dosageForm: string;
    };
    balances: Array<{
      id: string;
      locationId: string;
      quantity: number;
      location: {
        id: string;
        name: string;
        facility: { name: string };
      };
    }>;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function StockAdjustModal({
  batch,
  isOpen,
  onClose,
  onSuccess,
}: StockAdjustModalProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("remove");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState<string>("dispense");
  const [notes, setNotes] = useState("");
  const [performedBy, setPerformedBy] = useState("Staff Pharmacist");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default to first location balance
  React.useEffect(() => {
    if (batch?.balances && batch.balances.length > 0) {
      setSelectedLocationId(batch.balances[0].locationId);
    }
  }, [batch]);

  if (!batch) return null;

  const currentBal = batch.balances.find((b) => b.locationId === selectedLocationId);
  const currentQty = currentBal ? currentBal.quantity : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocationId) {
      setError("Please select a storage location.");
      return;
    }
    if (quantity <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }

    const delta = adjustmentType === "add" ? quantity : -quantity;
    if (adjustmentType === "remove" && quantity > currentQty) {
      setError(`Cannot deduct ${quantity} units. Location only has ${currentQty} units available.`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/inventory/${batch.id}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: selectedLocationId,
          quantityChange: delta,
          reason,
          notes: notes.trim() || undefined,
          performedBy: performedBy.trim() || "Staff Pharmacist",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to adjust medicine stock");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Adjustment failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Medicine Stock Balance"
      description={`${batch.medicine.name} ${batch.medicine.strength || ""} • Lot: ${batch.batchNumber}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-slate-700">Select Storage Location</label>
          <Select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="mt-1 text-xs"
          >
            {batch.balances.map((b) => (
              <option key={b.locationId} value={b.locationId}>
                {b.location.facility.name} — {b.location.name} (Stock: {b.quantity})
              </option>
            ))}
          </Select>
        </div>

        <div className="flex gap-2 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setAdjustmentType("remove");
              setReason("dispense");
            }}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
              adjustmentType === "remove"
                ? "bg-white text-rose-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            - Deduct Stock (Dispense / Disposal)
          </button>
          <button
            type="button"
            onClick={() => {
              setAdjustmentType("add");
              setReason("stock_intake");
            }}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
              adjustmentType === "add"
                ? "bg-white text-teal-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            + Add Stock (Intake / Found)
          </button>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700">
            Quantity to {adjustmentType === "add" ? "Add" : "Deduct"} (Current: {currentQty})
          </label>
          <Input
            type="number"
            min="1"
            max={adjustmentType === "remove" ? currentQty : undefined}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="mt-1 font-bold text-sm"
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700">Clinical Rationale / Reason</label>
          <Select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 text-xs"
          >
            {adjustmentType === "remove" ? (
              <>
                <option value="dispense">Prescription Dispensing to Patient</option>
                <option value="quarantine">Quarantine Due to Expiry / Recall</option>
                <option value="disposal_expired">Safe Destruction / Incineration</option>
                <option value="damaged_in_transit">Damaged Packaging / Broken Vials</option>
                <option value="audit_correction">Audit Inventory Shrinkage</option>
              </>
            ) : (
              <>
                <option value="stock_intake">Stock Delivery / Supplier Intake</option>
                <option value="audit_correction">Audit Inventory Overage Found</option>
              </>
            )}
          </Select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700">Auditing Pharmacist / Staff</label>
          <Input
            value={performedBy}
            onChange={(e) => setPerformedBy(e.target.value)}
            className="mt-1 text-xs"
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700">Audit Notes (Optional)</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Cleared 5 damaged strips from OPD rack."
            rows={2}
            className="mt-1 text-xs"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={adjustmentType === "add" ? "primary" : "destructive"}
            disabled={isLoading}
            className={adjustmentType === "add" ? "bg-teal-700 hover:bg-teal-800" : ""}
          >
            {isLoading ? "Recording..." : "Confirm Stock Audit"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
