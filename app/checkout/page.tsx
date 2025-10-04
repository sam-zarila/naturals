'use client';

import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import React, { JSX, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/* ============================================================================
   Cart + Navbar (same as Landing Page)
============================================================================ */
type ProductId = 'growth-100' | 'detox-60';

type CartItem = {
  id: string;
  name: string;
  price: number;
  currency: 'R';
  img: string;
  qty: number;
};
type CartContextValue = {
  items: CartItem[];
  add: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartCtx = React.createContext<CartContextValue | null>(null);
function useCart() {
  const ctx = React.useContext(CartCtx);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

const CATALOG_META: Record<ProductId, { id: ProductId; name: string; price: number; currency: 'R'; img: string }> = {
  'growth-100': { id: 'growth-100', name: 'Mega Potent Hair Growth Oil', price: 300, currency: 'R', img: '/products/hair-growth-oil-100ml.png' },
  'detox-60':   { id: 'detox-60',   name: 'Scalp Detox Oil',           price: 260, currency: 'R', img: '/products/scalp-detox-oil-60ml.png' },
};

function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const add = (id: string, qty = 1) => {
    const base = CATALOG_META[id as ProductId] || {
      id,
      name: 'Product',
      price: 0,
      currency: 'R' as const,
      img: '/products/hair-growth-oil-100ml.png',
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
  const remove = (id: string) => setItems((prev) => prev.filter((x) => x.id !== id));
  const clear = () => setItems([]);

  const count = items.reduce((s, x) => s + x.qty, 0);
  const subtotal = items.reduce((s, x) => s + x.qty * x.price, 0);

  return (
    <CartCtx.Provider value={{ items, add, setQty, remove, clear, count, subtotal }}>
      {children}
    </CartCtx.Provider>
  );
}

function IconMenu({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconClose({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
/* small inline icons (no react-icons) */
function IconLeaf({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M19 5s-8-2-12 2-2 10 3 10 9-6 9-12Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 14c2-2 5-4 11-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
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

function CartIcon({ className }: { className?: string }) {
  const [count, setCount] = useState(0);
  const sync = () => {
    try {
      const cartRaw = localStorage.getItem('dn-cart');
      const cartParsed = cartRaw ? (JSON.parse(cartRaw) as Array<{ id: string; qty: number }>) : [];
      setCount(cartParsed.reduce((s, x) => s + (x.qty || 0), 0));
    } catch { setCount(0); }
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
        <path d="M3 5h2l2 12h10l2-8H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

function CartDropdown({ open, onClose }: { open: boolean; onClose: () => void }) {
  const cart = useCart();
  if (typeof window === 'undefined' || !open) return null;
  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.18 }}
        className="fixed top-16 right-3 w-[340px] sm:w-[380px] z-[140]" role="dialog" aria-modal="true"
      >
        <div className="rounded-2xl border bg-white shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b font-semibold text-emerald-950">Your Cart</div>
          {cart.items.length === 0 ? (
            <div className="px-4 py-8 text-sm text-emerald-900/70">Your cart is empty.</div>
          ) : (
            <div className="max-h-[320px] overflow-auto divide-y">
              {cart.items.map((it) => (
                <div key={it.id} className="flex items-center gap-3 p-3">
                  <Image src={it.img} alt={it.name} width={48} height={48} className="object-contain" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-emerald-950">{it.name}</div>
                    <div className="text-xs text-emerald-800/70">R{it.price.toLocaleString()} × {it.qty}</div>
                  </div>
                  <div className="inline-flex items-center rounded-lg border overflow-hidden">
                    <button className="w-7 h-7 grid place-items-center hover:bg-emerald-50" onClick={() => cart.setQty(it.id, it.qty - 1)} aria-label="Decrease">−</button>
                    <div className="w-7 h-7 grid place-items-center text-sm">{it.qty}</div>
                    <button className="w-7 h-7 grid place-items-center hover:bg-emerald-50" onClick={() => cart.setQty(it.id, it.qty + 1)} aria-label="Increase">+</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="px-4 py-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-900/80">Subtotal</span>
              <span className="font-semibold text-emerald-950">R{cart.subtotal.toLocaleString()}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <Link href="/checkout" className="flex-1 inline-flex items-center justify-center rounded-xl px-4 py-2 bg-emerald-600 text-white">Checkout</Link>
              <button onClick={() => { cart.clear(); onClose?.(); }} className="px-4 py-2 rounded-xl border">Clear</button>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="fixed inset-0 z-[139]" aria-hidden type="button" />
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

const SHOP_PRODUCTS = [
  { id: 'growth-100', name: 'Hair Growth Oil', detail: 'Mega Potent · 100ml', price: 'R300', img: '/products/hair-growth-oil-100ml.png' },
  { id: 'detox-60',   name: 'Scalp Detox Oil', detail: 'Hydration · 60ml',   price: 'R260', img: '/products/scalp-detox-oil-60ml.png' },
];

function ShopMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && e.target instanceof Node && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onKey); };
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
            className="absolute left-1/2 -translate-x-1/2 top[140%] md:top-[140%] z-[60] w-[360px] md:w-[420px]"
            role="menu"
          >
            <div className="rounded-2xl border border-emerald-100 bg-white shadow-2xl p-3">
              {SHOP_PRODUCTS.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-emerald-50/70">
                  <Image src={p.img} alt={p.name} width={48} height={48} className="object-contain" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-emerald-950">{p.name}</div>
                    <div className="text-xs text-emerald-800/70">{p.detail} · {p.price}</div>
                  </div>
                  <AddButton productId={p.id as ProductId} />
                </div>
              ))}
              <div className="mt-2 px-2">
                <Link href="/shop" className="inline-flex text-sm text-emerald-700 hover:underline">View all →</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddButton({ productId }: { productId: ProductId }) {
  const [ping, setPing] = useState(false);
  const addToCart = () => {
    const key = 'dn-cart';
    let cart: Array<{ id: string; qty: number }> = [];
    try { cart = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
    const i = cart.findIndex((x) => x.id === productId);
    if (i > -1) cart[i].qty += 1; else cart.push({ id: productId, qty: 1 });
    localStorage.setItem(key, JSON.stringify(cart));
    try { window.dispatchEvent(new CustomEvent<{ id: string; qty: number }>('cart:add', { detail: { id: productId, qty: 1 } })); } catch {}
  };
  return (
    <button
      onClick={() => { setPing(true); window.setTimeout(() => setPing(false), 600); addToCart(); }}
      className="relative grid place-items-center w-8 h-8 rounded-full border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white transition"
      aria-label={`Add ${productId} to cart`} title="Add to cart"
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      {ping && <span className="absolute inline-flex h-full w-full rounded-full border-2 border-emerald-400 animate-ping" />}
    </button>
  );
}

function Header() {
  const { scrollY } = useScroll();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuPing, setMenuPing] = useState(false);
  const pingTimer = useRef<number | null>(null);
  const cart = useCart();

  const bg = useTransform(scrollY, [0, 120], ['rgba(235,244,235,0)', 'rgba(255,255,255,0.9)']);
  const border = useTransform(scrollY, [0, 120], ['rgba(0,0,0,0)', 'rgba(0,0,0,0.08)']);
  const shadow = useTransform(scrollY, [0, 140], ['0 0 0 rgba(0,0,0,0)', '0 12px 34px rgba(0,0,0,0.08)']);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const headerStyle = isMobile
    ? { backgroundColor: 'rgba(255,255,255,1)', borderBottomColor: 'rgba(0,0,0,0.08)', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }
    : { backgroundColor: bg, borderBottomColor: border, boxShadow: shadow };

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onAdd = (e: Event) => {
      const evt = e as CustomEvent<{ id: string; qty: number }>;
      const detail = evt.detail;
      if (detail?.id) cart.add(detail.id, detail.qty || 1);
      setCartOpen(true);
      setMenuPing(true);
      if (pingTimer.current) window.clearTimeout(pingTimer.current);
      pingTimer.current = window.setTimeout(() => setMenuPing(false), 1200);
    };
    window.addEventListener('cart:add', onAdd as EventListener);
    return () => {
      window.removeEventListener('cart:add', onAdd as EventListener);
      if (pingTimer.current) window.clearTimeout(pingTimer.current);
    };
  }, [cart]);

  return (
    <motion.header style={headerStyle} className="sticky top-0 z-[80] border-b relative">
      <div className="relative max-w-6xl mx-auto px-3 sm:px-4 h-16 grid grid-cols-[auto_1fr_auto] items-center">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <Image src="/Layer.png" alt="Delightful Naturals" width={20} height={20} className="rounded" priority />
            <span className="hidden xs:inline font-semibold text-emerald-900 truncate text-base">Delightful Naturals</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center justify-center gap-8">
          <a href="#company" className="navlink flex items-center gap-1.5 rounded-lg px-2 py-1 -mx-2 bg-emerald-600 text-white">
            <IconLeaf className="w-4 h-4" /><span>Company</span>
          </a>
          <a href="#faqs" className="navlink flex items-center gap-1.5">
            <IconQuestionCircle className="w-4 h-4" /><span>FAQ</span>
          </a>
          <a href="#testimonials" className="navlink flex items-center gap-1.5">
            <IconStar className="w-4 h-4" /><span>Testimonials</span>
          </a>
          <a href="#support" className="navlink flex items-center gap-1.5">
            <IconLifeBuoy className="w-4 h-4" /><span>Support</span>
          </a>
          <ShopMenu />
        </nav>

        <div className="relative flex items-center justify-end gap-3 justify-self-end -mr-0 sm:-mr-6">
          <CartIcon className="w-5 h-5 text-emerald-800/80" />
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="relative md:hidden inline-grid place-items-center w-11 h-11 rounded-2xl bg-white border border-emerald-100 shadow-[0_6px_18px_rgba(16,185,129,0.15)] ring-1 ring-emerald-200/40"
          >
            {menuPing && (
              <>
                <span aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-emerald-400/60 animate-ping" />
                <span aria-hidden className="pointer-events-none absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-[3px] rounded-full bg-emerald-600 text-white text-[10px] grid place-items-center">
                  {cart.count}
                </span>
              </>
            )}
            <IconMenu className="w-6 h-6 text-emerald-800" />
          </motion.button>
          <CartDropdown open={cartOpen} onClose={() => setCartOpen(false)} />
        </div>
      </div>

      <style jsx>{`
        .navlink { color: rgb(6 95 70 / 0.8); font-weight: 500; font-size: 0.95rem; position: relative; }
        .navlink:hover { color: rgb(6 78 59); }
        .navlink:after {
          content: ''; position: absolute; left: 0; bottom: -6px; height: 2px; width: 0;
          background: #059669; border-radius: 2px;
          transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .navlink:hover:after { width: 100%; }
      `}</style>

      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </motion.header>
  );
}

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div className="fixed inset-0 z-[90]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label="Close menu" onClick={onClose} className="absolute inset-0 bg-black/25" />
          <motion.aside
            role="dialog" aria-modal="true" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-0 z-10 h-full w-[92%] max-w-sm bg-white shadow-2xl border-l"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative overflow-hidden">
              <div className="px-4 h-16 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <span className="inline-grid place-items-center w-8 h-8 rounded-xl bg-emerald-600 text-white">🌿</span>
                  <span className="font-semibold text-emerald-950">Menu</span>
                </div>
                <button aria-label="Close menu" onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-2 rounded-xl border hover:bg-emerald-50" type="button">
                  <IconClose className="w-5 h-5" />
                </button>
              </div>
              <div aria-hidden className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl -z-10"
                style={{ background: 'radial-gradient(circle at 60% 40%, rgba(16,185,129,0.25), rgba(234,179,8,0.18))' }} />
            </div>

            <div className="px-4 mt-4 grid grid-cols-2 gap-3">
              <a href="#company" onClick={onClose} className="group rounded-2xl border bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition">
                <div className="text-2xl">🌿</div><div className="mt-1 font-medium text-emerald-950">Company</div>
                <span className="text-xs text-emerald-800/70 group-hover:text-emerald-700">About →</span>
              </a>
              <a href="#faqs" onClick={onClose} className="group rounded-2xl border bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition">
                <div className="text-2xl">❓</div><div className="mt-1 font-medium text-emerald-950">FAQs</div>
                <span className="text-xs text-emerald-800/70 group-hover:text-emerald-700">Answers →</span>
              </a>
              <a href="#testimonials" onClick={onClose} className="group rounded-2xl border bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition">
                <div className="text-2xl">⭐</div><div className="mt-1 font-medium text-emerald-950">Testimonials</div>
                <span className="text-xs text-emerald-800/70 group-hover:text-emerald-700">See more →</span>
              </a>
              <a href="#support" onClick={onClose} className="group rounded-2xl border bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition">
                <div className="text-2xl">🛟</div><div className="mt-1 font-medium text-emerald-950">Support</div>
                <span className="text-xs text-emerald-800/70 group-hover:text-emerald-700">Get help →</span>
              </a>
            </div>

            <div className="px-4 mt-6">
              <div className="px-1 text-xs uppercase tracking-wide text-emerald-700/70 mb-2">Shop</div>
              <div className="divide-y rounded-2xl border">
                {SHOP_PRODUCTS.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3">
                    <Image src={p.img} alt={p.name} width={48} height={48} className="object-contain" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-emerald-950">{p.name}</div>
                      <div className="text-xs text-emerald-800/70">{p.detail} · {p.price}</div>
                    </div>
                    <AddButton productId={p.id as ProductId} />
                  </div>
                ))}
              </div>
            </div>

            <div className="px-4 pt-4 pb-5 mt-6">
              <div className="grid grid-cols-2 gap-2">
                <Link href="/shop" onClick={onClose} className="inline-flex items-center justify-center rounded-xl px-4 py-3 bg-emerald-600 text-white shadow">Visit Shop</Link>
                <a href="https://wa.me/27672943837" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl px-4 py-3 border" onClick={onClose}>WhatsApp</a>
              </div>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================================================================
   Types & Catalog (Checkout page data)
============================================================================ */
type Product = {
  id: string;
  name: string;
  price: number; // ZAR
  currency: 'R';
  img: string;
};
type StoredCartItem = { id: string; qty: number };
type LineItem = Product & { qty: number; lineTotal: number };

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
    img: '/products/scalp-detox-oil-60ml.png',
  },
};

/* ============================================================================
   Local storage helpers (typed, no `any`)
============================================================================ */
const CART_KEY = 'dn-cart';

function isStoredCartItem(u: unknown): u is StoredCartItem {
  return (
    typeof u === 'object' &&
    u !== null &&
    typeof (u as { id?: unknown }).id === 'string' &&
    Number.isFinite((u as { qty?: unknown }).qty)
  );
}

function readCart(): StoredCartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isStoredCartItem)
      .map((x) => ({ id: x.id, qty: Math.max(1, Math.min(99, Number(x.qty))) }));
  } catch {
    return [];
  }
}

function writeCart(next: StoredCartItem[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(next));
    // notify navbar badge (same event landing page uses)
    const total = next.reduce((s, r) => s + r.qty, 0);
    try {
      window.dispatchEvent(new CustomEvent<{ id: string; qty: number }>('cart:add', { detail: { id: next[0]?.id ?? '', qty: total } }));
    } catch {}
  } catch {}
}

/* ============================================================================
   Page
============================================================================ */
export default function CheckoutPage(): JSX.Element {
  return (
    <CartProvider>
      <style jsx global>{`html { scroll-behavior: smooth; }`}</style>
      <Header />
      <CheckoutBody />
    </CartProvider>
  );
}

/* Split body so navbar stays untouched; UI/logic remain the same below */
function CheckoutBody(): JSX.Element {
  const [cart, setCart] = useState<StoredCartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // buyer/contact form (minimal for Paystack initialize)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    province: '',
    postalCode: '',
    notes: '',
    shipping: 'courier' as 'courier' | 'pickup',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setCart(readCart());
  }, []);

  const lines: LineItem[] = useMemo(
    () =>
      cart
        .map((c) => {
          const p = CATALOG[c.id];
          if (!p) return null;
          const qty = Math.max(1, c.qty || 1);
          return { ...p, qty, lineTotal: qty * p.price };
        })
        .filter(Boolean) as LineItem[],
    [cart]
  );

  const subtotal = useMemo(() => lines.reduce((s, x) => s + x.lineTotal, 0), [lines]);
  const shipping = form.shipping === 'courier' ? 80 : 0;
  const grandTotal = subtotal + shipping;

  const updateQty = (id: string, qty: number) => {
    const q = Math.max(1, qty);
    const next = cart.map((x) => (x.id === id ? { ...x, qty: q } : x));
    setCart(next);
    writeCart(next);
  };
  const removeItem = (id: string) => {
    const next = cart.filter((x) => x.id !== id);
    setCart(next);
    writeCart(next);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!/^\+?[0-9\s()-]{7,}$/.test(form.phone)) e.phone = 'Enter a valid phone';
    if (form.shipping === 'courier') {
      if (!form.address1.trim()) e.address1 = 'Required';
      if (!form.city.trim()) e.city = 'Required';
      if (!form.province.trim()) e.province = 'Required';
      if (!form.postalCode.trim()) e.postalCode = 'Required';
    }
    if (lines.length === 0) e.cart = 'Your cart is empty';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  type PaystackInitOk = { authorization_url: string; reference: string };
  function isPaystackInitOk(u: unknown): u is PaystackInitOk {
    return (
      typeof u === 'object' &&
      u !== null &&
      typeof (u as { authorization_url?: unknown }).authorization_url === 'string' &&
      typeof (u as { reference?: unknown }).reference === 'string'
    );
  }

  const onPay = async () => {
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setLoading(true);
    try {
      const cartForMeta = lines.map(({ id, name, price, qty }) => ({ id, name, price, qty }));

      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          amountZar: grandTotal,
          name: `${form.firstName} ${form.lastName}`.trim(),
          phone: form.phone,
          cart: cartForMeta,
        }),
      });

      if (!res.ok) {
        let message = 'Failed to start payment';
        try {
          const j: unknown = await res.json();
          if (typeof j === 'object' && j && typeof (j as { message?: unknown }).message === 'string') {
            message = (j as { message: string }).message;
          }
        } catch {}
        throw new Error(message);
      }

      const data: unknown = await res.json();
      if (!isPaystackInitOk(data)) {
        throw new Error('Invalid response from payment gateway');
      }

      window.location.href = data.authorization_url;
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Payment error';
      alert(msg);
      setLoading(false);
    }
  };

  return (
    <main className="bg-white">
      {/* Layout */}
      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12 grid lg:grid-cols-5 gap-8" id="company">
        {/* Left: form */}
        <section className="lg:col-span-3">
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-950">Checkout</h1>
          <p className="text-emerald-900/70 mt-1">Enter your details below to complete your purchase.</p>

          {errors.cart && (
            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 p-3 text-sm">
              {errors.cart}
            </div>
          )}

          <Card title="Contact information">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field
                id="firstName"
                label="First name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                error={errors.firstName}
              />
              <Field
                id="lastName"
                label="Last name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                error={errors.lastName}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <Field
                id="email"
                type="email"
                label="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                error={errors.email}
              />
              <Field
                id="phone"
                label="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                error={errors.phone}
                placeholder="+27 ..."
              />
            </div>
          </Card>

          <Card title="Delivery">
            <div className="flex flex-col sm:flex-row gap-3">
              <RadioCard
                checked={form.shipping === 'courier'}
                onChange={() => setForm({ ...form, shipping: 'courier' })}
                title="Courier"
                subtitle="2–4 business days · R80"
              />
              <RadioCard
                checked={form.shipping === 'pickup'}
                onChange={() => setForm({ ...form, shipping: 'pickup' })}
                title="Pickup"
                subtitle="We’ll arrange via WhatsApp · Free"
              />
            </div>

            {form.shipping === 'courier' && (
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                <Field
                  id="address1"
                  label="Address line 1"
                  value={form.address1}
                  onChange={(e) => setForm({ ...form, address1: e.target.value })}
                  error={errors.address1}
                />
                <Field
                  id="address2"
                  label="Address line 2 (optional)"
                  value={form.address2}
                  onChange={(e) => setForm({ ...form, address2: e.target.value })}
                />
                <Field
                  id="city"
                  label="City"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  error={errors.city}
                />
                <Field
                  id="province"
                  label="Province"
                  value={form.province}
                  onChange={(e) => setForm({ ...form, province: e.target.value })}
                  error={errors.province}
                  placeholder="e.g. Gauteng"
                />
                <Field
                  id="postalCode"
                  label="Postal code"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  error={errors.postalCode}
                />
              </div>
            )}

            <div className="mt-3">
              <TextArea
                id="notes"
                label="Order notes (optional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={4}
              />
            </div>
          </Card>

          <div className="mt-6 flex flex-col sm:flex-row gap-3" id="support">
            <button
              onClick={onPay}
              disabled={loading}
              className="relative inline-flex items-center justify-center rounded-2xl px-6 py-3 bg-emerald-600 text-white font-semibold shadow hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Spinner />
                  <span className="ml-2">Opening Paystack…</span>
                </>
              ) : (
                'Pay now'
              )}
            </button>
            <Link href="/cart" className="inline-flex items-center justify-center rounded-2xl px-6 py-3 border">
              Back to cart
            </Link>
          </div>
          <div className="mt-3 text-[12px] text-emerald-900/70">
            You’ll be redirected to Paystack to complete your secure payment in ZAR.
          </div>
        </section>

        {/* Right: summary */}
        <aside className="lg:col-span-2" id="faqs">
          <div className="rounded-2xl border bg-white shadow-sm p-4 sm:p-5">
            <div className="font-semibold text-emerald-950">Order summary</div>

            <div className="mt-3 divide-y">
              <AnimatePresence initial={false}>
                {lines.map((it) => (
                  <motion.div
                    key={it.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="py-3 flex items-center gap-3"
                  >
                    <Image
                      src={it.img}
                      alt={it.name}
                      width={56}
                      height={56}
                      className="w-14 h-14 rounded border object-contain bg-white"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-emerald-950">{it.name}</div>
                      <div className="text-xs text-emerald-800/70">R{it.price.toLocaleString()}</div>
                      <div className="mt-1 inline-flex items-center rounded-lg border overflow-hidden">
                        <button
                          className="w-7 h-7 grid place-items-center hover:bg-emerald-50"
                          onClick={() => updateQty(it.id, it.qty - 1)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <div className="w-8 h-7 grid place-items-center text-sm">{it.qty}</div>
                        <button
                          className="w-7 h-7 grid place-items-center hover:bg-emerald-50"
                          onClick={() => updateQty(it.id, it.qty + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-emerald-950">
                      R{it.lineTotal.toLocaleString()}
                    </div>
                    <button
                      onClick={() => removeItem(it.id)}
                      className="ml-1 text-emerald-700/70 hover:text-emerald-900"
                      title="Remove"
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {lines.length === 0 && (
                <div className="py-6 text-sm text-emerald-900/70">Your cart is empty.</div>
              )}
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <Row label="Subtotal" value={`R${subtotal.toLocaleString()}`} />
              <Row label="Shipping" value={shipping ? `R${shipping.toLocaleString()}` : 'Free'} />
              <div className="border-t pt-2 flex items-center justify-between">
                <div className="font-semibold text-emerald-950">Total</div>
                <div className="font-bold text-emerald-950 text-lg">
                  R{grandTotal.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 text-xs text-emerald-900/70" id="testimonials">
              <span className="inline-grid place-items-center w-6 h-6 rounded-full bg-emerald-100 border">
                🔒
              </span>
              Payments are processed securely by Paystack (ZAR).
            </div>
          </div>
        </aside>
      </div>

      <style jsx>{`
        .input-base {
          @apply w-full rounded-2xl border px-4 py-3 bg-white shadow-sm outline-none transition
                 focus:ring-2 focus:ring-emerald-500 placeholder:text-emerald-700/40;
        }
        .label {
          @apply text-sm text-emerald-900/90 mb-1;
        }
        .error {
          @apply text-xs text-amber-600 mt-1;
        }
      `}</style>
    </main>
  );
}

/* UI bits (unchanged) */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-2xl border bg-white shadow-sm p-4 sm:p-5">
      <div className="font-semibold text-emerald-950">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
function Field(props: {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: 'text' | 'email' | 'tel';
  placeholder?: string;
  error?: string;
}) {
  const { id, label, value, onChange, type = 'text', placeholder, error } = props;
  return (
    <label htmlFor={id} className="block">
      <div className="label">{label}</div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-700/60">✦</span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="input-base pl-9"
        />
      </div>
      {error && <div className="error">{error}</div>}
    </label>
  );
}
function TextArea(props: {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
}) {
  const { id, label, value, onChange, rows = 4 } = props;
  return (
    <label htmlFor={id} className="block">
      <div className="label">{label}</div>
      <div className="relative">
        <span className="absolute left-3 top-3 text-emerald-700/60">✎</span>
        <textarea id={id} value={value} onChange={onChange} rows={rows} className="input-base pl-9 resize-none" />
      </div>
    </label>
  );
}
function RadioCard(props: {
  checked: boolean;
  onChange: () => void;
  title: string;
  subtitle: string;
}) {
  const { checked, onChange, title, subtitle } = props;
  return (
    <label
      className={`flex-1 flex items-center gap-3 rounded-2xl border p-3 cursor-pointer transition ${
        checked ? 'border-emerald-400 ring-2 ring-emerald-200' : 'hover:bg-emerald-50/40'
      }`}
    >
      <input type="radio" className="accent-emerald-600" checked={checked} onChange={onChange} />
      <div>
        <div className="font-medium text-emerald-950">{title}</div>
        <div className="text-xs text-emerald-800/80">{subtitle}</div>
      </div>
    </label>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-emerald-900/80">{label}</span>
      <span className="text-emerald-950">{value}</span>
    </div>
  );
}
function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
