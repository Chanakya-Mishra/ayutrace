"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Building2, Sliders, CheckCircle2, Lock } from "lucide-react";
import { useSettings } from "@/lib/hooks/use-swr-api";

export function SettingsView() {
  const { settings, isLoading, mutate: mutateSettings } = useSettings();

  const [orgName, setOrgName] = useState("AyuTrace Health Network");
  const [defaultFacilityId, setDefaultFacilityId] = useState("");
  const [nearExpiryDays, setNearExpiryDays] = useState(90);
  const [criticalExpiryDays, setCriticalExpiryDays] = useState(30);
  const [urgentExpiryDays, setUrgentExpiryDays] = useState(7);
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");

  const [facilities, setFacilities] = useState<any[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setOrgName(settings.orgName);
      setDefaultFacilityId(settings.defaultFacilityId || "");
      setNearExpiryDays(settings.nearExpiryThresholdDays);
      setCriticalExpiryDays(settings.criticalExpiryThresholdDays);
      setUrgentExpiryDays(settings.urgentExpiryThresholdDays || 7);
      setDateFormat(settings.dateFormat || "DD/MM/YYYY");
      if (settings.facilities) setFacilities(settings.facilities);
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName,
          defaultFacilityId: defaultFacilityId || null,
          nearExpiryThresholdDays: Number(nearExpiryDays),
          criticalExpiryThresholdDays: Number(criticalExpiryDays),
          urgentExpiryThresholdDays: Number(urgentExpiryDays),
          dateFormat,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update settings");
      }

      setSaveMessage("Healthcare organization settings updated successfully!");
      await mutateSettings();
      setTimeout(() => setSaveMessage(null), 3500);
    } catch (err: any) {
      alert(err.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-slate-400">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      {saveMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-teal-50 border border-teal-200 p-3 text-xs text-teal-900">
          <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Organization Preferences */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-teal-700" />
            Healthcare Organization Identity
          </CardTitle>
          <CardDescription className="text-xs">
            Manage healthcare network profile and facility defaults
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Organization Name</label>
                <Input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. AyuTrace Health Network"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Default Operating Facility</label>
                <Select
                  value={defaultFacilityId}
                  onChange={(e) => setDefaultFacilityId(e.target.value)}
                  className="mt-1 text-xs"
                >
                  <option value="">No Default (Prompt Every Time)</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.type})
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                <Sliders className="h-3.5 w-3.5 text-slate-500" />
                Statutory Expiry Warning Horizons & Thresholds
              </h4>
              <p className="text-[11px] text-slate-500 mb-3">
                Configure early warning alerts for priority FEFO stock rotation across wards.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Near Expiry Horizon (Days)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={nearExpiryDays}
                    onChange={(e) => setNearExpiryDays(parseInt(e.target.value) || 90)}
                    className="mt-1"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Triggers amber warning (default: 90 days)</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Critical Urgency (Days)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="180"
                    value={criticalExpiryDays}
                    onChange={(e) => setCriticalExpiryDays(parseInt(e.target.value) || 30)}
                    className="mt-1"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Priority ward rotation (default: 30 days)</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Urgent Cutoff (Days)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={urgentExpiryDays}
                    onChange={(e) => setUrgentExpiryDays(parseInt(e.target.value) || 7)}
                    className="mt-1"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Immediate quarantine alert (default: 7 days)</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 max-w-xs">
              <label className="text-xs font-semibold text-slate-700">Standard Date Format</label>
              <Select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="mt-1 text-xs"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (Standard Healthcare)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Standard)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (US Format)</option>
              </Select>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={isSaving} className="gap-2 bg-teal-700 hover:bg-teal-800">
                <CheckCircle2 className="h-4 w-4" />
                {isSaving ? "Saving Settings..." : "Save Healthcare Preferences"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Statutory Healthcare Disclaimer */}
      <Card className="bg-slate-50/80 border-slate-200">
        <CardContent className="p-4 text-xs text-slate-600 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Lock className="h-3.5 w-3.5 text-teal-700" />
            <span>Clinical Disclaimer & Prototype Boundary</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            AyuTrace is an administrative medicine inventory and lot-traceability platform. It is not certified clinical
            diagnostic, prescribing, or electronic health record (EHR) software. Final dispensing verification remains
            the statutory responsibility of licensed pharmacists and healthcare practitioners.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
