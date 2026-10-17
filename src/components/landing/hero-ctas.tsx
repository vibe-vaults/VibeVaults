import Link from "next/link";
import { MousePointerClick } from "lucide-react";

/**
 * The trial + live-demo button pair under the hero of the marketing pages
 * (/framer, /compare/*). The demo is the low-commitment option for visitors
 * who are still evaluating and not ready to sign up.
 */
export function HeroCtas() {
    return (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full font-bold text-base transition-all duration-300 bg-secondary text-white hover:bg-secondary/90 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
                Start your 14-day trial
            </Link>
            <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-base transition-all duration-300 border-2 border-gray-200 text-gray-700 hover:border-primary hover:text-primary"
            >
                <MousePointerClick className="w-5 h-5" />
                Try the live demo
            </Link>
        </div>
    );
}
