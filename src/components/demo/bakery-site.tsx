import { Clock, Coffee, Croissant, MapPin, Phone, Star, Wheat, Cake } from "lucide-react";

/**
 * Main Responsibility: The pretend client website that /demo visitors mark up.
 * A small neighbourhood bakery, because that is the kind of SMB site the
 * agencies we sell to actually build. It carries a few deliberate flaws (a
 * typo in the hero, a price that sits out of line, a stale copyright year)
 * so there is something obvious to pin.
 *
 * Sensitive Dependencies:
 * - `#demo-hours` and `#demo-order-btn` are anchor targets for the seeded
 *   pins in `public/widget-demo-backend.js`. Keep the ids.
 * - Pure markup, no client JS: the widget anchors pins to these elements, and
 *   a re-render that swaps nodes would push pins onto their fallback position.
 */

const MENU = [
  { icon: Croissant, name: "Butter croissant", note: "72 layers, laminated by hand at 4am.", price: "$3.80" },
  { icon: Wheat, name: "Country sourdough", note: "Two-day ferment, stone-milled rye.", price: "$9.50" },
  { icon: Cake, name: "Pistachio morning bun", note: "Orange zest, cardamom sugar.", price: "$4.60", offbeat: true },
];

const HOURS = [
  ["Mon to Fri", "7:00 to 18:00"],
  ["Saturday", "8:00 to 16:00"],
  ["Sunday", "8:00 to 13:00"],
];

export function BakerySite() {
  return (
    <div className="flex-1 text-[#3b2414]">
      {/* Site nav */}
      <header className="border-b border-[#ecdcc6]">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#6b3f1d] text-[#fffaf3]">
              <Croissant className="h-5 w-5" aria-hidden />
            </span>
            <span className="font-[family-name:var(--font-bakery)] text-2xl font-semibold tracking-tight">Crumb &amp; Co.</span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-[#7a5a40]">
            <span>Menu</span>
            <span>Catering</span>
            <span>Our story</span>
            <span>Visit</span>
          </nav>
          <span className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-[#7a5a40]">
            <Phone className="h-4 w-4" aria-hidden /> (555) 014-2290
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute -top-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-[#f6c98f]/40 blur-3xl" />
        <div aria-hidden className="absolute -bottom-40 -left-24 h-[24rem] w-[24rem] rounded-full bg-[#b7d3a8]/40 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#fdebd3] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#9a5b25]">
              Since 1987 &middot; Maple Street
            </span>
            <h1 className="mt-6 font-[family-name:var(--font-bakery)] text-5xl md:text-6xl font-semibold leading-[1.05] tracking-tight">
              Freshly baked, evrey morning.
            </h1>
            <p className="mt-6 text-lg text-[#7a5a40] leading-relaxed max-w-md">
              Slow-fermented breads, flaky pastries and proper coffee, made from scratch in the back of our little shop.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <span
                id="demo-order-btn"
                className="inline-flex items-center justify-center rounded-full bg-[#6b3f1d] px-7 py-3.5 font-semibold text-[#fffaf3] shadow-lg shadow-[#6b3f1d]/25"
              >
                Order for pickup
              </span>
              <span className="inline-flex items-center justify-center rounded-full border-2 border-[#d9c2a5] px-7 py-3.5 font-semibold text-[#6b3f1d]">
                See the menu
              </span>
            </div>
          </div>

          {/* Illustrated "photo" card */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="aspect-[4/5] rounded-[2.5rem] bg-gradient-to-br from-[#f3c58a] via-[#e5a563] to-[#b8733a] p-8 shadow-2xl shadow-[#b8733a]/30 flex flex-col justify-between">
              <div className="flex justify-between text-[#fffaf3]/90">
                <Wheat className="h-10 w-10" aria-hidden />
                <Coffee className="h-10 w-10" aria-hidden />
              </div>
              <Croissant className="mx-auto h-40 w-40 text-[#fffaf3] drop-shadow-xl" strokeWidth={1.25} aria-hidden />
              <p className="font-[family-name:var(--font-bakery)] text-2xl text-[#fffaf3] leading-snug">
                &ldquo;Today&apos;s bake: cardamom knots.&rdquo;
              </p>
            </div>
            <div className="absolute -bottom-6 -left-6 rounded-2xl bg-white px-5 py-4 shadow-xl ring-1 ring-[#ecdcc6]">
              <div className="flex gap-0.5 text-[#e5a563]">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" aria-hidden />)}
              </div>
              <p className="mt-1 text-sm font-semibold">4.9 from 812 neighbours</p>
            </div>
          </div>
        </div>
      </section>

      {/* Menu */}
      <section className="bg-white/60 border-y border-[#ecdcc6]">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-20">
          <h2 className="font-[family-name:var(--font-bakery)] text-4xl font-semibold tracking-tight">Fresh from the oven</h2>
          <p className="mt-3 text-[#7a5a40]">Out of the oven by 7. Usually gone by noon.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {MENU.map(({ icon: Icon, name, note, price, offbeat }) => (
              <div key={name} className="rounded-3xl bg-[#fffaf3] p-7 ring-1 ring-[#ecdcc6] shadow-sm">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fdebd3] text-[#9a5b25]">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{name}</h3>
                <p className="mt-2 text-sm text-[#7a5a40] leading-relaxed">{note}</p>
                {/* Deliberately out of line on the last card: something to pin. */}
                <p className={offbeat ? "mt-2 ml-10 text-2xl font-bold text-[#3f6b4a]" : "mt-6 text-lg font-bold text-[#3f6b4a]"}>{price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visit */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-20 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="font-[family-name:var(--font-bakery)] text-4xl font-semibold tracking-tight">Come say hello</h2>
          <p className="mt-4 text-[#7a5a40] leading-relaxed max-w-md">
            Grab a window seat, or order ahead and skip the Saturday queue. Dogs welcome, and they get a biscuit.
          </p>
          <p className="mt-6 inline-flex items-center gap-2 font-medium">
            <MapPin className="h-5 w-5 text-[#9a5b25]" aria-hidden /> 42 Maple Street, Riverton
          </p>
        </div>
        <div id="demo-hours" className="rounded-3xl bg-[#3f6b4a] p-8 text-[#f4f1e8] shadow-xl shadow-[#3f6b4a]/20">
          <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-[#cfe3c4]">
            <Clock className="h-4 w-4" aria-hidden /> Opening hours
          </p>
          <dl className="mt-6 divide-y divide-white/15">
            {HOURS.map(([day, time]) => (
              <div key={day} className="flex justify-between py-3">
                <dt className="font-medium">{day}</dt>
                <dd className="tabular-nums">{time}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <footer className="border-t border-[#ecdcc6] py-8 text-center text-sm text-[#9a7a60]">
        &copy; 2019 Crumb &amp; Co. Bakery &middot; A made-up business for the VibeVaults demo
      </footer>
    </div>
  );
}
