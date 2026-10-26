import { InventoryView } from "@/components/inventory/inventory-view";

export const metadata = {
  title: "Medicine Inventory Register — AyuTrace",
  description: "Batch-wise medicine register, strength formulations, and location balances.",
};

export default function InventoryPage() {
  return <InventoryView />;
}
