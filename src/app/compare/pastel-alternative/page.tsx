import type { Metadata } from "next";
import { ComparisonPage } from "@/components/compare/comparison-page";
import { pastelComparison } from "@/lib/compare-data";

export const metadata: Metadata = {
    title: pastelComparison.metaTitle,
    description: pastelComparison.metaDescription,
    alternates: { canonical: "/compare/pastel-alternative" },
    openGraph: {
        title: pastelComparison.metaTitle,
        description: pastelComparison.metaDescription,
        url: "/compare/pastel-alternative",
    },
};

export default function PastelAlternativePage() {
    return <ComparisonPage data={pastelComparison} />;
}
