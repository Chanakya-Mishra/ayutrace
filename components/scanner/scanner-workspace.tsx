"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileText,
  Key,
  ShieldAlert,
  Building2,
  MapPin,
  Pill,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScannedMedicineResult } from "@/lib/ai/gemma";
import { parseMedicineExpiryDate } from "@/lib/inventory/dates";

export function ScannerWorkspace() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"scan" | "manual">("scan");

  // Facilities & Locations
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>("");
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Scanning status
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [apiMissing, setApiMissing] = useState(false);
  const [extractedData, setExtractedData] = useState<ScannedMedicineResult | null>(null);

  // Editable Form State
  const [formData, setFormData] = useState({
    name: "",
    genericName: "",
    brand: "",
    manufacturer: "",
    strength: "",
    dosageForm: "Tablet",
    category: "General",
    packSize: "",
    storageInstructions: "",
    scheduleType: "Schedule H",
    warnings: "",
    batchNumber: "",
    manufacturingDateText: "",
    expiryDateText: "",
    normalizedExpiryDate: "",
    quantity: 10,
    notes: "",
    verifiedBy: "Staff Pharmacist",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load facilities and locations
  useEffect(() => {
    fetch("/api/facilities")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.length > 0) {
          setFacilities(json.data);
          setSelectedFacilityId(json.data[0].id);
          setLocations(json.data[0].locations || []);
          if (json.data[0].locations?.length > 0) {
            setSelectedLocationId(json.data[0].locations[0].id);
          }
        }
      })
      .catch((err) => console.error("Error loading facilities:", err));
  }, []);

  // Update locations when facility changes
  const handleFacilityChange = (facId: string) => {
    setSelectedFacilityId(facId);
    const fac = facilities.find((f) => f.id === facId);
    if (fac && fac.locations?.length > 0) {
      setLocations(fac.locations);
      setSelectedLocationId(fac.locations[0].id);
    } else {
      setLocations([]);
      setSelectedLocationId("");
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
      setScanError("Please select a valid image file (JPG, JPEG, or PNG).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setScanError("File exceeds 8MB limit. Please upload a compressed image.");
      return;
    }

    setScanError(null);
    setImageFile(file);
    setExtractedData(null);
    setSaveSuccess(false);

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Trigger server-side Gemma 4 extraction
  const handleAnalyze = async () => {
    if (!imagePreview || !imageFile) return;

    setIsScanning(true);
    setScanError(null);
    setApiMissing(false);

    try {
      const res = await fetch("/api/scan-medicine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imagePreview,
          mimeType: imageFile.type,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        if (res.status === 503 || result.isConfigured === false) {
          setApiMissing(true);
        }
        throw new Error(result.error || "Gemma 4 vision analysis failed");
      }

      const data: ScannedMedicineResult = result.data;
      setExtractedData(data);

      // Parse normalized date with statutory drug last-day-of-month policy
      const parsedDate = parseMedicineExpiryDate(data.expiryDateText);

      setFormData((prev) => ({
        ...prev,
        name: data.medicineName || "",
        genericName: data.genericName || "",
        brand: data.brand || "",
        manufacturer: data.manufacturer || "",
        strength: data.strength || "",
        dosageForm: data.dosageForm || "Tablet",
        packSize: data.packSize || "",
        storageInstructions: data.storageInstructions || "",
        scheduleType: data.scheduleType || "Schedule H",
        warnings: data.uncertaintyWarnings || "",
        batchNumber: data.batchNumber || "",
        manufacturingDateText: data.manufacturingDateText || "",
        expiryDateText: data.expiryDateText || "",
        normalizedExpiryDate: parsedDate.isoDate ? parsedDate.isoDate.split("T")[0] : "",
        notes: data.uncertaintyWarnings ? `AI Notice: ${data.uncertaintyWarnings}` : "",
      }));
    } catch (err: any) {
      setScanError(err.message || "Failed to analyze packaging photo");
    } finally {
      setIsScanning(false);
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setImagePreview(null);
    setExtractedData(null);
    setScanError(null);
    setApiMissing(false);
    setSaveSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveToInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setScanError("Medicine commercial name is required.");
      return;
    }
    if (!formData.batchNumber.trim()) {
      setScanError("Batch / Lot number is mandatory for clinical traceability.");
      return;
    }
    if (!selectedFacilityId || !selectedLocationId) {
      setScanError("Please select a target facility and storage department.");
      return;
    }

    setIsSubmitting(true);
    setScanError(null);

    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          facilityId: selectedFacilityId,
          locationId: selectedLocationId,
          quantity: Number(formData.quantity) || 1,
          verifiedByStaff: true,
          scanConfidence: extractedData?.rawConfidence || "manual",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to commit medicine batch to inventory");
      }

      setSaveSuccess(true);
      setTimeout(() => {
        router.push("/inventory");
      }, 1200);
    } catch (err: any) {
      setScanError(err.message || "Failed to commit inventory record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Workflow Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab("scan");
            setScanError(null);
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === "scan"
              ? "border-teal-700 text-teal-800"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          AI Packaging Scanner (Gemma 4)
        </button>
        <button
          onClick={() => {
            setActiveTab("manual");
            setScanError(null);
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === "manual"
              ? "border-teal-700 text-teal-800"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileText className="h-4 w-4" />
          Manual Medicine Intake
        </button>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-teal-900 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-teal-700 shrink-0" />
          <div>
            <p className="font-bold text-sm">Medicine Batch Verified & Committed to Inventory!</p>
            <p className="text-xs text-teal-700">Redirecting to clinical inventory register...</p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {scanError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">Clinical Notice</p>
            <p className="text-xs text-rose-700 mt-0.5">{scanError}</p>
            {apiMissing && (
              <div className="mt-3 rounded-lg border border-rose-300 bg-white p-3 text-xs text-slate-700 space-y-1.5">
                <p className="font-semibold flex items-center gap-1.5 text-slate-900">
                  <Key className="h-3.5 w-3.5 text-amber-600" />
                  How to enable Gemma 4 AI scanning:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                  <li>Obtain a Gemini API key from Google AI Studio.</li>
                  <li>
                    Open <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.env</code> in the project root.
                  </li>
                  <li>
                    Set: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">GEMINI_API_KEY=your_key_here</code>
                  </li>
                  <li>
                    In the meantime, switch to <strong>Manual Medicine Intake</strong> to register stock immediately without an API key!
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Facility & Department Allocation Card */}
      <Card className="bg-slate-50/80 border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider shrink-0">
              <Building2 className="h-4 w-4 text-teal-700" />
              Intake Destination:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Target Facility</label>
                <Select
                  value={selectedFacilityId}
                  onChange={(e) => handleFacilityChange(e.target.value)}
                  className="mt-0.5 text-xs font-medium"
                >
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.type})
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Storage Location / Department</label>
                <Select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="mt-0.5 text-xs font-medium"
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mode 1: AI Scanner */}
      {activeTab === "scan" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Image Upload Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-900">
                  1. Medicine Package Ingestion
                </CardTitle>
                <CardDescription className="text-xs">
                  Upload packaging photo showing composition, brand, batch and printed expiry date
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!imagePreview ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFile(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
                      isDragging
                        ? "border-teal-600 bg-teal-50/50"
                        : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
                    }`}
                  >
                    <div className="rounded-full bg-white p-3 shadow-xs border border-slate-200">
                      <Upload className="h-6 w-6 text-slate-500" />
                    </div>
                    <p className="mt-3 text-xs font-bold text-slate-700">
                      Click to upload medicine label or drag & drop
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      JPG, JPEG, or PNG blister/box photo up to 8MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Medicine label scan preview"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{imageFile?.name}</span>
                      <span>{((imageFile?.size || 0) / 1024).toFixed(1)} KB</span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleAnalyze}
                        disabled={isScanning}
                        className="flex-1 gap-2 bg-teal-700 hover:bg-teal-800"
                      >
                        <Sparkles className="h-4 w-4" />
                        {isScanning ? "Gemma 4 Reading Label..." : "Analyze Packaging with Gemma 4"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleReset}
                        disabled={isScanning}
                        size="icon"
                        title="Upload another photo"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Statutory Healthcare Notice */}
                <div className="rounded-lg bg-teal-50/60 p-3 text-[11px] text-teal-900 border border-teal-200/60 flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-teal-950">Statutory Clinical Notice: </span>
                    AI extraction is assistive. Pharmacist confirmation is mandatory before any medicine
                    batch is committed to physical ward stock. Missing dates are never fabricated.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Verification Form (7 cols) */}
          <div className="lg:col-span-7">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900">
                      2. Mandatory Pharmacist Verification
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Verify composition, strength, lot number, and expiry before committing stock
                    </CardDescription>
                  </div>
                  {extractedData && (
                    <Badge variant={extractedData.rawConfidence === "high" ? "success" : "alert"}>
                      Extraction: {extractedData.rawConfidence} confidence
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveToInventory} className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">
                        Commercial Medicine Name <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Paracip 500, Augmentin 625 Duo"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Active Generic Composition</label>
                      <Input
                        value={formData.genericName}
                        onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                        placeholder="e.g. Paracetamol Tablets IP"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Strength</label>
                      <Input
                        value={formData.strength}
                        onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                        placeholder="e.g. 500 mg, 625 mg"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Dosage Form</label>
                      <Select
                        value={formData.dosageForm}
                        onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                        className="mt-1 text-xs"
                      >
                        <option value="Tablet">Tablet</option>
                        <option value="Capsule">Capsule</option>
                        <option value="Syrup">Syrup / Suspension</option>
                        <option value="Injection">Injection / Vial</option>
                        <option value="Ointment">Ointment / Cream</option>
                        <option value="Drops">Eye/Ear Drops</option>
                        <option value="IV Fluid">IV Fluid Infusion</option>
                        <option value="Inhaler">Inhaler / Respule</option>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Manufacturer</label>
                      <Input
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                        placeholder="e.g. Cipla Ltd"
                        className="mt-1 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 border-t border-slate-100 pt-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">
                        Batch / Lot Number <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        value={formData.batchNumber}
                        onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                        placeholder="e.g. B240901"
                        required
                        className="mt-1 font-mono text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Raw Printed Expiry</label>
                      <Input
                        value={formData.expiryDateText}
                        onChange={(e) => {
                          const val = e.target.value;
                          const parsed = parseMedicineExpiryDate(val);
                          setFormData({
                            ...formData,
                            expiryDateText: val,
                            normalizedExpiryDate: parsed.isoDate ? parsed.isoDate.split("T")[0] : formData.normalizedExpiryDate,
                          });
                        }}
                        placeholder="e.g. 08/2026 or 15/08/2026"
                        className="mt-1 font-mono text-xs"
                      />
                      <p className="mt-0.5 text-[10px] text-slate-400">Month/Year: last day of month rule</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Calculated Cutoff Date</label>
                      <Input
                        type="date"
                        value={formData.normalizedExpiryDate}
                        onChange={(e) => setFormData({ ...formData, normalizedExpiryDate: e.target.value })}
                        className="mt-1 text-xs"
                      />
                      <p className="mt-0.5 text-[10px] text-slate-400">Used for FEFO rotation</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 border-t border-slate-100 pt-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">
                        Physical Stock Quantity <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                        className="mt-1 font-bold"
                        required
                      />
                      <p className="mt-0.5 text-[10px] text-slate-400">Units/strips received</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Pack Size</label>
                      <Input
                        value={formData.packSize}
                        onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
                        placeholder="e.g. Strip of 10 Tablets"
                        className="mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Verifying Pharmacist</label>
                      <Input
                        value={formData.verifiedBy}
                        onChange={(e) => setFormData({ ...formData, verifiedBy: e.target.value })}
                        className="mt-1 text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Storage Instructions & Notes</label>
                    <Textarea
                      value={formData.storageInstructions}
                      onChange={(e) => setFormData({ ...formData, storageInstructions: e.target.value })}
                      placeholder="e.g. Store below 25°C. Protect from moisture and light."
                      rows={2}
                      className="mt-1 text-xs"
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting || !formData.name.trim() || !formData.batchNumber.trim()}
                      className="w-full gap-2 font-bold bg-teal-700 hover:bg-teal-800"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {isSubmitting ? "Committing Verified Batch..." : "Verify & Commit Medicine Batch to Inventory"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Mode 2: Manual Medicine Intake */}
      {activeTab === "manual" && (
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">
              Manual Medicine Intake Registration
            </CardTitle>
            <CardDescription className="text-xs">
              Directly register pharmaceutical stock into AyuTrace without packaging photo scans.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveToInventory} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Medicine Commercial Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Azithral 500"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Generic Composition</label>
                  <Input
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    placeholder="e.g. Azithromycin Tablets IP"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Strength</label>
                  <Input
                    value={formData.strength}
                    onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                    placeholder="e.g. 500 mg"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Dosage Form</label>
                  <Select
                    value={formData.dosageForm}
                    onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                    className="mt-1 text-xs"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment</option>
                    <option value="Drops">Drops</option>
                    <option value="IV Fluid">IV Fluid</option>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Manufacturer</label>
                  <Input
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="e.g. Alembic Pharma"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 border-t border-slate-100 pt-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Batch / Lot Number <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    placeholder="e.g. LOT-24A01"
                    required
                    className="mt-1 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Printed Expiry Text</label>
                  <Input
                    value={formData.expiryDateText}
                    onChange={(e) => {
                      const val = e.target.value;
                      const parsed = parseMedicineExpiryDate(val);
                      setFormData({
                        ...formData,
                        expiryDateText: val,
                        normalizedExpiryDate: parsed.isoDate ? parsed.isoDate.split("T")[0] : formData.normalizedExpiryDate,
                      });
                    }}
                    placeholder="e.g. 11/2026"
                    className="mt-1 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Target Expiry Date</label>
                  <Input
                    type="date"
                    value={formData.normalizedExpiryDate}
                    onChange={(e) => setFormData({ ...formData, normalizedExpiryDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 border-t border-slate-100 pt-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Physical Stock Quantity <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    className="mt-1 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Verifying Pharmacist</label>
                  <Input
                    value={formData.verifiedBy}
                    onChange={(e) => setFormData({ ...formData, verifiedBy: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.name.trim() || !formData.batchNumber.trim()}
                  className="w-full gap-2 font-bold bg-teal-700 hover:bg-teal-800"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isSubmitting ? "Committing Record..." : "Register Medicine Batch into Stock"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
