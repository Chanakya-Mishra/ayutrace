"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Building2,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Authentication failed. Please verify credentials.");
        setIsLoading(false);
        return;
      }

      // Update auth context state
      login(data.user);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setErrorMessage("Network or connection error. Please try again.");
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password123!");
    setErrorMessage(null);
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-radial from-slate-50 via-teal-50/20 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* AyuTrace Header Brand */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
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
              Clinical Drug Traceability
            </div>
          </div>
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          Sign in to your clinical account
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Statutory medicine inventory, lot traceability & FEFO dispatch controls
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-slate-200 shadow-xl bg-white/95 backdrop-blur-sm p-6 sm:p-8 rounded-2xl">
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Work / Hospital Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="pharmacist@hospital.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Password
                </label>
                <span className="text-[11px] text-teal-700 hover:text-teal-800 font-medium cursor-pointer">
                  Hospital IT Reset?
                </span>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-teal-700 focus:ring-teal-600 cursor-pointer"
                />
                <span>Remember this workstation</span>
              </label>
              <Badge variant="neutral" className="text-[10px] py-0">
                GAMP 5 Audited
              </Badge>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full gap-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 rounded-lg shadow-sm"
            >
              {isLoading ? (
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Verifying credentials...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5 text-xs">
                  <span>Sign In to AyuTrace</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              )}
            </Button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-teal-600" />
                Demo Healthcare Profiles
              </span>
              <span className="text-[10px] text-slate-400">1-click fill</span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => fillDemoAccount("pharmacist@ayutrace.org")}
                className="flex flex-col items-start p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 group-hover:text-teal-900">
                  <Stethoscope className="h-3.5 w-3.5 text-teal-700" />
                  <span>Chief Pharmacist</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate w-full">
                  Apex Hospital Central
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount("ananya@ayutrace.org")}
                className="flex flex-col items-start p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 group-hover:text-teal-900">
                  <Building2 className="h-3.5 w-3.5 text-teal-700" />
                  <span>Staff Pharmacist</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate w-full">
                  Community Dispensary
                </div>
              </button>
            </div>
          </div>

          {/* Link to Make Account */}
          <div className="mt-6 text-center text-xs text-slate-600 border-t border-slate-100 pt-4">
            Need access to AyuTrace?{" "}
            <Link
              href="/register"
              className="font-bold text-teal-700 hover:text-teal-800 underline underline-offset-2"
            >
              Make an Account
            </Link>
          </div>
        </Card>

        {/* Clinical Compliance Footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
          <span>Statutory Batch Expiry Verification Protocol • 21 CFR Part 11</span>
        </div>
      </div>
    </div>
  );
}
