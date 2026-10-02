import type { Metadata } from "next";
import { BakeryMenuPage } from "@/components/demo/bakery-pages";

// One of the sandbox bakery's pages; the demo itself is indexed at /demo.
export const metadata: Metadata = {
  title: "Menu | Live Demo | VibeVaults",
  alternates: { canonical: "/demo" },
};

export default function DemoMenuPage() {
  return <BakeryMenuPage />;
}
