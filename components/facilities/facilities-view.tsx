"use client";

import React, { useState } from "react";
import {
  Building2,
  Plus,
  MapPin,
  Boxes,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useFacilities } from "@/lib/hooks/use-swr-api";

export function FacilitiesView() {
  const { facilities, isLoading, mutate: loadFacilities } = useFacilities();

  // New facility modal
  const [isAddFacilityOpen, setIsAddFacilityOpen] = useState(false);
  const [newFacilityName, setNewFacilityName] = useState("");
  const [newFacilityType, setNewFacilityType] = useState("hospital");
  const [newFacilityCity, setNewFacilityCity] = useState("");

  // New location modal
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [selectedFacilityForLocation, setSelectedFacilityForLocation] = useState<string>("");
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationDesc, setNewLocationDesc] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacilityName.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/facilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFacilityName.trim(),
          type: newFacilityType,
          city: newFacilityCity.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create facility");
      }

      setNewFacilityName("");
      setNewFacilityCity("");
      setIsAddFacilityOpen(false);
      loadFacilities();
    } catch (err: any) {
      setError(err.message || "Failed to save facility");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocationName.trim() || !selectedFacilityForLocation) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/facilities/${selectedFacilityForLocation}/locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newLocationName.trim(),
          description: newLocationDesc.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to add storage location");
      }

      setNewLocationName("");
      setNewLocationDesc("");
      setIsAddLocationOpen(false);
      loadFacilities();
    } catch (err: any) {
      setError(err.message || "Failed to save storage department");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Healthcare Facilities & Storage Departments
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered hospitals, clinics, and internal storage rooms across the network
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsAddFacilityOpen(true)}
            className="text-xs h-8 gap-1.5 bg-teal-700 hover:bg-teal-800"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Facility
          </Button>
        </div>
      </div>

      {/* Facilities Cards List */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-slate-400">Loading facilities...</div>
      ) : facilities.length === 0 ? (
        <Card className="p-8 text-center">
          <Building2 className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm font-semibold text-slate-700">No facilities registered</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Create your first hospital or clinic to begin organizing medicine stock.
          </p>
          <Button
            size="sm"
            onClick={() => setIsAddFacilityOpen(true)}
            className="mt-3 bg-teal-700"
          >
            Add Facility
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {facilities.map((facility) => (
            <Card key={facility.id} className="overflow-hidden">
              <CardHeader className="bg-slate-50/70 border-b border-slate-200/80 pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold text-slate-900">
                        {facility.name}
                      </CardTitle>
                      <span className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-800">
                        {facility.type}
                      </span>
                    </div>
                    {facility.city && (
                      <CardDescription className="text-xs mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {facility.city}
                      </CardDescription>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-lg font-bold text-teal-800">
                      {facility.totalStockUnits}
                    </span>
                    <span className="text-[11px] text-slate-400 block -mt-1">units in stock</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Storage Departments ({facility.locations?.length || 0})
                  </span>
                  <button
                    onClick={() => {
                      setSelectedFacilityForLocation(facility.id);
                      setIsAddLocationOpen(true);
                    }}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add Department
                  </button>
                </div>

                <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 overflow-hidden text-xs">
                  {facility.locations?.map((loc: any) => {
                    const locTotal = loc.balances?.reduce((acc: number, b: any) => acc + b.quantity, 0) || 0;
                    return (
                      <div key={loc.id} className="flex items-center justify-between p-2.5 hover:bg-slate-50/60">
                        <div>
                          <p className="font-semibold text-slate-900">{loc.name}</p>
                          {loc.description && (
                            <p className="text-[11px] text-slate-400">{loc.description}</p>
                          )}
                        </div>
                        <span className="font-mono font-bold text-slate-700">
                          {locTotal} units
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Facility Modal */}
      <Modal
        isOpen={isAddFacilityOpen}
        onClose={() => setIsAddFacilityOpen(false)}
        title="Register Healthcare Facility"
        description="Add a new hospital, outpatient clinic, dispensary, or central stockroom"
        maxWidth="md"
      >
        <form onSubmit={handleCreateFacility} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700">
              Facility Name <span className="text-rose-500">*</span>
            </label>
            <Input
              value={newFacilityName}
              onChange={(e) => setNewFacilityName(e.target.value)}
              placeholder="e.g. Metro Care Hospital"
              required
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Facility Type</label>
              <Select
                value={newFacilityType}
                onChange={(e) => setNewFacilityType(e.target.value)}
                className="mt-1 text-xs"
              >
                <option value="hospital">Hospital</option>
                <option value="clinic">Clinic</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="dispensary">Dispensary</option>
                <option value="stockroom">Medical Stockroom</option>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">City / Location</label>
              <Input
                value={newFacilityCity}
                onChange={(e) => setNewFacilityCity(e.target.value)}
                placeholder="e.g. New Delhi"
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddFacilityOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !newFacilityName.trim()}
              className="bg-teal-700 hover:bg-teal-800"
            >
              {isSubmitting ? "Creating..." : "Save Facility"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Location Modal */}
      <Modal
        isOpen={isAddLocationOpen}
        onClose={() => setIsAddLocationOpen(false)}
        title="Add Storage Department / Shelf"
        description="Define an internal dispensing counter, emergency cart, or cold chain room"
        maxWidth="md"
      >
        <form onSubmit={handleCreateLocation} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700">
              Department / Storage Name <span className="text-rose-500">*</span>
            </label>
            <Input
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              placeholder="e.g. ICU Crash Cart, Pediatric Shelf A"
              required
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Description / Temperature Profile</label>
            <Input
              value={newLocationDesc}
              onChange={(e) => setNewLocationDesc(e.target.value)}
              placeholder="e.g. Controlled room temperature (below 25°C)"
              className="mt-1 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddLocationOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !newLocationName.trim()}
              className="bg-teal-700 hover:bg-teal-800"
            >
              {isSubmitting ? "Adding..." : "Add Department"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
