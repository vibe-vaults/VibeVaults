import type { Metadata } from "next";
import { BakeryHome } from "@/components/demo/bakery-site";

// The bakery's home page, shown inside the /demo iframe. The demo itself is
// indexed at /demo; this page never is.
export const metadata: Metadata = {
  title: "Crumb & Co. | Live Demo | VibeVaults",
  alternates: { canonical: "/demo" },
  robots: { index: false },
};

export default function DemoSiteHomePage() {
  return <BakeryHome />;
}
