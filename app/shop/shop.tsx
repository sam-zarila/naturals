'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

/* ──────────────────────────────────────────────────────────────────────────────
   Scroll-spy hook (for the green active pill in the navbar)
────────────────────────────────────────────────────────────────────────────── */
function useSectionSpy(ids: string[]) {
  const [active, setActive] = useState<string>(ids[0] ?? '');
  useEffect(() => {
    const els = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;

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

/* ──────────────────────────────────────────────────────────────────────────────
   Inline icons (inherit currentColor → turn white on active)
────────────────────────────────────────────────────────────────────────────── */
function IconLeaf({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M19 5s-8-2-12 2-2 10 3 10 9-6 9-12Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 14c2-2 5-4 11-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconQuestionCircle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M9.6 9.5a2.4 2.4 0 1 1 3.8 2c-.7.4-1.4.9-1.4 1.8v.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="16.5" r="1" fill="currentColor"/>
    </svg>
  );
}
function IconStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path d="M12 17.27 6.803 20.36l1.28-5.52L3 9.82l5.6-.48L12 4l3.4 5.34 5.6.48-5.083 4.02 1.28 5.52L12 17.27Z" fill="currentColor" stroke="currentColor" strokeWidth="0.6" />
    </svg>
  );
}
function IconLifeBuoy({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M6.2 6.2l2 2M17.8 6.2l-2 2M6.2 17.8l2-2M17.8 17.8l-2-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Sticky navbar for this page
   Sections: #details, #howto, #reviews, #support
────────────────────────────────────────────────────────────────────────────── */
function ProductNavbar() {
  const active = useSectionSpy(['details', 'howto', 'reviews', 'support']);
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto h-16 px-3 sm:px-4 grid grid-cols-[auto_1fr] md:grid-cols-[auto_1fr_auto] items-center">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <Image src="/Layer.png" alt="Delightful Naturals" width={20} height={20} className="rounded" />
          <span className="hidden xs:inline font-semibold text-emerald-900 truncate text-base">
            Delightful Naturals
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center justify-center gap-8">
          <a href="#details" className={`navlink flex items-center gap-1.5 ${active === 'details' ? 'rounded-lg px-2 py-1 -mx-2 bg-emerald-600 text-white' : ''}`}>
            <IconLeaf className="w-4 h-4" aria-hidden /> <span>Details</span>
          </a>
          <a href="#howto" className={`navlink flex items-center gap-1.5 ${active === 'howto' ? 'rounded-lg px-2 py-1 -mx-2 bg-emerald-600 text-white' : ''}`}>
            <IconQuestionCircle className="w-4 h-4" aria-hidden /> <span>How to use</span>
          </a>
          <a href="#reviews" className={`navlink flex items-center gap-1.5 ${active === 'reviews' ? 'rounded-lg px-2 py-1 -mx-2 bg-emerald-600 text-white' : ''}`}>
            <IconStar className="w-4 h-4" aria-hidden /> <span>Reviews</span>
          </a>
          <a href="#support" className={`navlink flex items-center gap-1.5 ${active === 'support' ? 'rounded-lg px-2 py-1 -mx-2 bg-emerald-600 text-white' : ''}`}>
            <IconLifeBuoy className="w-4 h-4" aria-hidden /> <span>Support</span>
          </a>
        </nav>

        {/* Cart shortcut (optional) */}
        <Link href="/cart" className="justify-self-end hidden md:inline-flex rounded-xl px-3 py-2 text-sm border hover:bg-emerald-50">
          View Cart
        </Link>
      </div>

      <style jsx>{`
        .navlink {
          position: relative;
          color: rgb(6 95 70 / 0.8); /* emerald-800/80 */
          font-weight: 500;
          font-size: 0.95rem;
        }
        .navlink:hover { color: rgb(6 78 59); } /* emerald-900 */
        .navlink:after {
          content: '';
          position: absolute;
          left: 0;
          bottom: -6px;
          height: 2px;
          width: 0;
          background: #059669;
          border-radius: 2px;
          transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .navlink:hover:after { width: 100%; }
      `}</style>
    </header>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Catalog (two products): detox-60 & growth-100
────────────────────────────────────────────────────────────────────────────── */
type Product = {
  id: 'detox-60' | 'growth-100';
  name: string;
  size: string;
  inStock: boolean;
  price: number;
  image: string;
  gallery: string[];
  blurb: string;
  howToUse: string[];
  benefits: string[];
  rating: number;
  reviews: number;
};

const CATALOG: Record<Product['id'], Product> = {
  'detox-60': {
    id: 'detox-60',
    name: 'Scalp Detox Oil',
    size: '60ml',
    inStock: true,
    price: 260,
    image: '/products/hair-growth-oil-100ml.png',
    gallery: [
      '/products/hair-growth-oil-100ml.jpeg',
      '/hero/hair-growth-oil-100ml2.jpeg',
      '/products/hair-growth-oil-100ml.jpeg',
    ],
    blurb:
      'A purifying scalp treatment that removes buildup, balances oil production, and optimises the environment for healthy hair growth.',
    howToUse: [
      'Part hair and apply a few drops directly to the scalp.',
      'Massage for 2–3 minutes to stimulate circulation.',
      'Leave on 20–30 minutes (or overnight) before wash day.',
      'Use 2–3x per week for best results.',
    ],
    benefits: ['Clarifies', 'Balances Oil', 'Soothes Scalp', 'Boosts Growth'],
    rating: 4.9,
    reviews: 320,
  },
  'growth-100': {
    id: 'growth-100',
    name: 'Mega Potent Hair Growth Oil',
    size: '100ml',
    inStock: true,
    price: 300,
    image: '/products/hair-growth-oil-100ml.png',
    gallery: [
      '/hero/hair-growth-oil-100ml.jpeg',
      '/hero/hair-growth-oil-100ml1.jpeg',
      '/products/hair-growth-oil-100ml12.jpeg',
    ],
    blurb:
      'An indulgent Ayurvedic blend designed to strengthen strands, nourish the scalp, and encourage thicker, healthier growth.',
    howToUse: [
      'Warm a small amount between palms and apply to scalp and lengths.',
      'Massage gently for 2–3 minutes.',
      'Leave in as a sealing oil or pre-poo treatment before shampoo.',
      'Use 3–4x per week focusing on fragile areas.',
    ],
    benefits: ['Strengthens', 'Seals Moisture', 'Nourishes Roots', 'Improves Shine'],
    rating: 5.0,
    reviews: 510,
  },
};

/* ──────────────────────────────────────────────────────────────────────────────
   Page component: navbar + dynamic product section
────────────────────────────────────────────────────────────────────────────── */
export function ShopProductSection() {
  // selected product
  const [selectedId, setSelectedId] = useState<Product['id']>('detox-60');
  const product = CATALOG[selectedId];

  // gallery / UI state
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [open, setOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  // Toast state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef<number | undefined>(undefined);

  // recompute price display when product changes
  const priceDisplay = useMemo(
    () => `R${product.price.toLocaleString('en-ZA')}`,
    [product.price]
  );

  // reset gallery + qty when switching product
  useEffect(() => { setActive(0); setQty(1); }, [selectedId]);

  // ——— Cart helpers
  const CART_KEY = 'dn-cart';
  type CartRow = { id: string; qty: number };

  const readCart = (): CartRow[] => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed)
        ? parsed
            .filter((x) => x && typeof x.id === 'string' && Number.isFinite(x.qty))
            .map((x) => ({ id: x.id, qty: Math.max(1, Math.min(99, Number(x.qty))) }))
        : [];
    } catch {
      return [];
    }
  };
  const writeCart = (rows: CartRow[]) => { localStorage.setItem(CART_KEY, JSON.stringify(rows)); };

  const showToast = (message: string) => {
    setToastMsg(message);
    setToastOpen(true);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastOpen(false), 6200);
  };

  const addToCart = () => {
    const addQty = Math.max(1, Math.min(99, qty));
    const cart = readCart();
    const i = cart.findIndex((r) => r.id === product.id);
    if (i >= 0) cart[i].qty = Math.max(1, Math.min(99, cart[i].qty + addQty));
    else cart.push({ id: product.id, qty: addQty });
    writeCart(cart);

    // event for badges/mini-cart
    try {
      window.dispatchEvent(new CustomEvent('cart:add', { detail: { id: product.id, qty: addQty } }));
    } catch {}

    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 9200);
    showToast(`Added ${addQty} × ${product.name} to cart`);
  };

  return (
    <>
      <ProductNavbar />

      {/* Product picker (segmented control) */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="inline-flex rounded-2xl border bg-white p-1 shadow-sm">
          {([
            { id: 'detox-60', label: 'Scalp Detox Oil' },
            { id: 'growth-100', label: 'Mega Potent Oil' },
          ] as const).map((opt) => {
            const activeBtn = selectedId === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelectedId(opt.id)}
                className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition ${
                  activeBtn ? 'bg-emerald-600 text-white' : 'text-emerald-900 hover:bg-emerald-50'
                }`}
                type="button"
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <section className="relative bg-gradient-to-b from-white via-white to-emerald-50/20">
        {/* soft ambient glows */}
        <div aria-hidden className="pointer-events-none absolute -z-10 -top-24 -left-24 h-72 w-72 rounded-full blur-3xl"
             style={{ background: 'radial-gradient(circle, rgba(16,185,129,.15), transparent 60%)' }} />
        <div aria-hidden className="pointer-events-none absolute -z-10 -bottom-24 -right-24 h-80 w-80 rounded-full blur-3xl"
             style={{ background: 'radial-gradient(circle, rgba(2,132,199,.12), transparent 60%)' }} />

        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* ——— Left: Gallery Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative rounded-[22px] border border-neutral-100/80 bg-white/70 backdrop-blur-sm shadow-[0_20px_40px_rgba(0,0,0,0.06)] p-3"
            >
              <div className="relative aspect-[4/4] rounded-[18px] bg-neutral-100 overflow-hidden grid place-items-center">
                <Image
                  key={`${product.id}-${active}`}
                  src={product.gallery[active]}
                  alt={product.name}
                  fill
                  sizes="(min-width:768px) 550px, 90vw"
                  className="object-contain p-8 md:p-10 transition-transform duration-500 will-change-transform hover:scale-[1.03]"
                  priority
                />
                <div className="absolute left-4 top-4 flex gap-2">
                  <span className="rounded-full bg-emerald-600 text-white text-[11px] px-2 py-1">
                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                  <span className="rounded-full bg-black/80 text-white text-[11px] px-2 py-1">Best Seller</span>
                </div>
              </div>

              {/* thumbnails */}
              <div className="mt-3 grid grid-cols-3 gap-3">
                {product.gallery.map((src, i) => (
                  <button
                    key={src + i}
                    onClick={() => setActive(i)}
                    className={`relative aspect-square rounded-xl border transition ${
                      active === i ? 'border-neutral-900' : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                    aria-label={`Show image ${i + 1}`}
                  >
                    <Image src={src} alt="" fill className="object-contain p-2" />
                  </button>
                ))}
              </div>
            </motion.div>

            {/* ——— Right: Details Card */}
            <motion.div
              id="details"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <Link
                href="/shop"
                className="text-[28px] md:text-[32px] leading-snug font-semibold text-neutral-900 underline decoration-2 underline-offset-[6px] decoration-neutral-900/30 hover:decoration-neutral-900"
              >
                {product.name}
              </Link>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <span className="text-sky-600">{product.size}</span>
                <span className="text-neutral-400">•</span>
                <span className="text-neutral-500">{product.inStock ? 'In Stock' : 'Out of Stock'}</span>
                <span className="text-neutral-400">•</span>
                <Rating rating={product.rating} reviews={product.reviews} />
              </div>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 shadow-sm">
                <span className="text-xl font-semibold text-neutral-900">{priceDisplay}</span>
                <span className="text-[11px] text-neutral-500">incl. VAT</span>
              </div>

              <p className="mt-4 text-[15px] leading-relaxed text-neutral-700 max-w-prose">
                {product.blurb}
              </p>

              {/* benefit chips */}
              <div className="mt-4 flex flex-wrap gap-2">
                {product.benefits.map((b) => (
                  <span key={b} className="inline-flex items-center rounded-full border px-3 py-1 text-xs text-neutral-700 bg-white">
                    ✨ {b}
                  </span>
                ))}
              </div>

              {/* qty */}
              <div className="mt-6 flex items-center gap-3">
                <QtyStepper qty={qty} onChange={setQty} />
              </div>

              {/* add to cart */}
              <ShinyButton onClick={addToCart} className="mt-4 w-full md:w-[420px]">
                Add to Cart
              </ShinyButton>

              {/* confetti */}
              <AnimatePresence>{celebrate && <ConfettiBurst key="confetti" />}</AnimatePresence>

              {/* How to use */}
              <div id="howto" className="mt-6 md:w-[420px]">
                <Accordion title="How to use" open={open} onToggle={() => setOpen((v) => !v)}>
                  <ul className="list-disc list-inside space-y-1 text-sm text-neutral-700">
                    {product.howToUse.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </Accordion>
              </div>

              {/* reassurance bar */}
              <div className="mt-6 grid grid-cols-3 gap-2 text-[11px] text-neutral-600">
                <BadgeLine icon="🚚" text="Fast delivery" />
                <BadgeLine icon="🔒" text="Secure checkout" />
                <BadgeLine icon="🌿" text="100% natural" />
              </div>
            </motion.div>
          </div>

          {/* Reviews anchor */}
          <div id="reviews" className="mt-10 rounded-2xl border bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-lg font-semibold text-emerald-950">Customer Reviews</div>
              <div className="text-sm text-neutral-600">
                <strong>{product.rating.toFixed(1)}</strong> / 5 · {product.reviews} reviews
              </div>
            </div>
            <p className="mt-2 text-sm text-neutral-700">
              Love our {product.name}? <Link href="/reviews" className="underline">Read more &rarr;</Link>
            </p>
          </div>

          {/* Support anchor */}
          <div id="support" className="mt-8 grid sm:grid-cols-3 gap-3">
            <a href="https://wa.me/27672943837" target="_blank" rel="noreferrer" className="block rounded-xl border bg-white p-4 text-sm hover:-translate-y-0.5 hover:shadow transition">
              <div className="font-medium text-emerald-950">WhatsApp Support</div>
              <div className="text-neutral-600 mt-1">Fast help & order updates</div>
            </a>
            <a href="mailto:hello@delightfulnaturals.co.za" className="block rounded-xl border bg-white p-4 text-sm hover:-translate-y-0.5 hover:shadow transition">
              <div className="font-medium text-emerald-950">Email</div>
              <div className="text-neutral-600 mt-1">hello@delightfulnaturals.co.za</div>
            </a>
            <div className="rounded-xl border bg-white p-4 text-sm">
              <div className="font-medium text-emerald-950">Shipping</div>
              <div className="text-neutral-600 mt-1">2–4 business days (typical)</div>
            </div>
          </div>
        </div>

        {/* ✅ Toast: item added to cart — CENTERED */}
        <AnimatePresence>
          {toastOpen && (
            <motion.div
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[100] grid place-items-center p-4 pointer-events-none"
            >
              <div className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-emerald-200 bg-white p-3 shadow-[0_12px_30px_rgba(16,185,129,0.18)]">
                <span className="grid place-items-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                  ✓
                </span>
                <div className="pr-2">
                  <div className="text-sm font-medium text-emerald-900">Item added to cart</div>
                  <div className="text-xs text-emerald-800/80">{toastMsg}</div>
                  <div className="mt-2 flex gap-2">
                    <Link
                      href="/cart"
                      className="inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs bg-emerald-600 text-white"
                    >
                      View cart
                    </Link>
                    <button
                      onClick={() => setToastOpen(false)}
                      className="inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs border"
                    >
                      Close
                    </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  </>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   UI atoms
────────────────────────────────────────────────────────────────────────────── */
function Rating({ rating, reviews }: { rating: number; reviews: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className="inline-flex items-center gap-1 text-neutral-700">
      <span aria-label={`${rating} out of 5`} className="flex">
        {Array.from({ length: full }).map((_, i) => (<span key={`f${i}`} className="text-amber-500">★</span>))}
        {half && <span className="text-amber-500/70">★</span>}
        {Array.from({ length: 5 - full - (half ? 1 : 0) }).map((_, i) => (<span key={`e${i}`} className="text-neutral-300">★</span>))}
      </span>
      <span className="text-xs text-neutral-500">{rating.toFixed(1)} • {reviews} reviews</span>
    </span>
  );
}

function QtyStepper({ qty, onChange }: { qty: number; onChange: (n: number) => void; }) {
  return (
    <div className="inline-flex items-center rounded-xl border border-neutral-200 overflow-hidden bg-white shadow-sm">
      <motion.button whileTap={{ scale: 0.92 }} className="w-10 h-10 grid place-items-center text-xl text-neutral-700 hover:bg-neutral-100"
        onClick={() => onChange(Math.max(1, qty - 1))} aria-label="Decrease quantity">–</motion.button>
      <div className="w-12 h-10 grid place-items-center text-neutral-900">{qty}</div>
      <motion.button whileTap={{ scale: 0.92 }} className="w-10 h-10 grid place-items-center text-xl text-neutral-700 hover:bg-neutral-100"
        onClick={() => onChange(Math.min(99, qty + 1))} aria-label="Increase quantity">+</motion.button>
    </div>
  );
}

function ShinyButton({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void; }) {
  return (
    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.985 }} onClick={onClick}
      className={`relative inline-flex h-11 items-center justify-center rounded-full bg-black text-white px-6 text-sm font-medium shadow-md overflow-hidden ${className}`}>
      <motion.span aria-hidden className="absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-white/20"
        initial={{ x: '-120%' }} animate={{ x: '120%' }} transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }} />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

function Accordion({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode; }) {
  return (
    <div className="rounded-[14px] bg-white/80 backdrop-blur-sm border border-neutral-200 shadow-sm overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 h-11 text-sm font-medium text-neutral-900" aria-expanded={open}>
        <span>{title}</span>
        <span className="inline-grid place-items-center w-6 h-6 rounded-full border border-neutral-300">
          <motion.span animate={{ rotate: open ? 45 : 0 }}>+</motion.span>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28 }} className="px-4 pb-4">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BadgeLine({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-white border border-neutral-200 px-2.5 py-1.5 shadow-sm">
      <span className="text-base">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

/* Confetti without extra libs — simple floating bits */
function ConfettiBurst() {
  const bits = Array.from({ length: 14 }).map((_, i) => i);
  return (
    <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 1.1 }}
      className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2">
      <div className="relative w-0 h-0">
        {bits.map((b) => {
          const x = (Math.random() - 0.5) * 220;
          const y = -Math.random() * 140 - 40;
          const rot = Math.random() * 180;
          return (
            <motion.span key={b} initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
              animate={{ x, y, rotate: rot, opacity: 0 }} transition={{ duration: 1.1, ease: 'easeOut' }}
              className="absolute block w-2 h-2 rounded-sm"
              style={{ backgroundColor: ['#10B981', '#F59E0B', '#0EA5E9', '#111827'][b % 4] }}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
