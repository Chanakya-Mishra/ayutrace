"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { formatDisplayDate } from "@/lib/inventory/dates";
import { Calendar, Clock, MapPin, ShieldAlert, Building2, Pill } from "lucide-react";

interface BatchDetailsModalProps {
  batchId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BatchDetailsModal({
  batchId,
  isOpen,
  onClose,
}: BatchDetailsModalProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (batchId && isOpen) {
      setIsLoading(true);
      fetch(`/api/inventory/${batchId}`)
        .then((res) => res.json())
        .then((res) => {
          if (res.success) setData(res.data);
        })
        .finally(() => setIsLoading(false));
    } else {
      setData(null);
    }
  }, [batchId, isOpen]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={data?.medicine ? `${data.medicine.name} ${data.medicine.strength || ""}` : "Medicine Batch"}
      description={data?.medicine?.genericName ? `Composition: ${data.medicine.genericName}` : undefined}
      maxWidth="xl"
    >
      {isLoading || !data ? (
        <div className="py-12 text-center text-sm text-slate-400">Loading clinical batch audit...</div>
      ) : (
        <div className="space-y-4 text-xs text-slate-700">
          {/* Attributes Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-lg bg-teal-50/50 p-3.5 border border-teal-200/60">
            <div>
              <span className="text-[10px] text-teal-800 uppercase font-bold">Lot Number</span>
              <p className="font-mono font-bold text-slate-900 mt-0.5">{data.batchNumber}</p>
            </div>
            <div>
              <span className="text-[10px] text-teal-800 uppercase font-bold">Total In Hand</span>
              <p className="font-bold text-teal-900 mt-0.5">{data.totalQuantity} units</p>
            </div>
            <div>
              <span className="text-[10px] text-teal-800 uppercase font-bold">Dosage Form</span>
              <p className="font-semibold text-slate-800 mt-0.5">{data.medicine.dosageForm}</p>
            </div>
            <div>
              <span className="text-[10px] text-teal-800 uppercase font-bold">Verification</span>
              <div className="mt-0.5">
                <Badge variant={data.verifiedByStaff ? "success" : "neutral"}>
                  {data.verifiedByStaff ? "Verified by Pharmacist" : "Pending Review"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Dates & Expiry Classification */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-200 p-2.5">
              <span className="flex items-center gap-1 font-semibold text-slate-800">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Printed Packaging Expiry
              </span>
              <p className="mt-1 font-mono font-bold text-slate-700">
                {data.expiryDateText || "Unrecorded"}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-2.5">
              <span className="flex items-center gap-1 font-semibold text-slate-800">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Computed Cutoff Date
              </span>
              <p className="mt-1 font-bold text-slate-900">
                {formatDisplayDate(data.normalizedExpiryDate)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-2.5">
              <span className="flex items-center gap-1 font-semibold text-slate-800">
                <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
                Clinical Dispensing State
              </span>
              <div className="mt-1">
                <Badge variant={data.evaluation?.badgeVariant || "neutral"}>
                  {data.evaluation?.label || data.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Storage Instructions & Statutory Schedule */}
          {(data.medicine.storageInstructions || data.medicine.scheduleType) && (
            <div className="rounded-lg bg-amber-50/70 border border-amber-200 p-3 space-y-1 text-slate-800">
              {data.medicine.storageInstructions && (
                <p>
                  <strong>Storage: </strong> {data.medicine.storageInstructions}
                </p>
              )}
              {data.medicine.scheduleType && (
                <p className="text-amber-900 font-semibold">
                  Regulatory Class: {data.medicine.scheduleType}
                </p>
              )}
            </div>
          )}

          {/* Location Balances */}
          <div>
            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-teal-700" />
              Stock Balances by Facility & Storage Department
            </h4>
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-2 font-semibold">Facility</th>
                    <th className="p-2 font-semibold">Department / Shelf</th>
                    <th className="p-2 font-semibold text-right">Available Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.balances?.map((b: any) => (
                    <tr key={b.id}>
                      <td className="p-2 font-medium text-slate-900">{b.location.facility.name}</td>
                      <td className="p-2 text-slate-600">{b.location.name}</td>
                      <td className="p-2 text-right font-mono font-bold text-teal-800">
                        {b.quantity} units
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Movements */}
          <div>
            <h4 className="font-bold text-slate-900 mb-2">Clinical Audit Trail & Movement History</h4>
            <div className="rounded-lg border border-slate-200 overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="p-2 font-semibold">Timestamp</th>
                    <th className="p-2 font-semibold">Action</th>
                    <th className="p-2 font-semibold text-right">Quantity</th>
                    <th className="p-2 font-semibold">Audited By</th>
                    <th className="p-2 font-semibold">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.movements?.map((m: any) => (
                    <tr key={m.id} className="hover:bg-slate-50/60">
                      <td className="p-2 text-slate-500">
                        {new Intl.DateTimeFormat("en-US", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(m.createdAt))}
                      </td>
                      <td className="p-2 font-semibold text-slate-800 capitalize">
                        {m.movementType}
                      </td>
                      <td className="p-2 text-right font-mono font-bold">
                        {m.quantity}
                      </td>
                      <td className="p-2 text-slate-700">{m.performedBy}</td>
                      <td className="p-2 text-slate-500 truncate max-w-[160px]">
                        {m.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
