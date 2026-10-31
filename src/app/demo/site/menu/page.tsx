import type { Metadata } from "next";
import { BakeryMenuPage } from "@/components/demo/bakery-pages";

// One of the sandbox bakery's pages, shown inside the /demo iframe. The demo
// itself is indexed at /demo; these pages never are.
export const metadata: Metadata = {
  title: "Menu | Live Demo | VibeVaults",
  alternates: { canonical: "/demo" },
  robots: { index: false },
};

export default function DemoMenuPage() {
  return <BakeryMenuPage />;
}
