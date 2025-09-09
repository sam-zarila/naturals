'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';

export function ShopProductSection() {
  // ✅ Use ids/prices that your checkout expects
  const product = {
    id: 'detox-60',
    name: 'Scalp Detox Oil',
    size: '60ml',
    inStock: true,
    price: 260, // ZAR
    image: '/products/hair-growth-oil-100ml.png',
    gallery: [
      '/products/hair-growth-oil-100ml.jpeg',
      '/hero/hair-growth-oil-100ml2.jpeg',
      '/products/hair-growth-oil-100ml.jpeg',
    ],
    blurb:
      'A purifying scalp treatment that removes buildup, balances oil production, and creates the optimal environment for healthy hair growth. Infused with clarifying botanicals and nourishing oils.',
    howToUse: [
      'Part hair and apply a few drops directly to the scalp.',
      'Massage for 2–3 minutes to stimulate circulation.',
      'Leave on 20–30 minutes (or overnight) before wash day.',
      'Use 2–3x per week for best results.',
    ],
    benefits: ['Clarifies', 'Balances Oil', 'Soothes Scalp', 'Boosts Growth'],
    rating: 4.9,
    reviews: 320,
  };

  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [open, setOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  // Toast state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef<number | undefined>(undefined);

  const priceDisplay = useMemo(
    () => `R${product.price.toLocaleString('en-ZA')}`,
    [product.price]
  );

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

  const writeCart = (rows: CartRow[]) => {
    localStorage.setItem(CART_KEY, JSON.stringify(rows));
  };

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
    if (i >= 0) {
      cart[i].qty = Math.max(1, Math.min(99, cart[i].qty + addQty));
    } else {
      cart.push({ id: product.id, qty: addQty });
    }
    writeCart(cart);

    // event for badges/mini-cart
    try {
      window.dispatchEvent(
        new CustomEvent('cart:add', { detail: { id: product.id, qty: addQty } })
      );
    } catch {}

    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 9200);

    // ✅ feedback toast
    showToast(`Added ${addQty} × ${product.name} to cart`);
  };

  return (
    <section className="relative bg-gradient-to-b from-white via-white to-emerald-50/20">
      {/* soft ambient glows */}
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

      <div className="max-w-6xl mx-auto px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 ga p-8 items-start">
          {/* ——— Left: Gallery Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-[22px] border border-neutral-100/80 bg-white/70 backdrop-blur-sm shadow-[0_20px_40px_rgba(0,0,0,0.06)] p-3"
          >
            <div className="relative aspect-[4/4] rounded-[18px] bg-neutral-100 overflow-hidden grid place-items-center">
              <Image
                key={active}
                src={product.gallery[active]}
                alt={product.name}
                fill
                sizes="(min-width:768px) 550px, 90vw"
                className="object-contain p-8 md:p-10 transition-transform duration-500 will-change-transform hover:scale-[1.03]"
                priority
              />
              {/* corner badges */}
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
              <span className="text-neutral-500">
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
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
            <div className="mt-4 md:w-[420px]">
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
  );
}

/* ——— UI atoms ——— */

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

function QtyStepper({
  qty,
  onChange,
}: {
  qty: number;
  onChange: (n: number) => void;
}) {
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

/* Confetti without extra libs — simple floating bits */
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
              style={{
                backgroundColor: ['#10B981', '#F59E0B', '#0EA5E9', '#111827'][b % 4],
              }}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
