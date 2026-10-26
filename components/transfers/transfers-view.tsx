"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  Building2,
  CheckCircle2,
  AlertTriangle,
  History,
  ShieldCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";

export function TransfersView() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [sourceLocationId, setSourceLocationId] = useState<string>("");
  const [destinationLocationId, setDestinationLocationId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>("Inter-ward emergency replenishment");
  const [notes, setNotes] = useState<string>("");
  const [performedBy, setPerformedBy] = useState<string>("Staff Pharmacist");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [transfersRes, inventoryRes, facilitiesRes] = await Promise.all([
        fetch("/api/transfers"),
        fetch("/api/inventory"),
        fetch("/api/facilities"),
      ]);

      const [transfersJson, inventoryJson, facilitiesJson] = await Promise.all([
        transfersRes.json(),
        inventoryRes.json(),
        facilitiesRes.json(),
      ]);

      if (transfersJson.success) setTransfers(transfersJson.data || []);
      if (inventoryJson.success) {
        setBatches(inventoryJson.data || []);
        if (inventoryJson.data?.length > 0) {
          const firstBatch = inventoryJson.data[0];
          setSelectedBatchId(firstBatch.id);
          if (firstBatch.balances?.length > 0) {
            setSourceLocationId(firstBatch.balances[0].locationId);
          }
        }
      }
      if (facilitiesJson.success) {
        setFacilities(facilitiesJson.data || []);
        // Set default destination
        const allLocs = facilitiesJson.data.flatMap((f: any) => f.locations || []);
        if (allLocs.length > 1) {
          setDestinationLocationId(allLocs[1].id);
        }
      }
    } catch (err) {
      console.error("Failed to load transfer data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);
  const sourceBalance = selectedBatch?.balances?.find((b: any) => b.locationId === sourceLocationId);
  const availableAtSource = sourceBalance ? sourceBalance.quantity : 0;

  // Flatten all locations for destination dropdown
  const allLocations = facilities.flatMap((f) =>
    (f.locations || []).map((l: any) => ({
      ...l,
      facilityName: f.name,
    }))
  );

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId || !sourceLocationId || !destinationLocationId) {
      setError("Please select a batch and both locations.");
      return;
    }
    if (sourceLocationId === destinationLocationId) {
      setError("Source and destination storage departments cannot be identical.");
      return;
    }
    if (quantity <= 0) {
      setError("Transfer quantity must be at least 1 unit.");
      return;
    }
    if (quantity > availableAtSource) {
      setError(`Cannot transfer ${quantity} units. Source location only has ${availableAtSource} units available.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: selectedBatchId,
          sourceLocationId,
          destinationLocationId,
          quantity: Number(quantity),
          reason: reason.trim(),
          notes: notes.trim() || undefined,
          performedBy: performedBy.trim() || "Staff Pharmacist",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to execute transfer");
      }

      setSuccess(true);
      setQuantity(1);
      setNotes("");
      loadData();
      setTimeout(() => setSuccess(false), 3500);
    } catch (err: any) {
      setError(err.message || "Transfer failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Transfer Execution Form & Context */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Transfer Action Card (7 cols) */}
        <div className="lg:col-span-7">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4 text-teal-700" />
                Inter-Department Medicine Transfer
              </CardTitle>
              <CardDescription className="text-xs">
                Move medicine batches between hospital wards, dispensaries, or community clinics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success && (
                <div className="mb-4 rounded-lg bg-teal-50 border border-teal-200 p-3 text-xs text-teal-900 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0" />
                  <span>Transfer executed atomically and recorded in clinical audit log.</span>
                </div>
              )}

              {error && (
                <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleTransfer} className="space-y-4">
                {/* Select Medicine Batch */}
                <div>
                  <label className="text-xs font-semibold text-slate-700">Select Medicine Batch</label>
                  <Select
                    value={selectedBatchId}
                    onChange={(e) => {
                      const bId = e.target.value;
                      setSelectedBatchId(bId);
                      const b = batches.find((item) => item.id === bId);
                      if (b?.balances?.length > 0) {
                        setSourceLocationId(b.balances[0].locationId);
                      }
                    }}
                    className="mt-1 text-xs"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.medicine.name} {b.medicine.strength || ""} (Lot: {b.batchNumber}) — Total: {b.totalQuantity} units
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Source & Destination Locations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Source Location</label>
                    <Select
                      value={sourceLocationId}
                      onChange={(e) => setSourceLocationId(e.target.value)}
                      className="mt-1 text-xs font-medium"
                    >
                      {selectedBatch?.balances?.map((bal: any) => (
                        <option key={bal.locationId} value={bal.locationId}>
                          {bal.location.facility.name} — {bal.location.name} ({bal.quantity} available)
                        </option>
                      ))}
                    </Select>
                    <p className="mt-1 text-[11px] text-teal-800 font-semibold">
                      Available to transfer: {availableAtSource} units
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Destination Location</label>
                    <Select
                      value={destinationLocationId}
                      onChange={(e) => setDestinationLocationId(e.target.value)}
                      className="mt-1 text-xs font-medium"
                    >
                      {allLocations.map((loc: any) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.facilityName} — {loc.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Quantity & Performer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      Transfer Units <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max={availableAtSource}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="mt-1 font-bold text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Authorized Pharmacist</label>
                    <Input
                      value={performedBy}
                      onChange={(e) => setPerformedBy(e.target.value)}
                      className="mt-1 text-xs"
                      required
                    />
                  </div>
                </div>

                {/* Reason & Notes */}
                <div>
                  <label className="text-xs font-semibold text-slate-700">Clinical Transfer Rationale</label>
                  <Select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-1 text-xs"
                  >
                    <option value="Inter-ward emergency replenishment">Inter-ward emergency replenishment</option>
                    <option value="Routine dispensary stock rebalancing">Routine dispensary stock rebalancing</option>
                    <option value="Cold chain relocation for temperature safety">Cold chain relocation for temperature safety</option>
                    <option value="Near-expiry front-load rotation">Near-expiry front-load rotation</option>
                    <option value="Quarantine isolation transfer">Quarantine isolation transfer</option>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Audit Notes (Optional)</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Dispatched 10 vials to ER Ward crash cart."
                    rows={2}
                    className="mt-1 text-xs"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting || availableAtSource === 0}
                    className="w-full gap-2 font-bold bg-teal-700 hover:bg-teal-800"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                    {isSubmitting ? "Executing Transfer..." : "Execute Atomic Stock Transfer"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Transfer Safety & Traceability Guidelines (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="bg-teal-50/50 border-teal-200/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-teal-950 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-teal-700" />
                Transfer Integrity Protocol
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs text-teal-900 leading-relaxed">
              <p>
                <strong>Zero Negative Stock:</strong> Transactions are atomic. If source balance is insufficient,
                the operation is rejected with an explicit error before any state changes occur.
              </p>
              <p>
                <strong>Batch Identity Preservation:</strong> Lot numbers and original expiry timestamps are
                strictly preserved when medicines are relocated across wards.
              </p>
              <p>
                <strong>Audit Compliance:</strong> Every transfer records the source location, destination,
                quantity, approving pharmacist, and clinical reason.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Transfers Log Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="h-4 w-4 text-slate-500" />
            Verified Transfer Audit Trail
          </CardTitle>
          <CardDescription className="text-xs">
            Completed inter-department and inter-facility stock movements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transfers.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No inter-department stock transfers executed yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Medicine Formulation</th>
                    <th className="py-2.5 px-3">Lot Number</th>
                    <th className="py-2.5 px-3">Source → Destination</th>
                    <th className="py-2.5 px-3 text-right">Transferred Units</th>
                    <th className="py-2.5 px-3">Audited By</th>
                    <th className="py-2.5 px-3">Clinical Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transfers.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 text-slate-500">
                        {new Intl.DateTimeFormat("en-US", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(t.createdAt))}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {t.batch.medicine.name}
                        {t.batch.medicine.strength && (
                          <span className="text-[10px] text-slate-400 ml-1">
                            ({t.batch.medicine.strength})
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {t.batch.batchNumber}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-slate-600">{t.sourceLocation?.name || "Stockroom"}</span>
                        <span className="text-slate-400 mx-1.5">→</span>
                        <span className="font-semibold text-slate-900">
                          {t.destinationLocation?.name || "Dispensary"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-800">
                        {t.quantity} units
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {t.performedBy}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 truncate max-w-[200px]">
                        {t.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
