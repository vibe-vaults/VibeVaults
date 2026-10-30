import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The marketing section heading: a large left-aligned title (callers put the
 * serif italic accent inside `children`) over a small uppercase kicker. Shared
 * by the landing page, /pricing, /framer and the compare pages so every
 * section opens the same way. `size="lg"` suits longer titles.
 */
export function SectionHeading({
    children,
    kicker,
    size = "xl",
    tone = "light",
    as: Tag = "h2",
    className,
}: {
    children: ReactNode;
    kicker?: ReactNode;
    size?: "xl" | "lg";
    tone?: "light" | "dark";
    as?: "h1" | "h2";
    className?: string;
}) {
    return (
        <div className={className}>
            <Tag
                className={cn(
                    "tracking-tight text-balance",
                    size === "xl" ? "text-6xl md:text-[92px] leading-none" : "text-5xl md:text-6xl leading-[1.05] max-w-4xl",
                    tone === "dark" ? "text-white" : "text-gray-900"
                )}
            >
                {children}
            </Tag>
            {kicker && (
                <p
                    className={cn(
                        "mt-4 max-w-2xl text-xs uppercase tracking-[0.16em]",
                        tone === "dark" ? "text-white/60" : "text-gray-500"
                    )}
                >
                    {kicker}
                </p>
            )}
        </div>
    );
}

/** Serif italic accent for a word or phrase inside a SectionHeading. */
export function Accent({ children, className }: { children: ReactNode; className?: string }) {
    return <span className={cn("font-serif italic font-normal", className)}>{children}</span>;
}
