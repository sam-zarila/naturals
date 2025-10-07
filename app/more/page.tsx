'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ================================
   Motion helper
================================= */
const fade = {
  initial: { opacity: 0, y: 10 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.45 },
} as const;

/* ================================
   Cart helper (matches dn-cart)
================================= */
function addToCart(productId: string, qty = 1) {
  const key = 'dn-cart';
  const q = Math.max(1, Math.min(99, qty));
  let cart: Array<{ id: string; qty: number }> = [];
  try {
    cart = JSON.parse(localStorage.getItem(key) || '[]');
  } catch {}
  const i = cart.findIndex((r) => r.id === productId);
  if (i > -1) cart[i].qty = Math.min(99, (cart[i].qty || 0) + q);
  else cart.push({ id: productId, qty: q });
  localStorage.setItem(key, JSON.stringify(cart));
  try {
    window.dispatchEvent(new CustomEvent('cart:add', { detail: { id: productId, qty: q } }));
  } catch {}
}

/* ================================
   Icons (matching your style)
================================= */
function IconHome({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10.5V20h12v-9.5" strokeLinecap="round" />
    </svg>
  );
}
function IconBook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3V4Z" strokeLinecap="round" />
      <path d="M17 20V7a3 3 0 0 0-3-3" strokeLinecap="round" />
    </svg>
  );
}
function IconDrop({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3s6 6.04 6 10a6 6 0 1 1-12 0c0-3.96 6-10 6-10Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconChevron({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor" aria-hidden>
      <path d="M7 5l6 5-6 5V5z" />
    </svg>
  );
}

/* ================================
   Section Spy
================================= */
function useSectionSpy(ids: string[]) {
  const [active, setActive] = React.useState<string>('');

  // from hash
  React.useEffect(() => {
    const setFromHash = () => {
      const h = window.location.hash.replace('#', '');
      if (ids.includes(h)) setActive(h);
    };
    setFromHash();
    window.addEventListener('hashchange', setFromHash);
    return () => window.removeEventListener('hashchange', setFromHash);
  }, [ids]);

  // while scrolling
  React.useEffect(() => {
    const els = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (vis[0]) setActive((vis[0].target as HTMLElement).id);
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids.join(',')]);

  return active;
}

/* ================================
   Pretty Breadcrumbs (icon pills)
================================= */
function BreadcrumbsFancy({
  section, // optional nested section (e.g. current product block)
}: {
  section?: { label: string; href?: string };
}) {
  const isSection = Boolean(section?.label);

  return (
    <nav aria-label="Breadcrumb" className="bg-gradient-to-b from-emerald-50/60 to-white border rounded-2xl">
      <div className="px-3 sm:px-4 py-2.5">
        <ol className="flex flex-wrap items-center gap-1.5">
          {/* Home */}
          <li>
            <Link
              href="/"
              className="group inline-flex items-center gap-2 rounded-2xl border bg-white px-3 py-1.5 text-sm text-emerald-900 shadow-sm hover:-translate-y-0.5 hover:shadow transition"
            >
              <span className="inline-grid place-items-center w-6 h-6 rounded-xl bg-emerald-100 text-emerald-700 border">
                <IconHome className="w-3.5 h-3.5" />
              </span>
              <span className="font-medium">Home</span>
            </Link>
          </li>

          <li aria-hidden className="px-1 text-emerald-700/60">
            <IconChevron className="w-4 h-4" />
          </li>

          {/* Product Guide (current if no section; otherwise link) */}
          <li>
            {isSection ? (
              <Link
                href="/more"
                className="group inline-flex items-center gap-2 rounded-2xl border bg-white px-3 py-1.5 text-sm text-emerald-900 shadow-sm hover:-translate-y-0.5 hover:shadow transition"
              >
                <span className="inline-grid place-items-center w-6 h-6 rounded-xl bg-emerald-100 text-emerald-700 border">
                  <IconBook className="w-3.5 h-3.5" />
                </span>
                <span className="font-medium">Product Guide</span>
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 text-white px-3 py-1.5 text-sm shadow">
                <span className="inline-grid place-items-center w-6 h-6 rounded-xl bg-white/20 border border-white/30">
                  <IconBook className="w-3.5 h-3.5" />
                </span>
                <span className="font-semibold">Product Guide</span>
              </span>
            )}
          </li>

          {/* Section (active) */}
          {isSection && (
            <>
              <li aria-hidden className="px-1 text-emerald-700/60">
                <IconChevron className="w-4 h-4" />
              </li>
              <li aria-current="page">
                <span className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 text-white px-3 py-1.5 text-sm shadow">
                  <span className="inline-grid place-items-center w-6 h-6 rounded-xl bg-white/20 border border-white/30">
                    <IconDrop className="w-3.5 h-3.5" />
                  </span>
                  <span className="font-semibold">{section!.label}</span>
                </span>
              </li>
            </>
          )}
        </ol>
      </div>
    </nav>
  );
}

/* ================================
   Page
================================= */
export default function MoreInfoPage() {
  const activeSection = useSectionSpy(['growth-100', 'detox-60']);
  const sectionLabels: Record<string, string> = {
    'growth-100': 'Hair Growth Oil · 100ml',
    'detox-60': 'Scalp Detox Oil · 60ml',
  };
  const section =
    activeSection && sectionLabels[activeSection]
      ? { label: sectionLabels[activeSection], href: `#${activeSection}` }
      : undefined;

  return (
    <main className="bg-white">
      {/* Smooth anchors + offset for sticky bar */}
      <style jsx global>{`
        html { scroll-behavior: smooth; }
        section[id] { scroll-margin-top: 88px; }
      `}</style>

      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Delightful Naturals" width={28} height={28} className="rounded" />
            <span className="font-semibold text-emerald-900">Delightful Naturals</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-sm">
            <a href="#growth-100" className="hover:text-emerald-700">Hair Growth Oil</a>
            <a href="#detox-60" className="hover:text-emerald-700">Scalp Detox Oil</a>
            <Link href="/shop" className="inline-flex rounded-lg px-3 py-1.5 border">Shop</Link>
          </nav>
        </div>
      </div>

      {/* Hero / Intro */}
      <section className="relative">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(1000px_500px_at_50%_-10%,rgba(16,185,129,0.12),transparent_60%)]"
        />
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-14 space-y-4">
          {/* Fancy Breadcrumbs */}
          <motion.div {...fade}>
            <BreadcrumbsFancy section={section} />
          </motion.div>

          <motion.h1 {...fade} className="text-3xl md:text-4xl font-extrabold text-emerald-950 tracking-tight">
            Product Guide & Ingredients
          </motion.h1>
          <motion.p
            {...fade}
            transition={{ ...fade.transition, delay: 0.06 }}
            className="text-emerald-900/80 max-w-2xl"
          >
            What’s inside each bottle, why it works, and how to use it for the best results.
          </motion.p>

          <motion.div
            {...fade}
            transition={{ ...fade.transition, delay: 0.12 }}
            className="pt-1 flex flex-wrap gap-2"
          >
            <a href="#growth-100" className="chip">Hair Growth Oil · 100ml</a>
            <a href="#detox-60" className="chip">Scalp Detox Oil · 60ml</a>
          </motion.div>
        </div>
      </section>

      {/* Hair Growth Oil */}
      <ProductSection
        id="growth-100"
        badge="Best Seller"
        name="Hair Growth Oil · 100ml"
        price="R300"
        desc="A luxurious Ayurvedic-inspired blend that nourishes the scalp, strengthens strands, and supports a healthy growth cycle—perfect for thinning edges, postpartum shedding, and dry ends."
        image="/products/hair-growth-oil-100ml.jpeg"
        bullets={['Boosts growth', 'Seals in moisture', 'Strengthens ends', 'Adds shine']}
        ingredients={[
          {
            group: 'Key Oils',
            items: [
              ['Castor', 'Ricinoleic acid for thickness & retention'],
              ['Flaxseed', 'Omega-3 support for elasticity'],
              ['Jojoba', 'Balances scalp; similar to natural sebum'],
            ],
          },
          {
            group: 'Herbal Actives',
            items: [
              ['Amla', 'Ayurvedic root strength & shine'],
              ['Moringa', 'Nutrient-dense scalp vitality'],
              ['Hibiscus', 'Fullness & softness'],
              ['Rosemary', 'Invigorates the scalp'],
              ['Nettle', 'Traditional botanical support'],
            ],
          },
          {
            group: 'Support & Stability',
            items: [
              ['Tocopherol (Vitamin E)', 'Antioxidant support'],
              ['Caprylic/Capric Triglyceride', 'Silky, lightweight carrier'],
            ],
          },
        ]}
        howTo={[
          'Part hair and apply a few drops to scalp and/or lengths.',
          'Massage 2–3 minutes to boost circulation.',
          'Leave in as a sealant or pre-wash (20–60 minutes).',
          'Use 3–4× per week; adjust to hair’s needs.',
        ]}
        tips={[
          'Be consistent for 6–8 weeks on edges.',
          'Sleep with satin bonnet/scarf to reduce friction.',
          'Fine hair? Start with less to avoid over-oiling.',
        ]}
        productId="growth-100"
      />

      {/* Scalp Detox Oil */}
      <ProductSection
        id="detox-60"
        badge="Scalp Care"
        name="Scalp Detox Oil · 60ml"
        price="R260"
        desc="A clarifying, soothing pre-wash treatment that lifts buildup, balances oil, and refreshes between wash days—without stripping."
        image="/products/hair-growth-oil-100ml12.jpeg"
        bullets={['Clarifies gently', 'Balances oil', 'Soothes itchiness', 'Refreshes scalp']}
        ingredients={[
          {
            group: 'Lightweight Oils',
            items: [
              ['Grapeseed', 'Featherweight feel; won’t weigh hair down'],
              ['Jojoba', 'Oil-balancing scalp support'],
            ],
          },
          {
            group: 'Botanical Support',
            items: [
              ['Rosemary', 'Invigorating botanical for the scalp'],
              ['Nettle', 'Traditional soothing support'],
            ],
          },
          {
            group: 'Support & Stability',
            items: [
              ['Tocopherol (Vitamin E)', 'Antioxidant support'],
              ['Caprylic/Capric Triglyceride', 'Ultra-light silky carrier'],
            ],
          },
        ]}
        howTo={[
          'Before wash, part hair and apply to scalp.',
          'Massage 2–3 minutes, target itchy/flaky areas.',
          'Leave on 20–30 minutes (or overnight if comfy).',
          'Shampoo & condition as usual.',
        ]}
        tips={[
          'Use 2–3× weekly or as needed.',
          'Pair with gentle shampoo to avoid over-stripping.',
          'Sensitive scalp? Start with fewer drops.',
        ]}
        productId="detox-60"
      />

      {/* Compare / CTA */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <motion.div {...fade} className="rounded-3xl border bg-white shadow-sm overflow-hidden">
          <div className="grid sm:grid-cols-2">
            <div className="p-6 sm:p-8 border-b sm:border-b-0 sm:border-r">
              <h3 className="text-lg font-semibold text-emerald-950">Not sure where to start?</h3>
              <p className="mt-2 text-emerald-900/80">
                Use <span className="font-medium">Scalp Detox Oil</span> pre-wash for a fresh, balanced scalp, then seal
                in moisture with <span className="font-medium">Hair Growth Oil</span> on mid-lengths &amp; ends.
              </p>
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap gap-2">
                <Link href="/shop" className="btn-primary">Visit Shop</Link>
                <Link href="/cart" className="btn-ghost">View Cart</Link>
              </div>
              <p className="mt-3 text-xs text-emerald-900/70">Always patch test. Discontinue if irritation occurs.</p>
            </div>
          </div>
        </motion.div>
      </section>

      <style jsx>{`
        .chip {
          @apply inline-flex items-center rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-sm text-emerald-900 shadow-sm hover:bg-emerald-50 transition;
        }
        .btn-primary {
          @apply inline-flex items-center justify-center rounded-xl px-4 py-2.5 bg-emerald-600 text-white shadow hover:bg-emerald-700 transition;
        }
        .btn-ghost {
          @apply inline-flex items-center justify-center rounded-xl px-4 py-2.5 border;
        }
        .pill {
          @apply inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-2.5 py-1;
        }
        .card {
          @apply rounded-3xl border bg-white shadow-sm;
        }
        .h2 {
          @apply text-2xl md:text-3xl font-bold text-emerald-950;
        }
        .subtle {
          @apply text-emerald-900/80;
        }
        .badge {
          @apply inline-flex items-center rounded-full bg-black text-white text-[11px] px-2 py-0.5;
        }
      `}</style>
    </main>
  );
}

/* ================================
   Product Section
================================= */
function ProductSection(props: {
  id: string;
  badge: string;
  name: string;
  price: string;
  desc: string;
  image: string;
  bullets: string[];
  ingredients: Array<{ group: string; items: Array<[string, string]> }>;
  howTo: string[];
  tips: string[];
  productId: string;
}) {
  const { id, badge, name, price, desc, image, bullets, ingredients, howTo, tips, productId } =
    props;

  return (
    <section id={id} className="relative">
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-14">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Image card */}
          <motion.div {...fade} className="card overflow-hidden p-3">
            <div className="relative aspect-[4/4] rounded-2xl bg-neutral-100 grid place-items-center overflow-hidden">
              <Image
                src={image}
                alt={name}
                fill
                sizes="(min-width:768px) 540px, 92vw"
                className="object-contain p-8 md:p-10"
                priority
              />
              <span className="absolute left-4 top-4 badge">{badge}</span>
            </div>
            <div className="p-3 pt-4 flex flex-wrap gap-2">
              {bullets.map((b) => (
                <span key={b} className="pill">✨ {b}</span>
              ))}
            </div>
          </motion.div>

          {/* Details */}
          <motion.div {...fade}>
            <h2 className="h2">{name}</h2>
            <div className="mt-1 inline-flex items-center gap-2">
              <span className="text-xl font-semibold text-emerald-950">{price}</span>
              <span className="text-xs text-emerald-900/60">incl. VAT</span>
            </div>
            <p className="mt-3 subtle">{desc}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => addToCart(productId, 1)} className="btn-primary" aria-label={`Add ${name} to cart`}>
                Add to cart
              </button>
              <Link href="/shop" className="btn-ghost">View all products</Link>
            </div>

            {/* Ingredients accordions */}
            <div className="mt-6 space-y-3">
              {ingredients.map((grp, i) => (
                <Accordion key={grp.group} title={grp.group} defaultOpen={i === 0}>
                  <ul className="space-y-2">
                    {grp.items.map(([label, note]) => (
                      <li key={label} className="flex items-start gap-2">
                        <span className="mt-1 text-emerald-600">•</span>
                        <div>
                          <div className="font-medium text-emerald-950">{label}</div>
                          <div className="text-sm text-emerald-900/80">{note}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Accordion>
              ))}
            </div>

            {/* How to use + tips */}
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              <div className="card p-4">
                <div className="font-semibold text-emerald-950">How to use</div>
                <ol className="mt-2 space-y-2 text-sm text-emerald-900/90 list-decimal list-inside">
                  {howTo.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ol>
              </div>

              <div className="card p-4">
                <div className="font-semibold text-emerald-950">Tips</div>
                <ul className="mt-2 space-y-2 text-sm text-emerald-900/90">
                  {tips.map((t) => (
                    <li key={t} className="flex gap-2">
                      <span>💡</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px] text-emerald-900/70">
                  Patch test before first use. Discontinue if irritation occurs.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ================================
   Accordion
================================= */
function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 h-12 text-sm font-medium text-emerald-950"
        aria-expanded={open}
      >
        <span>{title}</span>
        <span className="inline-grid place-items-center w-6 h-6 rounded-full border">
          <motion.span animate={{ rotate: open ? 45 : 0 }} className="block text-base leading-none">
            +
          </motion.span>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="px-4 pb-4"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
