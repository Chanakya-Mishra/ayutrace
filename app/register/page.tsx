"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  ShieldCheck,
  Award,
  Hospital,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-context";
import { RoleLabels } from "@/lib/validations/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { user, login } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "pharmacist",
    licenseNumber: "",
    department: "",
    facilityId: "",
  });

  const [facilities, setFacilities] = useState<Array<{ id: string; name: string; city: string | null }>>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    fetch("/api/facilities")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data && json.data.length > 0) {
          setFacilities(json.data);
          setFormData((prev) => ({
            ...prev,
            facilityId: prev.facilityId || json.data[0].id,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (!agreedToTerms) {
      setErrorMessage(
        "Please confirm your healthcare authorization and compliance agreement."
      );
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(
          data.error ||
            data.issues?.[0]?.message ||
            "Registration failed. Please check form details."
        );
        setIsLoading(false);
        return;
      }

      // Automatically sign in upon registration
      login(data.user);
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setErrorMessage("Network error during registration. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-radial from-slate-50 via-teal-50/20 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 transition-transform hover:scale-105"
        >
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl shadow-md shadow-teal-800/15">
            <Image
              src="/logo.png"
              alt="AyuTrace Logo"
              width={48}
              height={48}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <div className="text-left">
            <div className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
              AyuTrace
            </div>
            <div className="text-[10px] font-bold tracking-wider uppercase text-teal-700">
              Healthcare Logistics & Safety
            </div>
          </div>
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          Create Clinical Healthcare Account
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enroll your pharmacy, ward or facility into real-time batch traceability
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <Card className="border-slate-200 shadow-xl bg-white/95 backdrop-blur-sm p-6 sm:p-8 rounded-2xl">
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name & Email */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Full Name & Title <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Dr. Priya Raman"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Work / Hospital Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="priya@hospital.org"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Professional Role & License */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="role"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Professional Role <span className="text-rose-500">*</span>
                </label>
                <Select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="text-xs h-9 cursor-pointer"
                >
                  {Object.entries(RoleLabels).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label
                  htmlFor="licenseNumber"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  License / Reg. Number
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Award className="h-4 w-4" />
                  </div>
                  <Input
                    id="licenseNumber"
                    name="licenseNumber"
                    type="text"
                    placeholder="e.g. PCI-DL-2024-9182"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    className="pl-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Facility & Department */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="facilityId"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Affiliated Facility / Hospital
                </label>
                <Select
                  id="facilityId"
                  name="facilityId"
                  value={formData.facilityId}
                  onChange={handleChange}
                  className="text-xs h-9 cursor-pointer"
                >
                  {facilities.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name} {fac.city ? `(${fac.city})` : ""}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label
                  htmlFor="department"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Department / Ward
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Hospital className="h-4 w-4" />
                  </div>
                  <Input
                    id="department"
                    name="department"
                    type="text"
                    placeholder="e.g. Central Dispensary / ICU"
                    value={formData.department}
                    onChange={handleChange}
                    className="pl-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Min. 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-9 pr-9 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Compliance Acknowledgment Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-teal-700 focus:ring-teal-600 cursor-pointer"
                />
                <span className="leading-snug">
                  I certify that I am an authorized healthcare professional and agree to comply with
                  clinical FEFO dispensing and statutory lot traceability regulations.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full gap-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 rounded-lg shadow-sm"
            >
              {isLoading ? (
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Registering healthcare credentials...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5 text-xs">
                  <span>Create Account & Enter AyuTrace</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              )}
            </Button>
          </form>

          {/* Link back to Sign In */}
          <div className="mt-6 text-center text-xs text-slate-600 border-t border-slate-100 pt-4">
            Already have an active clinical profile?{" "}
            <Link
              href="/login"
              className="font-bold text-teal-700 hover:text-teal-800 underline underline-offset-2"
            >
              Sign In
            </Link>
          </div>
        </Card>

        {/* Security badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
            <span>End-to-End Scrypt Encryption</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
            <span>Audit-Logged Access</span>
          </div>
          <div className="flex items-center gap-1">
            <Hospital className="h-3.5 w-3.5 text-teal-600" />
            <span>Role-Based Multi-Facility Isolation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
