import type { Metadata } from "next";
import { BakeryCateringPage } from "@/components/demo/bakery-pages";

// One of the sandbox bakery's pages; the demo itself is indexed at /demo.
export const metadata: Metadata = {
  title: "Catering | Live Demo | VibeVaults",
  alternates: { canonical: "/demo" },
};

export default function DemoCateringPage() {
  return <BakeryCateringPage />;
}
