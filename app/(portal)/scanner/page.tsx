import { ScannerWorkspace } from "@/components/scanner/scanner-workspace";

export const metadata = {
  title: "AI Medicine Scanner — AyuTrace",
  description: "Multimodal pharmaceutical label extraction powered by Google Gemma 4 via Gemini API.",
};

export default function ScannerPage() {
  return <ScannerWorkspace />;
}
