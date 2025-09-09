'use client';

import {
  MotionConfig,
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  animate,
  useMotionValue,
  useSpring,
} from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';

/* =============================================================================
   Types
============================================================================= */
type Product = {
  id: string;
  name: string;
  price: number;
  currency: 'R';
  img: string;
};

type CartItem = Product & { qty: number };

type CartContextValue = {
  items: CartItem[];
  add: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

type CartAddDetail = { id: string; qty: number };

/* =============================================================================
   Cart Catalog + Context (single-file store)
============================================================================= */
const CATALOG: Record<string, Product> = {
  'growth-100': {
    id: 'growth-100',
    name: 'Hair Growth Oil · 100ml',
    price: 300,
    currency: 'R',
    img: '/products/hair-growth-oil-100ml.png',
  },
  'detox-60': {
    id: 'detox-60',
    name: 'Scalp Detox Oil · 60ml',
    price: 260,
    currency: 'R',
    img: '/products/hair-growth-oil-100ml.png',
  },
};

const CartCtx = createContext<CartContextValue | null>(null);

function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const add = (id: string, qty = 1) => {
    const base = CATALOG[id] || {
      id,
      name: 'Product',
      price: 0,
      currency: 'R' as const,
      img:'/products/hair-growth-oil-100ml.png',
    };
    setItems((prev) => {
      const copy = [...prev];
      const i = copy.findIndex((x) => x.id === id);
      if (i >= 0) copy[i] = { ...copy[i], qty: copy[i].qty + qty };
      else copy.push({ ...base, qty });
      return copy;
    });
  };

  const setQty = (id: string, qty: number) =>
    setItems((prev) =>
      prev
        .map((x) => (x.id === id ? { ...x, qty: Math.max(1, qty) } : x))
        .filter((x) => x.qty > 0),
    );

  const remove = (id: string) =>
    setItems((prev) => prev.filter((x) => x.id !== id));

  const clear = () => setItems([]);

  const count = items.reduce((s, x) => s + x.qty, 0);
  const subtotal = items.reduce((s, x) => s + x.qty * x.price, 0);

  return (
    <CartCtx.Provider
      value={{ items, add, setQty, remove, clear, count, subtotal }}
    >
      {children}
    </CartCtx.Provider>
  );
}
function useCart(): CartContextValue {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

/* =============================================================================
   Page
============================================================================= */
export default function LandingPage() {
  const { scrollYProgress } = useScroll();

  return (
    <MotionConfig
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      <CartProvider>
        <main className="relative overflow-x-clip">
          <style jsx global>{`html { scroll-behavior: smooth; }`}</style>
          <motion.div
            style={{ scaleX: scrollYProgress }}
            className="fixed top-0 left-0 right-0 h-1 origin-left bg-emerald-500/60 z-[60]"
          />
          <Header />
          <Hero />

          <OrganicIntro />
          <TransformCTA />
          <Testimonials />
          <FAQSection />
          <ContactSection />
          <SupportSection />
          <QuoteBlock />
          <NewsletterCTA />
          <Footer />
        </main>
      </CartProvider>
    </MotionConfig>
  );
}

/* Shared reveal helper */
const revealProps = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
} as const;

/* Shared product list for Shop dropdown */
const SHOP_PRODUCTS: Array<{
  id: string;
  name: string;
  detail: string;
  price: string;
  img: string;
}> = [
  {
    id: 'growth-100',
    name: 'Hair Growth Oil',
    detail: 'Mega Potent · 100ml',
    price: 'R300',
    img: '/products/hair-growth-oil-100ml.png',
  },
  {
    id: 'detox-60',
    name: 'Scalp Detox Oil',
    detail: 'Hydration · 60ml',
    price: 'R260',
    img: '/products/hair-growth-oil-100ml.png',
  },
];

/* =============================================================================
   Header (mobile-beautified)
============================================================================= */
function Header() {
  const { scrollY } = useScroll();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const cart = useCart();

  const bg = useTransform(
    scrollY,
    [0, 120],
    ['rgba(235,244,235,0)', 'rgba(255,255,255,0.9)'],
  );
  const border = useTransform(
    scrollY,
    [0, 120],
    ['rgba(0,0,0,0)', 'rgba(0,0,0,0.08)'],
  );
  const shadow = useTransform(
    scrollY,
    [0, 140],
    ['0 0 0 rgba(0,0,0,0)', '0 12px 34px rgba(0,0,0,0.08)'],
  );

  // detect mobile to force solid header
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const headerStyle = isMobile
    ? {
        backgroundColor: 'rgba(255,255,255,1)',
        borderBottomColor: 'rgba(0,0,0,0.08)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
      }
    : { backgroundColor: bg, borderBottomColor: border, boxShadow: shadow };

  // lock body when mobile menu open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  // Escape to close menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // open mini cart when items are added
  useEffect(() => {
    const onAdd = (e: Event) => {
      const evt = e as CustomEvent<CartAddDetail>;
      const { id, qty = 1 } = (evt.detail || {}) as CartAddDetail;
      if (id) cart.add(id, qty);
      setCartOpen(true);
    };
    window.addEventListener('cart:add', onAdd as EventListener);
    return () => window.removeEventListener('cart:add', onAdd as EventListener);
  }, [cart]);

  return (
    <motion.header style={headerStyle} className="sticky top-0 z-[80] border-b relative">
      {/* inner bar */}
      <div className="relative max-w-6xl mx-auto px-3 sm:px-4 h-16 grid grid-cols-[auto_1fr_auto] items-center">
        {/* left: logo/brand (bigger logo) */}
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <Image
              src="/Layer.png"
              alt="Delightful Naturals"
              width={20}
              height={20}
              className="rounded"
              priority
            />
            <span className="hidden xs:inline font-semibold text-emerald-900 truncate text-base">
              Delightful Naturals
            </span>
          </Link>
        </div>

        {/* center: (desktop nav only) */}
        <nav className="hidden md:flex items-center justify-center gap-8">
          <a href="#" className="navlink">
            Company
          </a>
          <a href="#new" className="navlink">
            Products
          </a>
          <a href="#faqs" className="navlink">
            FAQ
          </a>
          <a href="#support" className="navlink">
            Support
          </a>
          <ShopMenu />
        </nav>

        {/* right: cart + hamburger pinned to far right edge */}
        <div className="relative flex items-center justify-end gap-3 justify-self-end -mr-0 sm:-mr-6">
          <CartIcon className="w-5 h-5 text-emerald-800/80" />

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="md:hidden inline-grid place-items-center w-11 h-11 rounded-2xl bg-white border border-emerald-100 shadow-[0_6px_18px_rgba(16,185,129,0.15)] ring-1 ring-emerald-200/40"
          >
            <IconMenu className="w-6 h-6 text-emerald-800" />
          </motion.button>

          <CartDropdown open={cartOpen} onClose={() => setCartOpen(false)} />
        </div>
      </div>

      <style jsx>{`
        .navlink {
          @apply text-sm font-medium text-emerald-800/80 hover:text-emerald-900 relative;
        }
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
        .navlink:hover:after {
          width: 100%;
        }
      `}</style>

      {/* Mobile Menu */}
     {/* Mobile Menu */}
<AnimatePresence initial={false}>
  {mobileOpen && (
    <motion.div
      className="fixed inset-0 z-[90]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      // no onClick here; we put it on the overlay button to avoid any bubbling quirks
    >
      {/* clickable backdrop */}
      <button
        type="button"
        aria-label="Close menu"
        onClick={() => setMobileOpen(false)}
        className="absolute inset-0 bg-black/25"
      />

      {/* right-side drawer */}
      <motion.aside
        role="dialog"
        aria-modal="true"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="absolute right-0 top-0 z-10 h-full w-[92%] max-w-sm bg-white shadow-2xl border-l"
        onClick={(e) => e.stopPropagation()} // keep clicks inside from hitting the overlay
      >
        {/* top gradient header */}
        <div className="relative overflow-hidden">
          <div className="px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-grid place-items-center w-8 h-8 rounded-xl bg-emerald-600 text-white">
                🌿
              </span>
              <span className="font-semibold text-emerald-950">Menu</span>
            </div>
            <button
              aria-label="Close menu"
              onClick={(e) => {
                e.stopPropagation();
                setMobileOpen(false);
              }}
              className="p-2 rounded-xl border hover:bg-emerald-50"
              type="button"
            >
              <IconClose className="w-5 h-5" />
            </button>
          </div>
          <div
            aria-hidden
            className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl"
            style={{
              background:
                'radial-gradient(circle at 60% 40%, rgba(16,185,129,0.25), rgba(234,179,8,0.18))',
            }}
          />
        </div>

        {/* quick links */}
        <div className="px-4 mt-4 grid grid-cols-2 gap-3">
          <a
            href="#new"
            onClick={() => setMobileOpen(false)}
            className="group rounded-2xl border bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition"
          >
            <div className="text-2xl">🛍️</div>
            <div className="mt-1 font-medium text-emerald-950">Products</div>
            <span className="text-xs text-emerald-800/70 group-hover:text-emerald-700">
              Browse →
            </span>
          </a>
          <a
            href="#faqs"
            onClick={() => setMobileOpen(false)}
            className="group rounded-2xl border bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition"
          >
            <div className="text-2xl">❓</div>
            <div className="mt-1 font-medium text-emerald-950">FAQs</div>
            <span className="text-xs text-emerald-800/70 group-hover:text-emerald-700">
              Answers →
            </span>
          </a>
          <a
            href="#support"
            onClick={() => setMobileOpen(false)}
            className="group rounded-2xl border bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition"
          >
            <div className="text-2xl">💬</div>
            <div className="mt-1 font-medium text-emerald-950">Support</div>
            <span className="text-xs text-emerald-800/70 group-hover:text-emerald-700">
              Get help →
            </span>
          </a>
          <Link
            href="/cart"
            onClick={() => setMobileOpen(false)}
            className="group rounded-2xl border bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition"
          >
            <div className="text-2xl">🛒</div>
            <div className="mt-1 font-medium text-emerald-950">Cart</div>
            <span className="text-xs text-emerald-800/70 group-hover:text-emerald-700">
              View →
            </span>
          </Link>
        </div>

        {/* shop list */}
        <div className="px-4 mt-6">
          <div className="px-1 text-xs uppercase tracking-wide text-emerald-700/70 mb-2">
            Shop
          </div>
          <div className="divide-y rounded-2xl border">
            {SHOP_PRODUCTS.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3">
                <Image
                  src={p.img}
                  alt={p.name}
                  width={48}
                  height={48}
                  className="object-contain"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-emerald-950">
                    {p.name}
                  </div>
                  <div className="text-xs text-emerald-800/70">
                    {p.detail} · {p.price}
                  </div>
                </div>
                <AddButton productId={p.id} />
              </div>
            ))}
          </div>
        </div>

        {/* footer ctas */}
        <div className="px-4 pt-4 pb-5 mt-6">
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/shop"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center rounded-xl px-4 py-3 bg-emerald-600 text-white shadow"
            >
              Visit Shop
            </Link>
            <a
              href="https://wa.me/27672943837"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl px-4 py-3 border"
              onClick={() => setMobileOpen(false)}
            >
              WhatsApp
            </a>
          </div>
        </div>
      </motion.aside>
    </motion.div>
  )}
</AnimatePresence>

    </motion.header>
  );
}

/* Icons */
function IconMenu({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3 6h18M3 12h18M3 18h18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconClose({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6 6l12 12M6 18L18 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* Cart icon (with count + ping) */
function CartIcon({ className }: { className?: string }) {
  const [count, setCount] = useState(0);
  const sync = () => {
    try {
      const cartRaw = localStorage.getItem('dn-cart');
      const cartParsed = cartRaw ? (JSON.parse(cartRaw) as Array<{ id: string; qty: number }>) : [];
      setCount(cartParsed.reduce((s, x) => s + (x.qty || 0), 0));
    } catch {
      setCount(0);
    }
  };
  useEffect(() => {
    sync();
    const onAdd = () => sync();
    window.addEventListener('cart:add', onAdd as EventListener);
    window.addEventListener('storage', onAdd);
    return () => {
      window.removeEventListener('cart:add', onAdd as EventListener);
      window.removeEventListener('storage', onAdd);
    };
  }, []);

  return (
    <Link href="/cart" className="relative inline-grid place-items-center">
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        <path
          d="M3 5h2l2 12h10l2-8H7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="10" cy="20" r="1.5" fill="currentColor" />
        <circle cx="17" cy="20" r="1.5" fill="currentColor" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 rounded-full bg-emerald-600 text-white text-[10px] grid place-items-center shadow">
          {count}
        </span>
      )}
    </Link>
  );
}

/* Cart dropdown panel */
function CartDropdown({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const cart = useCart();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.18 }}
          className="absolute top-full right-0 mt-3 w-[340px] sm:w-[380px] z-[90]"
        >
          <div className="rounded-2xl border bg-white shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b font-semibold text-emerald-950">
              Your Cart
            </div>

            {cart.items.length === 0 ? (
              <div className="px-4 py-8 text-sm text-emerald-900/70">
                Your cart is empty.
              </div>
            ) : (
              <div className="max-h-[320px] overflow-auto divide-y">
                {cart.items.map((it) => (
                  <div key={it.id} className="flex items-center gap-3 p-3">
                    <Image
                      src={it.img}
                      alt={it.name}
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-emerald-950">
                        {it.name}
                      </div>
                      <div className="text-xs text-emerald-800/70">
                        {it.currency}
                        {it.price.toLocaleString()} × {it.qty}
                      </div>
                    </div>
                    <div className="inline-flex items-center rounded-lg border overflow-hidden">
                      <button
                        className="w-7 h-7 grid place-items-center hover:bg-emerald-50"
                        onClick={() => cart.setQty(it.id, it.qty - 1)}
                        aria-label="Decrease"
                      >
                        −
                      </button>
                      <div className="w-7 h-7 grid place-items-center text-sm">
                        {it.qty}
                      </div>
                      <button
                        className="w-7 h-7 grid place-items-center hover:bg-emerald-50"
                        onClick={() => cart.setQty(it.id, it.qty + 1)}
                        aria-label="Increase"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="px-4 py-3 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-emerald-900/80">Subtotal</span>
                <span className="font-semibold text-emerald-950">
                  R{cart.subtotal.toLocaleString()}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <Link
                  href="/checkout"
                  className="flex-1 inline-flex items-center justify-center rounded-xl px-4 py-2 bg-emerald-600 text-white"
                >
                  Checkout
                </Link>
                <button
                  onClick={() => {
                    cart.clear();
                    onClose?.();
                  }}
                  className="px-4 py-2 rounded-xl border"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
          {/* click-away catcher */}
          <button onClick={onClose} className="fixed inset-0 z-[-1]" aria-hidden />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* =============================================================================
   Shop dropdown (desktop) with + buttons
============================================================================= */
function ShopMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && e.target instanceof Node && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        className="navlink flex items-center gap-1"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Shop
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.3 7.3a1 1 0 011.4 0L10 10.59l3.3-3.3a1 1 0 111.4 1.42l-4 4a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.42z" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            className="absolute left-1/2 -translate-x-1/2 top-[140%] z-[60] w-[360px] md:w-[420px]"
            role="menu"
          >
            <div className="rounded-2xl border border-emerald-100 bg-white shadow-2xl p-3">
              {SHOP_PRODUCTS.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-emerald-50/70"
                >
                  <Image
                    src={p.img}
                    alt={p.name}
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-emerald-950">
                      {p.name}
                    </div>
                    <div className="text-xs text-emerald-800/70">
                      {p.detail} · {p.price}
                    </div>
                  </div>
                  <AddButton productId={p.id} />
                </div>
              ))}
              <div className="mt-2 px-2">
                <Link
                  href="/shop"
                  className="inline-flex text-sm text-emerald-700 hover:underline"
                >
                  View all →
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Add button used in Shop menus (desktop + mobile) */
function AddButton({ productId }: { productId: string }) {
  const [ping, setPing] = useState(false);

  const addToCart = () => {
    const key = 'dn-cart';
    let cart: Array<{ id: string; qty: number }> = [];
    try {
      cart = JSON.parse(localStorage.getItem(key) || '[]') as Array<{
        id: string;
        qty: number;
      }>;
    } catch {
      /* ignore */
    }
    const i = cart.findIndex((x) => x.id === productId);
    if (i > -1) cart[i].qty += 1;
    else cart.push({ id: productId, qty: 1 });
    localStorage.setItem(key, JSON.stringify(cart));

    try {
      window.dispatchEvent(
        new CustomEvent<CartAddDetail>('cart:add', {
          detail: { id: productId, qty: 1 },
        }),
      );
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      onClick={() => {
        setPing(true);
        window.setTimeout(() => setPing(false), 600);
        addToCart();
      }}
      className="relative grid place-items-center w-8 h-8 rounded-full border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white transition"
      aria-label={`Add ${productId} to cart`}
      title="Add to cart"
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
        <path
          d="M12 5v14M5 12h14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {ping && (
        <span className="absolute inline-flex h-full w-full rounded-full border-2 border-emerald-400 animate-ping" />
      )}
    </button>
  );
}

/* =============================================================================
   HERO
============================================================================= */
function Hero() {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const yBottle = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const xWaveL = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const xWaveR = useTransform(scrollYProgress, [0, 1], [0, 30]);
  const haloPulse = useSpring(useMotionValue(0.7), {
    stiffness: 40,
    damping: 12,
  });

  useEffect(() => {
    const controls = animate(haloPulse, 1, {
      duration: 2.6,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    });
    return () => controls.stop();
  }, [haloPulse]);

  return (
    <section
      ref={heroRef}
      className="relative bg-gradient-to-b from-emerald-50 via-emerald-50/50 to-white"
    >
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute -top-10 -left-10 h-72 w-72 rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle at 30% 30%, rgba(16,185,129,0.28), transparent 60%)',
          }}
        />
        <div
          className="absolute -bottom-10 right-0 h-80 w-80 rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle at 60% 60%, rgba(16,185,129,0.18), transparent 60%)',
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 md:py-16 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <p className="text-xs tracking-wide uppercase text-neutral-500">
            Premium Natural Hair Care
          </p>
          <motion.h1
            {...revealProps}
            className="mt-2 text-4xl md:text-5xl font-extrabold text-neutral-900 leading-tight"
          >
            Transform Your Hair with Nature&apos;s Power
          </motion.h1>
          <motion.p
            {...revealProps}
            transition={{ delay: 0.06 }}
            className="mt-4 text-neutral-700 max-w-md"
          >
            Discover our carefully crafted natural hair oils that nourish,
            strengthen, and promote healthy hair growth using only the finest
            botanical ingredients.
          </motion.p>
          <motion.div
            {...revealProps}
            transition={{ delay: 0.12 }}
            className="mt-6 flex flex-wrap items-center gap-3"
          >
            <Magnetic>
              <Link
                href="/shop"
                className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 bg-neutral-900 text-white shadow hover:bg-neutral-800"
              >
                Shop Now
              </Link>
            </Magnetic>
            <Link
              href="/about"
              className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 border border-neutral-300 text-neutral-900 hover:bg-neutral-50"
            >
              Learn Our Story
            </Link>
          </motion.div>
        </div>

        <div className="relative h-[380px] md:h-[520px]">
          {/* Waves */}
          <motion.div style={{ x: xWaveL }} className="absolute left-[-40px] top-[80px] w-[260px] md:w-[360px] opacity-90">
            <Image
              src="/hero/hair-growth-oil-100ml.jpeg"
              alt="wave"
              width={360}
              height={240}
              className="w-full h-auto rounded-lg"
            />
          </motion.div>
          <motion.div style={{ x: xWaveR }} className="absolute right-[-30px] top-[120px] w-[260px] md:w-[360px] opacity-90">
            <Image
              src="/hero/hair-growth-oil-100ml1.jpeg"
              alt="wave"
              width={360}
              height={240}
              className="w-full h-auto rounded-lg"
              
            />
          </motion.div>

          {/* Bottle */}
          {/* <motion.div style={{ y: yBottle }} className="absolute inset-0 grid place-items-center">
            <Image
              src="/hero/hair-growth-oil-100ml2.jpg"
              alt="Bottle"
              width={560}
              height={680}
              className="w-[220px] md:w-[320px] h-auto drop-shadow-[0_24px_50px_rgba(0,0,0,0.25)]"
              priority
            />
          </motion.div> */}

          {/* Halo */}
          <motion.div aria-hidden style={{ opacity: haloPulse }} className="absolute inset-0">
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[220px] rounded-full blur-3xl"
              style={{
                background:
                  'radial-gradient(closest-side, rgba(255,255,255,0.9), transparent)',
              }}
            />
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid sm:grid-cols-2 gap-4 rounded-lg">
          <ProductMiniCard
            name="Hair Growth Oil"
            price="R300"
            image="/products/hair-growth-oil-100ml.jpeg"
            
          />
          <ProductMiniCard
            name="Scalp Detox Oil"
            price="R260"
            image="/products/hair-growth-oil-100ml1.jpeg"
          />
        </div>
      </div>
    </section>
  );
}

/* Magnetic hover for CTAs */
function Magnetic({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const dx = useSpring(x, { stiffness: 120, damping: 12 });
  const dy = useSpring(y, { stiffness: 120, damping: 12 });
  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        const mx = e.clientX - (r.left + r.width / 2);
        const my = e.clientY - (r.top + r.height / 2);
        x.set(mx * 0.15);
        y.set(my * 0.15);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ x: dx, y: dy }}
      className="will-change-transform"
    >
      {children}
    </motion.div>
  );
}
function ProductMiniCard({
  name,
  price,
  image,
}: {
  name: string;
  price: string;
  image: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 14px 30px rgba(0,0,0,0.08)' }}
      className="bg-white/90 backdrop-blur rounded-2xl p-4 border shadow-sm flex items-center gap-4"
    >
      <Image
        src={image}
        alt={name}
        width={56}
        height={56}
        className="object-contain w-14 h-14 rounded-xl"
      />
      <div className="flex-1">
        <div className="font-medium text-emerald-950">{name}</div>
        <div className="text-sm text-emerald-800/70">{price}</div>
      </div>
      <Link
        href="/shop"
        className="inline-flex rounded-lg px-3 py-1.5 bg-emerald-600 text-white text-sm shadow"
      >
        Buy
      </Link>
    </motion.div>
  );
}

/* CTA block */
function TransformCTA() {
  return (
    <section className="bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-[28px] bg-neutral-100"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(120% 80% at 12% 76%, rgba(255,255,255,0.55), transparent 60%)',
            }}
          />
          <div className="relative grid grid-cols-1 md:grid-cols-2">
            <div className="p-6 sm:p-8 lg:p-10">
              <h3 className="text-2xl md:text-[28px] font-semibold text-neutral-900">
                Ready to Transform Your Hair?
              </h3>
              <p className="mt-2 text-neutral-600 max-w-md">
                Join thousands of satisfied customers who have discovered the
                power of natural hair care. Start your journey today.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center rounded-md px-4 py-2.5 bg-neutral-900 text-white hover:bg-neutral-800 transition"
                >
                  Shop Products
                </Link>
                <Link
                  href="#contact"
                  className="inline-flex items-center justify-center rounded-md px-4 py-2.5 border border-neutral-300 text-neutral-900 hover:bg-white transition"
                >
                  Get in touch
                </Link>
              </div>
            </div>
            <div className="relative h-[220px] sm:h-[260px] md:h-[300px]">
              <Image
                src="/hero/hair-growth-oil-100ml3.jpeg"
                alt="Hair oil bottle"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-contain object-right translate-y-3 sm:translate-y-6 [transform:rotate(6deg)] md:[transform:rotate(4deg)] drop-shadow-[0_18px_30px_rgba(0,0,0,0.18)]"
                priority
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* Organic intro */
function OrganicIntro() {
  return (
    <section className="relative">
      <div className="absolute inset-0 -z-10 pointer-events-none bg-[radial-gradient(600px_400px_at_50%_20%,rgba(16,185,129,0.08),transparent_60%)]" />
      <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-8 items-center">
        <div className="relative">
        
          <motion.h2
            {...revealProps}
            className="text-2xl md:text-3xl font-bold text-emerald-950"
          >
            We Source Organically Grown Ingredients From Family Owned Farms
          </motion.h2>
          <motion.p
            {...revealProps}
            transition={{ delay: 0.06 }}
            className="mt-3 text-emerald-900/80"
          >
            We keep our blends simple: high-performing botanicals with clean INCI
            names. Small batches ensure freshness, and every bottle is filled
            with care.
          </motion.p>
          <motion.div {...revealProps} transition={{ delay: 0.12 }}>
            <Link
              href="/about"
              className="mt-4 inline-flex rounded-xl px-4 py-2 bg-emerald-600 text-white shadow"
            >
              About us
            </Link>
          </motion.div>
        </div>
        <div className="relative min-h-[220px]">
          <motion.div {...revealProps} className="absolute right-0 top-0 w-64">
            <Image
              src="/products/hair-growth-oil-100ml12.jpeg"
              alt="olives"
              width={256}
              height={256}
              className="w-64 h-auto rounded-lg"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* Testimonials */
function Testimonials() {
  const items: Array<{
    name: string;
    role: string;
    text: string;
    rating: number;
    avatar: string;
  }> = [
    {
      name: 'Nabiso M.',
      role: 'Verified Purchase',
      text: 'My scalp finally feels calm and fresh. The detox oil is a lifesaver between wash days!',
      rating: 5,
      avatar: '/avatars/1.jpg',
    },
    {
      name: 'Prudence K.',
      role: 'Verified Purchase',
      text: 'I saw less breakage in 3 weeks. The hair growth oil leaves my ends so soft.',
      rating: 5,
      avatar: '/avatars/2.jpg',
    },
    {
      name: 'Tariro L.',
      role: 'Verified Purchase',
      text: 'Lightweight but effective. Love the scent and the shine it gives.',
      rating: 5,
      avatar: '/avatars/3.jpg',
    },
    {
      name: 'Ayanda S.',
      role: 'Repeat Customer',
      text: 'The only oils that don’t weigh my hair down. Instant scalp relief.',
      rating: 5,
      avatar: '/avatars/4.jpg',
    },
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(
      () => setI((v) => (v + 1) % items.length),
      4500,
    );
    return () => window.clearInterval(id);
  }, [items.length]);

  return (
    <section className="relative">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(800px_500px_at_50%_-10%,rgba(16,185,129,0.12),transparent_60%)]" />
      <div className="max-w-5xl mx-auto px-4 py-12 md:py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-950">
          What our customers are saying
        </h2>
        <div className="mt-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.98 }}
              transition={{ duration: 0.35 }}
              className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-white p-8 shadow-[0_20px_40px_rgba(16,185,129,0.12)]"
            >
              <div
                className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full blur-3xl"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(234,179,8,0.14))',
                }}
              />
              <div className="flex justify-center gap-1 text-amber-500 mb-3">
                {Array.from({ length: items[i].rating }).map((_, s) => (
                  <span key={s}>★</span>
                ))}
              </div>
              <p className="text-lg text-emerald-950">“{items[i].text}”</p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <Image
                  src={items[i].avatar}
                  alt="avatar"
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full border object-cover"
                />
                <div className="text-left">
                  <div className="text-sm font-medium text-emerald-900">
                    {items[i].name}
                  </div>
                  <div className="text-xs text-emerald-800/70">
                    {items[i].role}
                  </div>
                </div>
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Verified
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="mt-4 flex justify-center gap-2">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                className={`h-2.5 rounded-full transition ${
                  i === idx ? 'w-6 bg-emerald-600' : 'w-2.5 bg-emerald-200'
                }`}
                aria-label={`Go to review ${idx + 1}`}
              />
            ))}
          </div>
        </div>
        <div className="mt-10 hidden md:grid grid-cols-3 gap-4">
          {items.map((r, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
              className="rounded-2xl border border-emerald-200 bg-white p-4 text-left"
            >
              <div className="flex items-center gap-2">
                <Image
                  src={r.avatar}
                  alt="avatar"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full border object-cover"
                />
                <div className="text-sm font-medium text-emerald-900">
                  {r.name}
                </div>
              </div>
              <p className="mt-2 text-sm text-emerald-900/90">{r.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* FAQ */
function FAQSection() {
  const faqs: Array<{ q: string; a: string }> = [
    {
      q: 'How often should I use the Hair Growth Oil?',
      a: '3–4 times per week is a great start. Focus on dry or fragile areas and adjust based on how your hair feels.',
    },
    {
      q: 'Is the Scalp Detox Oil suitable for sensitive scalps?',
      a: 'Yes. Start with a few drops and massage gently. Always patch test and discontinue use if irritation occurs.',
    },
    {
      q: 'Can I use both oils together?',
      a: 'Absolutely. Use Scalp Detox Oil to refresh the scalp between wash days, and Hair Growth Oil to seal in moisture on lengths.',
    },
    {
      q: 'Do you ship?',
      a: 'Yes. Shipping and payment are finalised during checkout/WhatsApp confirmation. We’ll share options for your area.',
    },
    {
      q: 'What are the ingredients?',
      a: 'Key botanicals include Grapeseed, Avocado, Jojoba, Rosemary and Nettle, with Tocopherol and Caprylic/Capric Triglyceride.',
    },
    {
      q: 'Storage & shelf life',
      a: 'Store in a cool, dry place away from direct sunlight. Best used within 12 months of opening.',
    },
  ];
  return (
    <section id="faqs" className="relative">
      <div className="max-w-4xl mx-auto px-4 py-14 md:py-16">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-emerald-950">
            Frequently asked questions
          </h2>
          <p className="mt-2 text-emerald-900/80">Quick answers to common questions.</p>
        </div>
        <div className="relative">
          <div
            className="absolute -inset-1 rounded-[26px] bg-gradient-to-br from-emerald-200/40 to-amber-200/40 blur-xl -z-10"
            aria-hidden
          />
          <div className="rounded-[22px] border border-emerald-200 bg-white shadow-sm divide-y">
            {faqs.map((item, idx) => (
              <FAQItem key={idx} q={item.q} a={item.a} defaultOpen={idx === 0} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
function FAQItem({
  q,
  a,
  defaultOpen = false,
}: {
  q: string;
  a: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="p-4 md:p-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 text-left"
        aria-expanded={open}
      >
        <span className="font-medium text-emerald-950">{q}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="inline-grid place-items-center rounded-full border w-6 h-6 text-sm"
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pt-3 text-sm text-emerald-900/90">{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Contact */
function ContactSection() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    honey: '', // honeypot
  });

  const onChange =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
    };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // simple client-side guard
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in your name, email, and message.');
      return;
    }
    if (form.honey) return; // bot trap

    setSubmitting(true);

    // Simulate sending (swap with your real API call)
    setTimeout(() => {
      setSubmitting(false);
      setSent(true);
    }, 1200);
  };

  return (
    <section id="contact" className="relative">
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-amber-50 p-8 md:p-12">
          <motion.div
            aria-hidden
            className="absolute -top-12 -right-12 h-72 w-72 rounded-full blur-3xl pointer-events-none -z-10"
            style={{
              background:
                'linear-gradient(135deg, rgba(16,185,129,0.22), rgba(234,179,8,0.22))',
            }}
            animate={{ x: [0, 10, -6, 0], y: [0, 6, -10, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.h3
            {...revealProps}
            className="text-2xl md:text-3xl font-bold text-emerald-950"
          >
            Contact us
          </motion.h3>
          <motion.p
            {...revealProps}
            transition={{ delay: 0.05 }}
            className="mt-2 text-emerald-900/80 max-w-xl"
          >
            We’re happy to help with product questions and personalised routines.
          </motion.p>

          <motion.div
            {...revealProps}
            transition={{ delay: 0.1 }}
            className="mt-6 grid sm:grid-cols-2 gap-6"
          >
            {/* Phone & WhatsApp card (unchanged) */}
            <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
              <div className="font-medium text-emerald-950">Phone & WhatsApp</div>
              <a className="mt-1 block underline" href="tel:+27672943837">
                +27 67 294 3837
              </a>
              <a
                className="mt-2 inline-flex w-fit rounded-xl px-4 py-2 bg-emerald-600 text-white shadow hover:scale-[1.02] transition"
                href="https://wa.me/27672943837"
                target="_blank"
                rel="noreferrer"
              >
                Chat on WhatsApp
              </a>

              <div className="mt-5 text-sm text-emerald-900/80">
                Prefer email? Use the form and we’ll get back to you shortly.
              </div>
            </div>

            {/* Contact Form card (replaces Email card) */}
            <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
              {/* Success banner */}
              <AnimatePresence>
                {sent && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 px-3 py-2 text-sm"
                    role="status"
                    aria-live="polite"
                  >
                    ✅ Message sent! We’ll reply to <span className="font-medium">{form.email}</span>.
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error note */}
              {error && (
                <div className="mb-3 rounded-xl border border-red-200 bg-red-50 text-red-900 px-3 py-2 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-3">
                {/* Honeypot */}
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.honey}
                  onChange={onChange('honey')}
                  className="hidden"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-emerald-900/80 mb-1">
                      Full name *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={onChange('name')}
                      required
                      placeholder="e.g. Lesley M."
                      className="rounded-xl border border-neutral-200 bg-white/80 px-4 py-3 text-[15px] shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-emerald-900/80 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={onChange('email')}
                      required
                      placeholder="you@example.com"
                      className="rounded-xl border border-neutral-200 bg-white/80 px-4 py-3 text-[15px] shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-emerald-900/80 mb-1">
                      Phone (optional)
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={onChange('phone')}
                      placeholder="+27 ..."
                      className="rounded-xl border border-neutral-200 bg-white/80 px-4 py-3 text-[15px] shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-emerald-900/80 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={onChange('subject')}
                      placeholder="Question about products"
                      className="rounded-xl border border-neutral-200 bg-white/80 px-4 py-3 text-[15px] shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-medium text-emerald-900/80 mb-1">
                    Message *
                  </label>
                  <textarea
                    value={form.message}
                    onChange={onChange('message')}
                    required
                    placeholder="Tell us how we can help…"
                    rows={5}
                    className="rounded-xl border border-neutral-200 bg-white/80 px-4 py-3 text-[15px] shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                  <p className="text-xs text-emerald-900/70">
                    We’ll use your details only to respond to this message.
                  </p>

                  <motion.button
                    whileHover={{ scale: sent ? 1 : 1.02 }}
                    whileTap={{ scale: sent ? 1 : 0.98 }}
                    type="submit"
                    disabled={submitting || sent}
                    className={`relative inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm shadow text-white ${
                      sent
                        ? 'bg-emerald-700'
                        : 'bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500'
                    } disabled:opacity-70`}
                  >
                    {submitting ? 'Sending…' : sent ? 'Sent' : 'Send message'}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}


/* Support */
function SupportSection() {
  const cards: Array<{ t: string; d: string; icon: string; link: string }> = [
    {
      t: 'Shipping & Delivery',
      d: 'Typical delivery in 2–4 business days. We’ll share courier options for your area at checkout.',
      icon: '🚚',
      link: '#faqs',
    },
    {
      t: 'Returns & Exchanges',
      d: 'Unopened items within 14 days. If something’s wrong, we’ll make it right — just reach out.',
      icon: '↩️',
      link: 'mailto:hello@delightfulnaturals.co.za',
    },
    {
      t: 'Order Help',
      d: 'Need to change your address or track a parcel? Message us on WhatsApp and we’ll assist.',
      icon: '💬',
      link: 'https://wa.me/27672943837',
    },
  ];
  return (
    <section id="support" className="relative">
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-emerald-950">
            Support
          </h2>
          <p className="mt-2 text-emerald-900/80">Quick links to common topics.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {cards.map((c, i) => (
            <motion.a
              key={c.t}
              href={c.link}
              target={c.link.startsWith('http') ? '_blank' : undefined}
              rel={c.link.startsWith('http') ? 'noreferrer' : undefined}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className="block bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition"
            >
              <div className="text-2xl">{c.icon}</div>
              <div className="mt-2 font-semibold text-emerald-950">{c.t}</div>
              <p className="text-sm mt-1 text-emerald-900/80">{c.d}</p>
              <span className="mt-3 inline-flex text-emerald-700 text-sm">
                Learn more →
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Quote */
function QuoteBlock() {
  return (
    <section className="relative">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border bg-white p-8 shadow-sm text-center"
        >
          <p className="text-lg text-emerald-950">
            “We source organically grown botanicals and bottle in small batches
            to keep every drop potent and fresh.”
          </p>
          <div className="mt-3 text-sm text-emerald-900/80">— May</div>
        </motion.div>
      </div>
    </section>
  );
}

/* Newsletter CTA */
function NewsletterCTA() {
  const [submitting, setSubmitting] = useState(false);
  return (
    <section className="relative">
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-emerald-50 to-amber-50 p-8 md:p-12">
          <motion.div
            aria-hidden
            className="absolute -top-10 -right-10 h-60 w-60 rounded-full blur-3xl pointer-events-none -z-10"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, rgba(16,185,129,0.22), rgba(234,179,8,0.18))',
            }}
            animate={{ x: [0, 10, -6, 0], y: [0, 6, -10, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.h3
            {...revealProps}
            className="text-2xl md:text-3xl font-bold text-emerald-950"
          >
            Subscribe to our Newsletter
          </motion.h3>
          <motion.p
            {...revealProps}
            transition={{ delay: 0.06 }}
            className="mt-2 text-emerald-900/80 max-w-xl"
          >
            Tips for healthy hair care, exclusive promos, and new product drops.
            No spam.
          </motion.p>
          <motion.form
            {...revealProps}
            transition={{ delay: 0.12 }}
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitting(true);
              window.setTimeout(() => setSubmitting(false), 1500);
            }}
            className="mt-6 flex flex-col sm:flex-row gap-3"
          >
            <input
              type="email"
              required
              placeholder="Enter your email"
              className="flex-1 rounded-xl border px-4 py-3 bg-white/80 backdrop-blur shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative inline-flex overflow-hidden rounded-xl px-6 py-3 bg-emerald-600 text-white shadow"
            >
              <span className="relative z-10">
                {submitting ? 'Thanks!' : 'Subscribe'}
              </span>
              <motion.span
                aria-hidden
                initial={{ x: '-120%' }}
                animate={{ x: '120%' }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
                className="absolute inset-y-0 left-0 w-1/3 skew-x-[-20deg] bg-white/30"
              />
            </motion.button>
          </motion.form>
        </div>
      </div>
    </section>
  );
}

/* Footer */
function Footer() {
  return (
    <footer className="bg-emerald-900 text-emerald-50 mt-10">
      <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-4 gap-6 text-sm">
        <div>
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              width={32}
              height={32}
              className="rounded"
              alt="logo"
            />
            <span className="font-semibold">Delightful Naturals</span>
          </div>
          <p className="mt-3 text-emerald-100/80">
            Mega Potent Hair Growth Oil & Scalp Detox Oil.
          </p>
          <div className="mt-3 flex gap-3 text-xl">
            <span>🌿</span>
            <span>💧</span>
            <span>✨</span>
          </div>
        </div>
        <div>
          <div className="font-semibold">Quick Links</div>
          <ul className="mt-2 space-y-1">
            <li>
              <a href="#" className="hover:underline">
                Company
              </a>
            </li>
            <li>
              <a href="#new" className="hover:underline">
                Products
              </a>
            </li>
            <li>
              <a href="#best" className="hover:underline">
                Best Sellers
              </a>
            </li>
            <li>
              <a href="#faqs" className="hover:underline">
                FAQ
              </a>
            </li>
            <li>
              <a href="#support" className="hover:underline">
                Support
              </a>
            </li>
            <li>
              <Link href="/shop" className="hover:underline">
                Shop
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="font-semibold">Help</div>
          <ul className="mt-2 space-y-1">
            <li>
              <a href="#faqs" className="hover:underline">
                FAQ
              </a>
            </li>
            <li>
              <a href="#contact" className="hover:underline">
                Contact
              </a>
            </li>
          </ul>
        </div>
        <div>
          <div className="font-semibold">Contact</div>
          <p className="mt-2">
            Phone:{' '}
            <a className="underline" href="tel:+27672943837">
              +27 67 294 3837
            </a>
            <br />
            Email:{' '}
            <a
              className="underline"
              href="mailto:hello@delightfulnaturals.co.za"
            >
              hello@delightfulnaturals.co.za
            </a>
          </p>
        </div>
      </div>
      <div className="border-t border-emerald-800 py-4 text-center text-xs text-emerald-100/80">
        © {new Date().getFullYear()} Delightful Naturals. All rights reserved.
      </div>
    </footer>
  );
}
