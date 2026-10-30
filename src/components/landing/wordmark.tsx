import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The VibeVaults wordmark, used by every header and footer so the brand reads
 * the same on marketing, auth and dashboard pages: the name as written, in the
 * primary colour. Renders a plain span when `href` is null (a locked sidebar).
 */
export function Wordmark({ href = "/", className }: { href?: string | null; className?: string }) {
    const classes = cn("font-bold tracking-tight text-primary whitespace-nowrap", className);
    return href ? (
        <Link href={href} className={cn(classes, "hover:opacity-90 transition-opacity")}>
            VibeVaults
        </Link>
    ) : (
        <span className={classes}>VibeVaults</span>
    );
}

/** Wordmark-only top bar for pages outside the marketing chrome (auth flows). */
export function SimpleHeader() {
    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200">
            <div className="px-4 md:px-8 h-[76px] flex items-center max-w-7xl mx-auto w-full">
                <Wordmark className="text-xl md:text-2xl" />
            </div>
        </header>
    );
}
