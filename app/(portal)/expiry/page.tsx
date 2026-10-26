import { ExpiryMonitorView } from "@/components/expiry/expiry-monitor-view";

export const metadata = {
  title: "Medicine Expiry Monitor — AyuTrace",
  description: "Monitor approaching printed deadlines and prioritize medicine stock dispatch.",
};

export default function ExpiryPage() {
  return <ExpiryMonitorView />;
}
