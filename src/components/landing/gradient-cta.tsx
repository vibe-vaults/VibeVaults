import Link from "next/link";
import { MousePointerClick } from "lucide-react";

/**
 * Full-width gradient call-to-action that closes the marketing pages. The
 * demo button gives visitors who read to the bottom without signing up a
 * lower-commitment next step.
 */
export function GradientCta({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <section className="bg-linear-to-r from-primary to-secondary py-20">
            <div className="max-w-3xl mx-auto px-4 md:px-8 text-center text-white">
                <h2 className="text-3xl md:text-4xl font-extrabold mb-4">{title}</h2>
                <p className="text-lg text-white/90 mb-8">{subtitle}</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/auth/register"
                        className="inline-flex items-center justify-center px-10 py-4 rounded-full font-bold text-lg bg-white text-primary hover:-translate-y-1 transition-all duration-300 shadow-2xl"
                    >
                        Start your free trial
                    </Link>
                    <Link
                        href="/demo"
                        className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full font-bold text-lg border-2 border-white/70 text-white hover:bg-white/10 hover:border-white hover:-translate-y-1 transition-all duration-300"
                    >
                        <MousePointerClick className="w-5 h-5" />
                        Try the live demo
                    </Link>
                </div>
            </div>
        </section>
    );
}
