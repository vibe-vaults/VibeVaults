import type { Metadata } from "next";
import { ComparisonPage } from "@/components/compare/comparison-page";
import { feedbucketComparison } from "@/lib/compare-data";

export const metadata: Metadata = {
    title: feedbucketComparison.metaTitle,
    description: feedbucketComparison.metaDescription,
    alternates: { canonical: "/compare/feedbucket-alternative" },
    openGraph: {
        title: feedbucketComparison.metaTitle,
        description: feedbucketComparison.metaDescription,
        url: "/compare/feedbucket-alternative",
    },
};

export default function FeedbucketAlternativePage() {
    return <ComparisonPage data={feedbucketComparison} />;
}
