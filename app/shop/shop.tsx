'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';


import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../lib/firebase-client';

/* ──────────────────────────────────────────────────────────────────────────────
   Icons + Breadcrumb
────────────────────────────────────────────────────────────────────────────── */
function IconHome({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10.5V20h12v-9.5" strokeLinecap="round" />
    </svg>
  );
}
function IconBag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 8a3 3 0 1 1 6 0" strokeLinecap="round" />
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

function BreadcrumbsHomeShop() {
  return (
    <nav aria-label="Breadcrumb" className="bg-gradient-to-b from-emerald-50/60 to-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <ol className="flex flex-wrap items-center gap-1.5">
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

          <li aria-current="page">
            <span className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 text-white px-3 py-1.5 text-sm shadow">
              <span className="inline-grid place-items-center w-6 h-6 rounded-xl bg-white/20 border border-white/30">
                <IconBag className="w-3.5 h-3.5" />
              </span>
              <span className="font-semibold">Shop</span>
            </span>
          </li>
        </ol>
      </div>
    </nav>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Types / IDs
────────────────────────────────────────────────────────────────────────────── */
const IDS = ['detox-60', 'growth-100'] as const;
type ProductID = typeof IDS[number];

type ProductDocFromDb = {
  id: ProductID;
  name: string;
  size: string;
  inStock: boolean;
  price: number;
  blurb: string;
  howToUse: string[];
  benefits: string[];
  gallery: string[];
  rating: number;
  reviews: number;
  updatedAt: number;
};

/* ──────────────────────────────────────────────────────────────────────────────
   Main component – Client-side Firestore read (no /api)
────────────────────────────────────────────────────────────────────────────── */
export function ShopProductSection() {
  const [selectedId, setSelectedId] = useState<ProductID>('detox-60');
  const [products, setProducts] = useState<Partial<Record<ProductID, ProductDocFromDb>>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [open, setOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef<number | undefined>(undefined);

  // Load both product docs from Firestore
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
      const results = await Promise.all(
        IDS.map(async (id) => {
        const snap = await getDoc(doc(firestore, 'products', id));
        return snap.exists() ? (snap.data() as ProductDocFromDb) : null;
        })
      );

      if (!mounted) return;

      const map: Partial<Record<ProductID, ProductDocFromDb>> = {};
      results.forEach((p) => {
        if (p) map[p.id] = p;
      });
      setProducts(map);

      const available = IDS.filter((id) => map[id]);
      if (available.length && !map[selectedId]) setSelectedId(available[0]);
      } catch (e) {
      if (!mounted) return;
      setErr((e instanceof Error ? e.message : 'Failed to load products'));
      setProducts({});
      } finally {
      if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const product = products[selectedId];

  const priceDisplay = useMemo(
    () => (product ? `R${Number(product.price || 0).toLocaleString('en-ZA')}` : ''),
    [product]
  );

  useEffect(() => {
    setActive(0);
    setQty(1);
  }, [selectedId]);

  // cart
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
  const writeCart = (rows: CartRow[]) => localStorage.setItem(CART_KEY, JSON.stringify(rows));

  const showToast = (message: string) => {
    setToastMsg(message);
    setToastOpen(true);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastOpen(false), 6200);
  };

  const addToCart = () => {
    if (!product) return;
    const addQty = Math.max(1, Math.min(99, qty));
    const cart = readCart();
    const i = cart.findIndex((r) => r.id === product.id);
    if (i >= 0) cart[i].qty = Math.max(1, Math.min(99, cart[i].qty + addQty));
    else cart.push({ id: product.id, qty: addQty });
    writeCart(cart);

    try {
      window.dispatchEvent(new CustomEvent('cart:add', { detail: { id: product.id, qty: addQty } }));
    } catch {}

    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 9200);
    showToast(`Added ${addQty} × ${product.name} to cart`);
  };

  const options = (IDS.filter((id) => products[id]) as ProductID[]).map((id) => ({
    id,
    label: products[id]!.name,
  }));

  return (
    <>
      <BreadcrumbsHomeShop />

      {/* Product picker */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="inline-flex rounded-2xl border bg-white p-1 shadow-sm">
          {options.map((opt) => {
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
        {loading && <div className="mt-2 text-xs text-neutral-500">Loading products…</div>}
        {!loading && !err && options.length === 0 && (
          <div className="mt-2 text-xs text-red-600">No products found in Firestore.</div>
        )}
        {err && <div className="mt-2 text-xs text-red-600">{err}</div>}
      </div>

      {/* Only render if we have a product */}
      {product && (
        <section className="relative bg-gradient-to-b from-white via-white to-emerald-50/20">
          {/* glows */}
          <div
            aria-hidden
            className="pointer-events-none absolute -z-10 -top-24 -left-24 h-72 w-72 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,.15), transparent 60%)' }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -z-10 -bottom-24 -right-24 h-80 w-80 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(2,132,199,.12), transparent 60%)' }}
          />

          <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Left: Gallery */}
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

              {/* Right: Details */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <h2 className="text-[28px] md:text-[32px] leading-snug font-semibold text-neutral-900">
                  {product.name}
                </h2>

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

                <p className="mt-4 text-[15px] leading-relaxed text-neutral-700 max-w-prose">{product.blurb}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {product.benefits.map((b) => (
                    <span key={b} className="inline-flex items-center rounded-full border px-3 py-1 text-xs text-neutral-700 bg-white">
                      ✨ {b}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <QtyStepper qty={qty} onChange={setQty} />
                </div>

                <ShinyButton onClick={addToCart} className="mt-4 w-full md:w-[420px]">
                  Add to Cart
                </ShinyButton>

                <AnimatePresence>{celebrate && <ConfettiBurst key="confetti" />}</AnimatePresence>

                <div className="mt-6 md:w-[420px]">
                  <Accordion title="How to use" open={open} onToggle={() => setOpen((v) => !v)}>
                    <ul className="list-disc list-inside space-y-1 text-sm text-neutral-700">
                      {product.howToUse.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ul>
                  </Accordion>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2 text-[11px] text-neutral-600">
                  <BadgeLine icon="🚚" text="Fast delivery" />
                  <BadgeLine icon="🔒" text="Secure checkout" />
                  <BadgeLine icon="🌿" text="100% natural" />
                </div>
              </motion.div>
            </div>

            <div className="mt-10 rounded-2xl border bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-lg font-semibold text-emerald-950">Customer Reviews</div>
                <div className="text-sm text-neutral-600">
                  <strong>{product.rating.toFixed(1)}</strong> / 5 · {product.reviews} reviews
                </div>
              </div>
              <p className="mt-2 text-sm text-neutral-700">
                Love our {product.name}? <Link href="/reviews" className="underline">Read more →</Link>
              </p>
            </div>

            <div className="mt-8 grid sm:grid-cols-3 gap-3">
              <a
                href="https://wa.me/27672943837"
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl border bg-white p-4 text-sm hover:-translate-y-0.5 hover:shadow transition"
              >
                <div className="font-medium text-emerald-950">WhatsApp Support</div>
                <div className="text-neutral-600 mt-1">Fast help & order updates</div>
              </a>
              <a
                href="mailto:hello@delightfulnaturals.co.za"
                className="block rounded-xl border bg-white p-4 text-sm hover:-translate-y-0.5 hover:shadow transition"
              >
                <div className="font-medium text-emerald-950">Email</div>
                <div className="text-neutral-600 mt-1">hello@delightfulnaturals.co.za</div>
              </a>
              <div className="rounded-xl border bg-white p-4 text-sm">
                <div className="font-medium text-emerald-950">Shipping</div>
                <div className="text-neutral-600 mt-1">2–4 business days (typical)</div>
              </div>
            </div>
          </div>

          {/* Toast */}
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
                      <Link href="/cart" className="inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs bg-emerald-600 text-white">
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
      )}
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
        {Array.from({ length: full }).map((_, i) => (
          <span key={`f${i}`} className="text-amber-500">★</span>
        ))}
        {half && <span className="text-amber-500/70">★</span>}
        {Array.from({ length: 5 - full - (half ? 1 : 0) }).map((_, i) => (
          <span key={`e${i}`} className="text-neutral-300">★</span>
        ))}
      </span>
      <span className="text-xs text-neutral-500">{rating.toFixed(1)} • {reviews} reviews</span>
    </span>
  );
}

function QtyStepper({ qty, onChange }: { qty: number; onChange: (n: number) => void }) {
  return (
    <div className="inline-flex items-center rounded-xl border border-neutral-200 overflow-hidden bg-white shadow-sm">
      <motion.button
        whileTap={{ scale: 0.92 }}
        className="w-10 h-10 grid place-items-center text-xl text-neutral-700 hover:bg-neutral-100"
        onClick={() => onChange(Math.max(1, qty - 1))}
        aria-label="Decrease quantity"
      >
        –
      </motion.button>
      <div className="w-12 h-10 grid place-items-center text-neutral-900">{qty}</div>
      <motion.button
        whileTap={{ scale: 0.92 }}
        className="w-10 h-10 grid place-items-center text-xl text-neutral-700 hover:bg-neutral-100"
        onClick={() => onChange(Math.min(99, qty + 1))}
        aria-label="Increase quantity"
      >
        +
      </motion.button>
    </div>
  );
}

function ShinyButton({
  children,
  className = '',
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className={`relative inline-flex h-11 items-center justify-center rounded-full bg-black text-white px-6 text-sm font-medium shadow-md overflow-hidden ${className}`}
    >
      <motion.span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-white/20"
        initial={{ x: '-120%' }}
        animate={{ x: '120%' }}
        transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

function Accordion({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[14px] bg-white/80 backdrop-blur-sm border border-neutral-200 shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 h-11 text-sm font-medium text-neutral-900"
        aria-expanded={open}
      >
        <span>{title}</span>
        <span className="inline-grid place-items-center w-6 h-6 rounded-full border border-neutral-300">
          <motion.span animate={{ rotate: open ? 45 : 0 }}>+</motion.span>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="px-4 pb-4"
          >
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

function ConfettiBurst() {
  const bits = Array.from({ length: 14 }).map((_, i) => i);
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 1.1 }}
      className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2"
    >
      <div className="relative w-0 h-0">
        {bits.map((b) => {
          const x = (Math.random() - 0.5) * 220;
          const y = -Math.random() * 140 - 40;
          const rot = Math.random() * 180;
          return (
            <motion.span
              key={b}
              initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
              animate={{ x, y, rotate: rot, opacity: 0 }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
              className="absolute block w-2 h-2 rounded-sm"
              style={{ backgroundColor: ['#10B981', '#F59E0B', '#0EA5E9', '#111827'][b % 4] }}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
