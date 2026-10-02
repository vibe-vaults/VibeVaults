import { Cake, Coffee, Croissant, Heart, PartyPopper, Sandwich, Sunrise, Truck, Wheat } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Main Responsibility: The bakery's inner pages on /demo (Menu, Catering, Our
 * story), so visitors can move around a multi-page client site and pin on
 * each page. Like the home page, every page carries a deliberate flaw worth
 * pinning: a price missing from the menu, an unreadable quote button on
 * catering, and a year repeated in the story timeline.
 *
 * Sensitive Dependencies:
 * - Rendered by `src/app/demo/{menu,catering,story}/page.tsx` inside the
 *   shared demo layout (header, footer, sandbox widget).
 * - Pure markup, no client JS, for the same reason as `bakery-site.tsx`: pins
 *   anchor to these elements and must not lose them to a re-render.
 */

function PageIntro({ eyebrow, title, lede }: { eyebrow: string; title: string; lede: string }) {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="absolute -top-40 -right-24 h-[24rem] w-[24rem] rounded-full bg-[#f6c98f]/35 blur-3xl" />
      <div className="relative max-w-6xl mx-auto px-4 md:px-8 pt-14 pb-10 md:pt-20 md:pb-14">
        <span className="inline-flex items-center rounded-full bg-[#fdebd3] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#9a5b25]">
          {eyebrow}
        </span>
        <h1 className="mt-5 font-[family-name:var(--font-bakery)] text-4xl md:text-5xl font-semibold leading-[1.08] tracking-tight max-w-2xl">
          {title}
        </h1>
        <p className="mt-5 text-lg text-[#7a5a40] leading-relaxed max-w-xl">{lede}</p>
      </div>
    </section>
  );
}

// --- Menu -----------------------------------------------------------------

type MenuItem = { name: string; note: string; price?: string };

const MENU_SECTIONS: { icon: LucideIcon; title: string; items: MenuItem[] }[] = [
  {
    icon: Wheat,
    title: "Breads",
    items: [
      { name: "Country sourdough", note: "Two-day ferment, stone-milled rye", price: "$9.50" },
      { name: "Seeded rye", note: "Sunflower, flax, a little molasses", price: "$8.20" },
      // Deliberately unpriced: something to pin.
      { name: "Olive & rosemary fougasse", note: "Saturdays only" },
      { name: "Milk bread loaf", note: "Soft, for toast and sandwiches", price: "$7.00" },
    ],
  },
  {
    icon: Croissant,
    title: "Pastries",
    items: [
      { name: "Butter croissant", note: "72 layers, laminated by hand", price: "$3.80" },
      { name: "Pain au chocolat", note: "Two batons of dark chocolate", price: "$4.20" },
      { name: "Cardamom knot", note: "Today's bake", price: "$4.40" },
      { name: "Pistachio morning bun", note: "Orange zest, cardamom sugar", price: "$4.60" },
    ],
  },
  {
    icon: Coffee,
    title: "Coffee & more",
    items: [
      { name: "Espresso", note: "House blend from Riverton Roasters", price: "$2.80" },
      { name: "Flat white", note: "Oat or whole milk", price: "$4.10" },
      { name: "Filter of the week", note: "Ask us what's on", price: "$3.50" },
      { name: "Fresh orange juice", note: "Squeezed to order", price: "$4.00" },
    ],
  },
];

export function BakeryMenuPage() {
  return (
    <div className="flex-1 text-[#3b2414]">
      <PageIntro
        eyebrow="Baked daily"
        title="Everything we bake, every morning."
        lede="Prices include tax. Breads are ready from 7, pastries keep coming out of the oven until about 11."
      />
      <section className="max-w-6xl mx-auto px-4 md:px-8 pb-20 grid gap-6 lg:grid-cols-3">
        {MENU_SECTIONS.map(({ icon: Icon, title, items }) => (
          <div key={title} className="rounded-3xl bg-white/70 p-7 ring-1 ring-[#ecdcc6] shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fdebd3] text-[#9a5b25]">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="font-[family-name:var(--font-bakery)] text-2xl font-semibold">{title}</h2>
            </div>
            <ul className="mt-6 space-y-5">
              {items.map(({ name, note, price }) => (
                <li key={name}>
                  <div className="flex items-baseline gap-3">
                    <span className="font-semibold">{name}</span>
                    <span aria-hidden className="flex-1 border-b border-dotted border-[#d9c2a5] translate-y-[-4px]" />
                    <span className="font-bold tabular-nums text-[#3f6b4a]">{price}</span>
                  </div>
                  <p className="mt-1 text-sm text-[#7a5a40]">{note}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}

// --- Catering -------------------------------------------------------------

const PACKAGES: { icon: LucideIcon; name: string; price: string; includes: string[]; featured?: boolean; faded?: boolean }[] = [
  {
    icon: Sunrise,
    name: "Office breakfast",
    price: "$12 / person",
    includes: ["Mini croissants and pastries", "Seasonal fruit", "Coffee and juice for the table"],
  },
  {
    icon: Sandwich,
    name: "Working lunch",
    price: "$18 / person",
    includes: ["Sourdough sandwiches, three fillings", "A big green salad", "Cookies to finish"],
    featured: true,
  },
  {
    icon: PartyPopper,
    name: "Celebration table",
    price: "From $240",
    includes: ["A layer cake of your choice", "Two dozen pastries", "Delivery and setup"],
    // Deliberately unreadable quote button: something to pin.
    faded: true,
  },
];

const CATERING_STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Heart, title: "Tell us the occasion", body: "Headcount, date, and anything nobody can eat." },
  { icon: Cake, title: "We plan the bake", body: "You get a menu and a fixed price within a day." },
  { icon: Truck, title: "Delivered warm", body: "Anywhere in Riverton, set up and ready to eat." },
];

export function BakeryCateringPage() {
  return (
    <div className="flex-1 text-[#3b2414]">
      <PageIntro
        eyebrow="Catering"
        title="Feed the whole office (or the whole family)."
        lede="Order at least 48 hours ahead. We bake it that morning and bring it to you."
      />
      <section className="max-w-6xl mx-auto px-4 md:px-8 pb-16 grid gap-6 md:grid-cols-3">
        {PACKAGES.map(({ icon: Icon, name, price, includes, featured, faded }) => (
          <div
            key={name}
            className={`flex flex-col rounded-3xl p-7 shadow-sm ${featured ? "bg-[#6b3f1d] text-[#fffaf3] shadow-xl shadow-[#6b3f1d]/25" : "bg-white/70 ring-1 ring-[#ecdcc6]"}`}
          >
            <span className={`grid h-12 w-12 place-items-center rounded-2xl ${featured ? "bg-white/15" : "bg-[#fdebd3] text-[#9a5b25]"}`}>
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            <h2 className="mt-5 text-xl font-semibold">{name}</h2>
            <p className={`mt-1 text-2xl font-bold ${featured ? "text-[#f6c98f]" : "text-[#3f6b4a]"}`}>{price}</p>
            <ul className={`mt-5 flex-1 space-y-2 text-sm ${featured ? "text-[#fffaf3]/85" : "text-[#7a5a40]"}`}>
              {includes.map((line) => <li key={line}>&middot; {line}</li>)}
            </ul>
            <span
              className={`mt-7 inline-flex items-center justify-center rounded-full px-6 py-3 font-semibold ${
                featured
                  ? "bg-[#fffaf3] text-[#6b3f1d]"
                  : faded
                    ? "bg-[#fdebd3] text-[#f3e1c9]"
                    : "border-2 border-[#d9c2a5] text-[#6b3f1d]"
              }`}
            >
              Request a quote
            </span>
          </div>
        ))}
      </section>
      <section className="bg-white/60 border-y border-[#ecdcc6]">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-16">
          <h2 className="font-[family-name:var(--font-bakery)] text-3xl font-semibold tracking-tight">How it works</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {CATERING_STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#3f6b4a] text-sm font-bold text-[#f4f1e8]">{i + 1}</span>
                <div>
                  <p className="inline-flex items-center gap-2 font-semibold">
                    <Icon className="h-4 w-4 text-[#9a5b25]" aria-hidden /> {title}
                  </p>
                  <p className="mt-1 text-sm text-[#7a5a40] leading-relaxed">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}

// --- Our story ------------------------------------------------------------

const TIMELINE = [
  { year: "1987", text: "Rosa Brandt opens a four-table bakery on Maple Street with one oven and a borrowed mixer." },
  { year: "1999", text: "Her son Theo takes over the night shift and starts the sourdough that is still going today." },
  { year: "2012", text: "We knock through to the shop next door and finally get a proper coffee bar." },
  // Deliberately repeated year: something to pin.
  { year: "2012", text: "Maria joins as head baker and the cardamom knots arrive." },
  { year: "2024", text: "Catering launches, and the Saturday queue reaches the corner for the first time." },
];

const TEAM = [
  { initials: "TB", name: "Theo Brandt", role: "Owner, night baker" },
  { initials: "MO", name: "Maria Okafor", role: "Head baker" },
  { initials: "JL", name: "Jun Lee", role: "Coffee and front of house" },
];

export function BakeryStoryPage() {
  return (
    <div className="flex-1 text-[#3b2414]">
      <PageIntro
        eyebrow="Since 1987"
        title="Three generations, one very old starter."
        lede="We are still a family bakery on the same corner, still mixing the first dough of the day at 3am."
      />
      <section className="max-w-6xl mx-auto px-4 md:px-8 pb-16 grid gap-12 md:grid-cols-[1.2fr_1fr]">
        <ol className="relative border-l-2 border-[#ecdcc6] pl-8 space-y-9">
          {TIMELINE.map(({ year, text }, i) => (
            <li key={i} className="relative">
              <span aria-hidden className="absolute -left-[2.6rem] top-1 h-4 w-4 rounded-full bg-[#e5a563] ring-4 ring-[#fffaf3]" />
              <p className="font-[family-name:var(--font-bakery)] text-2xl font-semibold text-[#9a5b25]">{year}</p>
              <p className="mt-1 text-[#7a5a40] leading-relaxed">{text}</p>
            </li>
          ))}
        </ol>
        <figure className="self-start rounded-[2rem] bg-gradient-to-br from-[#3f6b4a] to-[#2f523a] p-8 text-[#f4f1e8] shadow-xl shadow-[#3f6b4a]/25">
          <Wheat className="h-8 w-8 text-[#cfe3c4]" aria-hidden />
          <blockquote className="mt-5 font-[family-name:var(--font-bakery)] text-2xl leading-snug">
            &ldquo;Good bread takes time. We never found a shortcut worth taking.&rdquo;
          </blockquote>
          <figcaption className="mt-5 text-sm text-[#cfe3c4]">Theo Brandt, owner</figcaption>
        </figure>
      </section>
      <section className="bg-white/60 border-y border-[#ecdcc6]">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-16">
          <h2 className="font-[family-name:var(--font-bakery)] text-3xl font-semibold tracking-tight">The people behind the counter</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {TEAM.map(({ initials, name, role }) => (
              <div key={name} className="flex items-center gap-4 rounded-3xl bg-[#fffaf3] p-5 ring-1 ring-[#ecdcc6]">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#fdebd3] font-[family-name:var(--font-bakery)] text-xl font-semibold text-[#9a5b25]">
                  {initials}
                </span>
                <div>
                  <p className="font-semibold">{name}</p>
                  <p className="text-sm text-[#7a5a40]">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
