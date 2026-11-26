/**
 * Main Responsibility: A short, attributed quote from someone who tried the
 * product. Shown under the hero CTAs on the landing page and on /framer, next
 * to "Try the live demo", which is what the quote praises.
 *
 * Sensitive Dependencies:
 * - The quote is real: Tamás Bodó (Framer template creator, framerpod.com)
 *   tested the /demo in Nov 2026 and gave written permission to quote him and
 *   link his site. He wrote in Hungarian; this is our translation, and the
 *   label says so. He is a tester, not a customer: never present this as a
 *   customer story or a usage result.
 */
export function TesterQuote() {
    return (
        <figure className="border-l-2 border-secondary pl-4">
            <blockquote className="font-serif italic text-[17px] leading-snug text-gray-900">
                &ldquo;Simple, clear, almost foolproof. I especially like that the demo puts both sides next to each
                other, so you see right away what happens where.&rdquo;
            </blockquote>
            <figcaption className="mt-2 text-xs text-gray-500">
                <b className="text-gray-900">Tamas Bodo</b> &middot; Framer template creator,{" "}
                <a
                    href="https://www.framerpod.com"
                    target="_blank"
                    rel="noopener"
                    className="underline underline-offset-2 hover:text-primary transition-colors"
                >
                    framerpod.com
                </a>{" "}
                &middot; translated from Hungarian
            </figcaption>
        </figure>
    );
}
