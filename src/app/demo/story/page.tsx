import type { Metadata } from "next";
import { BakeryStoryPage } from "@/components/demo/bakery-pages";

// One of the sandbox bakery's pages; the demo itself is indexed at /demo.
export const metadata: Metadata = {
  title: "Our story | Live Demo | VibeVaults",
  alternates: { canonical: "/demo" },
};

export default function DemoStoryPage() {
  return <BakeryStoryPage />;
}
