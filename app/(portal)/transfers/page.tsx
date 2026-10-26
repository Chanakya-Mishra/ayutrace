import { TransfersView } from "@/components/transfers/transfers-view";

export const metadata = {
  title: "Stock Transfers & Inter-Ward Audit — AyuTrace",
  description: "Execute verified atomic medicine stock transfers between departments.",
};

export default function TransfersPage() {
  return <TransfersView />;
}
