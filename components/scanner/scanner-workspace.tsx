"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Camera,
  ScanLine,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileText,
  Building2,
  MapPin,
  Pill,
  Calendar,
  ShieldCheck,
  ChevronRight,
  Layers,
  Clock,
  Plus,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScannedMedicineResult } from "@/lib/ai/gemma";
import { parseMedicineExpiryDate } from "@/lib/inventory/dates";
import {
  SAMPLE_MEDICINE_PACKAGES,
  SampleMedicinePackage,
} from "@/lib/ai/sample-packages";

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

  // Load facilities and locations on mount
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
      setScanError("Please select a valid packaging image (JPG, PNG, or WebP).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setScanError("Image exceeds 8MB limit. Please upload a compressed photo.");
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

  // 1-Click Sample Ingestion
  const handleSelectSample = (sample: SampleMedicinePackage) => {
    setImageFile(new File(["sample"], `${sample.id}.svg`, { type: "image/svg+xml" }));
    setImagePreview(sample.svgDataUri);
    setScanError(null);
    setSaveSuccess(false);

    const parsedDate = parseMedicineExpiryDate(sample.expDate);
    setFormData((prev) => ({
      ...prev,
      name: sample.name,
      genericName: sample.genericName,
      brand: sample.name.split(" ")[0],
      manufacturer: sample.manufacturer,
      strength: sample.strength,
      dosageForm: sample.dosageForm,
      category: sample.category,
      batchNumber: sample.batchNumber,
      manufacturingDateText: sample.mfgDate,
      expiryDateText: sample.expDate,
      normalizedExpiryDate: parsedDate.isoDate ? parsedDate.isoDate.split("T")[0] : "",
      notes: "Sample packaging ingested for clinical verification.",
    }));

    setExtractedData({
      medicineName: sample.name,
      genericName: sample.genericName,
      brand: sample.name.split(" ")[0],
      strength: sample.strength,
      dosageForm: sample.dosageForm,
      manufacturer: sample.manufacturer,
      batchNumber: sample.batchNumber,
      manufacturingDateText: sample.mfgDate,
      expiryDateText: sample.expDate,
      packSize: sample.description,
      storageInstructions: "Store below 25°C. Protect from moisture & light.",
      scheduleType: sample.id === "paracip-500" ? "OTC" : "Schedule H",
      uncertaintyWarnings: "Verified against standard pharmaceutical packaging specifications.",
      rawConfidence: "high",
    });
  };

  // Trigger server-side AI OCR extraction
  const handleAnalyze = async () => {
    if (!imagePreview) return;

    setIsScanning(true);
    setScanError(null);

    try {
      const res = await fetch("/api/scan-medicine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imagePreview,
          imageName: imageFile?.name || "",
          mimeType: imageFile?.type || "image/jpeg",
          apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Packaging extraction encountered an error");
      }

      const data: ScannedMedicineResult = result.data;
      setExtractedData(data);

      const parsedDate = parseMedicineExpiryDate(data.expiryDateText);

      setFormData((prev) => ({
        ...prev,
        name: data.medicineName || prev.name,
        genericName: data.genericName || prev.genericName,
        brand: data.brand || prev.brand,
        manufacturer: data.manufacturer || prev.manufacturer,
        strength: data.strength || prev.strength,
        dosageForm: data.dosageForm || prev.dosageForm,
        packSize: data.packSize || prev.packSize,
        storageInstructions: data.storageInstructions || prev.storageInstructions,
        scheduleType: data.scheduleType || prev.scheduleType,
        warnings: data.uncertaintyWarnings || prev.warnings,
        batchNumber: data.batchNumber || prev.batchNumber,
        manufacturingDateText: data.manufacturingDateText || prev.manufacturingDateText,
        expiryDateText: data.expiryDateText || prev.expiryDateText,
        normalizedExpiryDate: parsedDate.isoDate ? parsedDate.isoDate.split("T")[0] : prev.normalizedExpiryDate,
        notes: data.uncertaintyWarnings && !data.uncertaintyWarnings.toLowerCase().includes("error")
          ? `AI Note: ${data.uncertaintyWarnings}`
          : "Verified from package scan for clinical intake.",
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
      setScanError("Please select a target healthcare facility and storage unit.");
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
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Header & Destination Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl">
          <button
            onClick={() => {
              setActiveTab("scan");
              setScanError(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "scan"
                ? "bg-white text-teal-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ScanLine className="h-3.5 w-3.5 text-teal-700" />
            AI Label Scanner
          </button>
          <button
            onClick={() => {
              setActiveTab("manual");
              setScanError(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "manual"
                ? "bg-white text-teal-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-teal-700" />
            Manual Intake
          </button>
        </div>

        {/* Destination Facility & Ward Selection */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Building2 className="h-3.5 w-3.5 text-teal-700" />
            <span className="hidden sm:inline">Intake To:</span>
          </div>
          <Select
            value={selectedFacilityId}
            onChange={(e) => handleFacilityChange(e.target.value)}
            className="h-8.5 text-xs font-semibold text-slate-800 bg-slate-50 border-slate-200 max-w-[190px]"
          >
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>
          <Select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="h-8.5 text-xs font-semibold text-slate-800 bg-slate-50 border-slate-200 max-w-[190px]"
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="rounded-2xl border border-teal-200 bg-teal-50/90 p-4 text-teal-900 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-5 w-5 text-teal-700 shrink-0" />
          <div>
            <p className="font-bold text-sm">Medicine Batch Verified & Ingested into Inventory!</p>
            <p className="text-xs text-teal-700">Redirecting to stock ledger...</p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {scanError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5 text-rose-900 flex items-start gap-3 text-xs">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-rose-950">Intake Notice</p>
            <p className="mt-0.5 text-rose-800">{scanError}</p>
          </div>
          <button
            onClick={() => setScanError(null)}
            className="text-rose-500 hover:text-rose-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* MODE 1: AI Scanner */}
      {activeTab === "scan" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Left Column: Image Capture & Quick Samples */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border-slate-200/90 shadow-xs">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Camera className="h-4 w-4 text-teal-700" />
                  1. Capture or Upload Package Photo
                </CardTitle>
                <CardDescription className="text-xs">
                  Snap a clear photo of the medicine box, blister pack, vial, or strip
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-4 pb-4">
                {!imagePreview ? (
                  <div className="space-y-3">
                    {/* Clean Dropzone */}
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
                      className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-7 text-center cursor-pointer transition-all ${
                        isDragging
                          ? "border-teal-600 bg-teal-50/60 scale-[1.01]"
                          : "border-slate-300 hover:border-teal-500 hover:bg-slate-50/70 bg-slate-50/30"
                      }`}
                    >
                      <div className="rounded-2xl bg-white p-3.5 shadow-xs border border-slate-200/80">
                        <Upload className="h-6 w-6 text-teal-700" />
                      </div>
                      <p className="mt-3 text-xs font-bold text-slate-800">
                        Drop packaging photo here or click to browse
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Supports JPG, PNG, and WebP (up to 8MB)
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/webp"
                        capture="environment"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFile(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                    </div>

                    {/* 1-Click Test Samples */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="h-3 w-3 text-teal-700" />
                          1-Click Test Samples
                        </span>
                        <span className="text-[10px] text-slate-400">Click to autofill</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {SAMPLE_MEDICINE_PACKAGES.map((sample) => (
                          <button
                            key={sample.id}
                            type="button"
                            onClick={() => handleSelectSample(sample)}
                            className="flex items-center gap-2 text-left p-2 rounded-xl border border-slate-200/90 bg-white hover:border-teal-400 hover:bg-teal-50/50 transition-all cursor-pointer group shadow-2xs"
                          >
                            <div className="h-7 w-7 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                              <Pill className="h-3.5 w-3.5 text-teal-700" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-800 truncate group-hover:text-teal-950">
                                {sample.name}
                              </p>
                              <p className="text-[10px] font-mono text-slate-500 truncate">
                                EXP: {sample.expDate}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Image Preview with Medical Viewfinder Styling */}
                    <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shadow-inner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Medicine label scan preview"
                        className="h-full w-full object-contain"
                      />
                      {isScanning && (
                        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-2xs flex flex-col items-center justify-center p-4">
                          <div className="absolute top-0 left-0 right-0 h-1 bg-teal-400 shadow-[0_0_16px_#2dd4bf] animate-pulse" />
                          <div className="rounded-full bg-slate-900/95 border border-slate-700 px-4 py-2 text-xs font-semibold text-white flex items-center gap-2.5 shadow-2xl">
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
                            <span>AI Reading Medicine Label...</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleAnalyze}
                        disabled={isScanning}
                        className="flex-1 gap-2 bg-teal-700 hover:bg-teal-800 text-white font-bold h-9.5 rounded-xl shadow-xs"
                      >
                        <Sparkles className="h-4 w-4" />
                        {isScanning ? "Extracting..." : "Scan & Extract Details"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleReset}
                        disabled={isScanning}
                        size="icon"
                        title="Upload another photo"
                        className="h-9.5 w-9.5 rounded-xl border-slate-300"
                      >
                        <RotateCcw className="h-4 w-4 text-slate-600" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Pharmacist Verification Form */}
          <div className="lg:col-span-7">
            <Card className="border-slate-200/90 shadow-xs">
              <CardHeader className="pb-3 pt-4 px-5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-teal-700" />
                      2. Verify & Confirm Medicine Details
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Mandatory review of composition, lot number, and statutory expiration cutoff
                    </CardDescription>
                  </div>
                  {extractedData && (
                    <Badge variant={extractedData.rawConfidence === "high" ? "success" : "alert"} className="text-[10px]">
                      {extractedData.rawConfidence === "high" ? "High Confidence Scan" : "Assisted Scan"}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <form onSubmit={handleSaveToInventory} className="space-y-4">
                  {/* Primary Medicine Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700">
                        Commercial Drug Name <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Paracip 500, Augmentin 625 Duo"
                        required
                        className="mt-1 font-semibold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Active Generic Composition</label>
                      <Input
                        value={formData.genericName}
                        onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                        placeholder="e.g. Paracetamol Tablets IP"
                        className="mt-1 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Strength</label>
                      <Input
                        value={formData.strength}
                        onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                        placeholder="e.g. 500 mg, 625 mg"
                        className="mt-1 text-xs"
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
                        placeholder="e.g. Cipla Ltd, GSK"
                        className="mt-1 text-xs"
                      />
                    </div>
                  </div>

                  {/* Highlighted Lot & Expiry Safety Container */}
                  <div className="rounded-xl border border-teal-200/80 bg-teal-50/40 p-3.5 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-950 uppercase tracking-wider">
                      <Clock className="h-3.5 w-3.5 text-teal-700" />
                      Statutory Lot & Expiry Details
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-800">
                          Batch / Lot No. <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          value={formData.batchNumber}
                          onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                          placeholder="e.g. B240901"
                          required
                          className="mt-1 font-mono font-bold text-xs bg-white border-teal-200"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-800">Printed Expiry</label>
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
                          placeholder="e.g. 08/2026"
                          className="mt-1 font-mono text-xs bg-white border-teal-200"
                        />
                        <p className="mt-0.5 text-[10px] text-slate-400">Raw text on box/foil</p>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-800">FEFO Cutoff Date</label>
                        <Input
                          type="date"
                          value={formData.normalizedExpiryDate}
                          onChange={(e) => setFormData({ ...formData, normalizedExpiryDate: e.target.value })}
                          className="mt-1 text-xs bg-white border-teal-200 font-medium"
                        />
                        <p className="mt-0.5 text-[10px] text-teal-700 font-semibold">Earliest expiry dispatch</p>
                      </div>
                    </div>
                  </div>

                  {/* Stock Quantity & Pack Size */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700">
                        Received Quantity <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Input
                          type="number"
                          min="1"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                          className="font-bold text-sm"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, quantity: (formData.quantity || 0) + 10 })}
                          className="h-9 px-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-700 cursor-pointer"
                        >
                          +10
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Pack Presentation</label>
                      <Input
                        value={formData.packSize}
                        onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
                        placeholder="e.g. Strip of 10 Tablets"
                        className="mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Schedule Type</label>
                      <Select
                        value={formData.scheduleType}
                        onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value })}
                        className="mt-1 text-xs"
                      >
                        <option value="Schedule H">Schedule H (Prescription)</option>
                        <option value="Schedule H1">Schedule H1 (Controlled)</option>
                        <option value="OTC">OTC (Over the Counter)</option>
                        <option value="Schedule X">Schedule X (Narcotic)</option>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Storage Instructions</label>
                    <Input
                      value={formData.storageInstructions}
                      onChange={(e) => setFormData({ ...formData, storageInstructions: e.target.value })}
                      placeholder="e.g. Store below 25°C. Protect from moisture & light."
                      className="mt-1 text-xs"
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting || !formData.name.trim() || !formData.batchNumber.trim()}
                      className="w-full gap-2 font-bold bg-teal-700 hover:bg-teal-800 text-white h-11 rounded-xl shadow-xs cursor-pointer text-sm"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {isSubmitting ? "Committing Verified Batch..." : "Confirm & Commit Batch to Inventory"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* MODE 2: Manual Intake */}
      {activeTab === "manual" && (
        <Card className="max-w-3xl mx-auto border-slate-200/90 shadow-xs">
          <CardHeader className="pt-5 px-6">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-teal-700" />
              Manual Medicine Intake Registration
            </CardTitle>
            <CardDescription className="text-xs">
              Directly register pharmaceutical stock into AyuTrace without packaging photo scans.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSaveToInventory} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">
                    Medicine Commercial Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Azithral 500"
                    required
                    className="mt-1 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Generic Composition</label>
                  <Input
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    placeholder="e.g. Azithromycin Tablets IP"
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Strength</label>
                  <Input
                    value={formData.strength}
                    onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                    placeholder="e.g. 500 mg"
                    className="mt-1 text-xs"
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
                    placeholder="e.g. Alkem Laboratories"
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-teal-200/80 bg-teal-50/40 p-3.5 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-950 uppercase tracking-wider">
                  <Clock className="h-3.5 w-3.5 text-teal-700" />
                  Statutory Lot & Expiry Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800">
                      Batch / Lot No. <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={formData.batchNumber}
                      onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                      placeholder="e.g. B240901"
                      required
                      className="mt-1 font-mono font-bold text-xs bg-white border-teal-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800">Printed Expiry</label>
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
                      placeholder="e.g. 10/2026"
                      className="mt-1 font-mono text-xs bg-white border-teal-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800">Cutoff Date</label>
                    <Input
                      type="date"
                      value={formData.normalizedExpiryDate}
                      onChange={(e) => setFormData({ ...formData, normalizedExpiryDate: e.target.value })}
                      className="mt-1 text-xs bg-white border-teal-200 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">
                    Physical Stock Quantity <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    className="mt-1 font-bold text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Pack Presentation</label>
                  <Input
                    value={formData.packSize}
                    onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
                    placeholder="e.g. Strip of 10 Tablets"
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Storage Instructions</label>
                <Input
                  value={formData.storageInstructions}
                  onChange={(e) => setFormData({ ...formData, storageInstructions: e.target.value })}
                  placeholder="e.g. Store below 25°C."
                  className="mt-1 text-xs"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.name.trim() || !formData.batchNumber.trim()}
                  className="w-full gap-2 font-bold bg-teal-700 hover:bg-teal-800 text-white h-11 rounded-xl shadow-xs cursor-pointer text-sm"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isSubmitting ? "Committing Record..." : "Confirm & Commit Batch to Inventory"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
