import { SettingsView } from "@/components/settings/settings-view";

export const metadata = {
  title: "Settings & System Configuration — AyuTrace",
  description: "Healthcare network settings, statutory warning thresholds, and Gemma 4 status.",
};

export default function SettingsPage() {
  return <SettingsView />;
}
