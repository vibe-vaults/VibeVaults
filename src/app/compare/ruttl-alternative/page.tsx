import type { Metadata } from "next";
import { ComparisonPage } from "@/components/compare/comparison-page";
import { ruttlComparison } from "@/lib/compare-data";

export const metadata: Metadata = {
    title: ruttlComparison.metaTitle,
    description: ruttlComparison.metaDescription,
    alternates: { canonical: "/compare/ruttl-alternative" },
    openGraph: {
        title: ruttlComparison.metaTitle,
        description: ruttlComparison.metaDescription,
        url: "/compare/ruttl-alternative",
    },
};

export default function RuttlAlternativePage() {
    return <ComparisonPage data={ruttlComparison} />;
}
