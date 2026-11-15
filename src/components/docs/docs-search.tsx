"use client";

/**
 * Main Responsibility: Search box for the /docs section. On first focus it
 * fetches every docs page once, splits each `.docs-prose` body at its <h2>
 * headings, and searches those sections in memory. Results deep-link to
 * `/docs/<slug>#<h2 id>`.
 *
 * Why fetch the rendered pages instead of keeping a search index file: the docs
 * are hand-written TSX with no content source, so a separate index would be a
 * second copy of every page and would go stale on the first edit. Reading the
 * same HTML the visitor reads cannot drift.
 *
 * Sensitive Dependencies:
 * - Page list and titles come from `lib/docs-data.ts`.
 * - Every docs page must keep its prose inside `.docs-prose` with `<h2 id>`
 *   section headings as direct children; a heading without an id still gets
 *   indexed but links to the top of the page. Pinned by
 *   `tests/docs-search.spec.ts`.
 * - Same-origin fetch only; nothing leaves our site, so no sub-processor.
 * - The input is disabled until hydrated: text typed before React takes over
 *   is wiped by the controlled `value`, so a pre-hydration search would look
 *   dead (caught on WebKit by the spec). Same rule as `ActivateWidgetButton`.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { docsPages } from "@/lib/docs-data";

type Section = {
    href: string;
    pageTitle: string;
    heading: string;
    body: string;
};

type IndexState = "idle" | "loading" | "ready" | "error";

const MAX_RESULTS = 8;
const noopSubscribe = () => () => {};
const SNIPPET_RADIUS = 70;

/** Split one rendered docs page into searchable sections. */
function sectionsFromHtml(html: string, slug: string, pageTitle: string, summary: string): Section[] {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const prose = doc.querySelector(".docs-prose");
    const base = `/docs/${slug}`;
    // The page intro (title + summary) is its own section, so a search for a
    // page's topic finds the page even when no single section says it.
    const sections: Section[] = [{ href: base, pageTitle, heading: pageTitle, body: summary }];
    if (!prose) return sections;

    let current: Section | null = null;
    for (const el of Array.from(prose.children)) {
        if (el.tagName === "H2") {
            current = {
                href: el.id ? `${base}#${el.id}` : base,
                pageTitle,
                heading: (el.textContent ?? "").trim(),
                body: "",
            };
            sections.push(current);
        } else {
            const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
            const target = current ?? sections[0];
            target.body = target.body ? `${target.body} ${text}` : text;
        }
    }
    return sections;
}

async function buildIndex(): Promise<Section[]> {
    const pages = await Promise.all(
        docsPages.map(async (p) => {
            const res = await fetch(`/docs/${p.slug}`, { credentials: "same-origin" });
            if (!res.ok) throw new Error(`docs fetch failed: ${p.slug} ${res.status}`);
            return sectionsFromHtml(await res.text(), p.slug, p.title, p.summary);
        })
    );
    return pages.flat();
}

function tokenize(query: string): string[] {
    return query.toLowerCase().split(/\s+/).filter(Boolean);
}

/** Every term must appear somewhere; title beats heading beats body. */
function search(index: Section[], terms: string[]): Section[] {
    if (terms.length === 0) return [];
    const scored: { section: Section; score: number }[] = [];
    for (const section of index) {
        const title = section.pageTitle.toLowerCase();
        const heading = section.heading.toLowerCase();
        const body = section.body.toLowerCase();
        let score = 0;
        let all = true;
        for (const t of terms) {
            const s = (title.includes(t) ? 3 : 0) + (heading.includes(t) ? 5 : 0) + (body.includes(t) ? 1 : 0);
            if (s === 0) {
                all = false;
                break;
            }
            score += s;
        }
        if (all) scored.push({ section, score });
    }
    // Stable sort keeps docs order for ties, which reads as "earlier pages first".
    return scored.sort((a, b) => b.score - a.score).slice(0, MAX_RESULTS).map((s) => s.section);
}

function escapeRegExp(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Wrap every term occurrence in <mark>, as React nodes (no innerHTML). */
function highlight(text: string, terms: string[]): ReactNode {
    if (terms.length === 0) return text;
    const re = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
    return text.split(re).map((part, i) =>
        i % 2 === 1 ? (
            <mark key={i} className="bg-primary/15 text-gray-900 rounded-sm px-0.5">
                {part}
            </mark>
        ) : (
            part
        )
    );
}

/** A window of body text around the first match, or the opening of the section. */
function snippet(body: string, terms: string[]): string {
    const lower = body.toLowerCase();
    const hits = terms.map((t) => lower.indexOf(t)).filter((i) => i >= 0);
    const at = hits.length ? Math.min(...hits) : 0;
    const start = Math.max(0, at - SNIPPET_RADIUS);
    const end = Math.min(body.length, at + SNIPPET_RADIUS * 2);
    return `${start > 0 ? "…" : ""}${body.slice(start, end).trim()}${end < body.length ? "…" : ""}`;
}

export function DocsSearch({ className }: { className?: string }) {
    const router = useRouter();
    const listId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const indexPromise = useRef<Promise<Section[]> | null>(null);
    const [index, setIndex] = useState<Section[] | null>(null);
    const [state, setState] = useState<IndexState>("idle");
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    // false in the server render and during hydration, true after: no effect needed.
    const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);

    const loadIndex = useCallback(() => {
        if (indexPromise.current) return;
        setState("loading");
        indexPromise.current = buildIndex();
        indexPromise.current.then(
            (sections) => {
                setIndex(sections);
                setState("ready");
            },
            () => {
                // Allow a retry on the next focus rather than staying broken.
                indexPromise.current = null;
                setState("error");
            }
        );
    }, []);

    // "/" focuses the search, like most docs sites, unless the visitor is typing.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
            const t = e.target as HTMLElement | null;
            if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
            e.preventDefault();
            inputRef.current?.focus();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const terms = useMemo(() => tokenize(query), [query]);
    const results = useMemo(() => (index ? search(index, terms) : []), [index, terms]);
    const showList = open && terms.length > 0;

    const go = (href: string) => {
        setQuery("");
        setOpen(false);
        inputRef.current?.blur();
        router.push(href);
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") {
            setOpen(false);
            inputRef.current?.blur();
        } else if (e.key === "ArrowDown" && results.length) {
            e.preventDefault();
            setActive((a) => (a + 1) % results.length);
        } else if (e.key === "ArrowUp" && results.length) {
            e.preventDefault();
            setActive((a) => (a - 1 + results.length) % results.length);
        } else if (e.key === "Enter" && results[active]) {
            e.preventDefault();
            go(results[active].href);
        }
    };

    return (
        <div className={cn("relative", className)}>
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
                ref={inputRef}
                type="search"
                role="combobox"
                aria-label="Search documentation"
                aria-expanded={showList}
                aria-controls={listId}
                aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
                autoComplete="off"
                disabled={!hydrated}
                placeholder="Search docs"
                value={query}
                onFocus={() => {
                    loadIndex();
                    setOpen(true);
                }}
                onBlur={() => setOpen(false)}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                    setOpen(true);
                }}
                onKeyDown={onKeyDown}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-10 text-sm text-gray-900 shadow-xs outline-none transition-[color,box-shadow] placeholder:text-gray-400 focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-primary/15 disabled:bg-gray-50 [&::-webkit-search-cancel-button]:hidden"
            />
            {state === "loading" ? (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
            ) : (
                <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center rounded border border-gray-200 bg-gray-50 px-1.5 text-[10px] font-medium text-gray-400">
                    /
                </kbd>
            )}

            {showList && (
                <div
                    // mousedown would blur the input and close the list before the click lands.
                    onMouseDown={(e) => e.preventDefault()}
                    className="absolute left-0 right-0 lg:right-auto lg:w-[28rem] top-full z-50 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl shadow-gray-900/10"
                >
                    {state === "error" ? (
                        <p className="px-4 py-3 text-sm text-gray-500">Search is unavailable right now. Try again in a moment.</p>
                    ) : state !== "ready" ? (
                        <p className="px-4 py-3 text-sm text-gray-500">Loading the docs…</p>
                    ) : results.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-gray-500">
                            No results for <span className="font-semibold text-gray-900">{query.trim()}</span>.
                        </p>
                    ) : (
                        <ul id={listId} role="listbox" aria-label="Search results" className="max-h-[60vh] overflow-y-auto py-1.5">
                            {results.map((r, i) => (
                                <li
                                    key={r.href + i}
                                    id={`${listId}-${i}`}
                                    role="option"
                                    aria-selected={i === active}
                                    onMouseEnter={() => setActive(i)}
                                    onClick={() => go(r.href)}
                                    className={cn(
                                        "mx-1.5 cursor-pointer rounded-lg px-3 py-2.5 transition-colors",
                                        i === active ? "bg-primary/5" : "hover:bg-gray-50"
                                    )}
                                >
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">{r.pageTitle}</p>
                                    <p className="text-sm font-semibold text-gray-900">{highlight(r.heading, terms)}</p>
                                    {r.body && (
                                        <p className="mt-0.5 text-xs leading-relaxed text-gray-500 line-clamp-2">
                                            {highlight(snippet(r.body, terms), terms)}
                                        </p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
