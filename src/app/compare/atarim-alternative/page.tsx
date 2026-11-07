import type { Metadata } from "next";
import { ComparisonPage } from "@/components/compare/comparison-page";
import { atarimComparison } from "@/lib/compare-data";

export const metadata: Metadata = {
    title: atarimComparison.metaTitle,
    description: atarimComparison.metaDescription,
    alternates: { canonical: "/compare/atarim-alternative" },
    openGraph: {
        title: atarimComparison.metaTitle,
        description: atarimComparison.metaDescription,
        url: "/compare/atarim-alternative",
    },
};

export default function AtarimAlternativePage() {
    return <ComparisonPage data={atarimComparison} />;
}
