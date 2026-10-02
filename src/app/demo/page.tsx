import type { Metadata } from "next";
import { BakeryHome } from "@/components/demo/bakery-site";

export const metadata: Metadata = {
  title: "Live Demo: Try the Visual Feedback Widget | VibeVaults",
  description:
    "Try VibeVaults without signing up. Pin feedback on a sample client website, attach a screenshot, and watch the agency reply in the thread.",
  alternates: { canonical: "/demo" },
};

export default function DemoPage() {
  return <BakeryHome />;
}
