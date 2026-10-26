import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";

export const metadata: Metadata = {
  title: "AyuTrace — Every Dose Deserves Care.",
  description:
    "Intelligent medicine tracking, lot traceability & statutory expiry compliance for healthcare facilities, powered by Google Gemma 4.",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: "/apple-icon.png",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50/70 font-sans text-slate-900 antialiased selection:bg-teal-100 selection:text-teal-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
