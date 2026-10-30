import Link from "next/link";
import { ArrowUpRight, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The trial + live-demo button pair used under the hero of the marketing pages
 * (/, /framer, /compare/*) and in the closing CTA band. The demo is the
 * low-commitment option for visitors who are still evaluating and not ready to
 * sign up. `tone="dark"` swaps the outline button for one that reads on navy.
 */
export function HeroCtas({
    align = "center",
    tone = "light",
    trialLabel = "Start your 14-day trial",
}: {
    align?: "center" | "start";
    tone?: "light" | "dark";
    trialLabel?: string;
}) {
    return (
        <div className={cn("flex flex-col sm:flex-row sm:flex-wrap gap-3", align === "center" ? "justify-center" : "justify-start")}>
            <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-bold text-[15px] whitespace-nowrap transition-colors bg-secondary text-white hover:bg-[#D35F12]"
            >
                {trialLabel}
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
                href="/demo"
                className={cn(
                    "inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-bold text-[15px] whitespace-nowrap transition-colors border",
                    tone === "dark"
                        ? "border-white/30 text-white hover:border-white hover:bg-white/5"
                        : "border-gray-300 text-gray-900 hover:border-primary hover:text-primary"
                )}
            >
                <MousePointerClick className="w-4 h-4" aria-hidden="true" />
                Try the live demo
            </Link>
        </div>
    );
}
