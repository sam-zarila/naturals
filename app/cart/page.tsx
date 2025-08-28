'use client';

import React, { JSX, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';

/* ============================================================================
   Types
============================================================================ */
type Product = {
  id: string;
  name: string;
  price: number; // in ZAR cents or rands? (Using rands here to match your catalog)
  currency: 'R';
  img: string;
};

type StoredCartItem = { id: string; qty: number };

type ExpandedLine = Product & {
  qty: number;
  lineTotal: number;
};

/* ============================================================================
   Catalog (mirror your product ids)
============================================================================ */
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
   LocalStorage helpers (fully typed, no any)
============================================================================ */
const CART_KEY = 'dn-cart';

function isStoredCartItem(x: unknown): x is StoredCartItem {
  return (
    typeof x === 'object' &&
    x !== null &&
    'id' in x &&
    'qty' in x &&
    typeof (x as { id: unknown }).id === 'string' &&
    typeof (x as { qty: unknown }).qty === 'number'
  );
}

function parseCart(raw: unknown): StoredCartItem[] {
  if (!Array.isArray(raw)) return [];
  const valid: StoredCartItem[] = [];
  for (const item of raw) {
    if (isStoredCartItem(item) && item.qty > 0) valid.push(item);
  }
  return valid;
}

function readCart(): StoredCartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    return parseCart(JSON.parse(raw));
  } catch {
    return [];
  }
}

function writeCart(next: StoredCartItem[]): void {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(next));
  } catch {
    // ignore write failures
  }
}

/* ============================================================================
   Page
============================================================================ */
export default function CartPage(): JSX.Element {
  const [items, setItems] = useState<StoredCartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setItems(readCart());
    setLoading(false);
  }, []);

  // Expand items with catalog data
  const lines: ExpandedLine[] = useMemo(() => {
    return items
      .map((it) => {
        const p = CATALOG[it.id];
        if (!p) return null;
        const qty = Math.max(1, it.qty);
        return { ...p, qty, lineTotal: qty * p.price };
      })
      .filter((x): x is ExpandedLine => Boolean(x));
  }, [items]);

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.lineTotal, 0),
    [lines],
  );

  const updateQty = (id: string, qty: number) => {
    const q = Math.max(1, qty);
    const next = items.map((x) => (x.id === id ? { ...x, qty: q } : x));
    setItems(next);
    writeCart(next);
  };

  const removeItem = (id: string) => {
    const next = items.filter((x) => x.id !== id);
    setItems(next);
    writeCart(next);
  };

  const clear = () => {
    setItems([]);
    writeCart([]);
  };

  return (
    <main className="bg-white min-h-screen">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Delightful Naturals"
              width={32}
              height={32}
              className="rounded"
            />
            <span className="font-semibold text-emerald-900">
              Delightful Naturals
            </span>
          </Link>
          <Link href="/shop" className="text-sm text-emerald-700 hover:underline">
            Continue shopping
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12 grid lg:grid-cols-5 gap-8">
        {/* Left: items */}
        <section className="lg:col-span-3">
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-950">Your cart</h1>
          <p className="text-emerald-900/70 mt-1">Review items and update quantities.</p>

          <div className="mt-4 rounded-2xl border bg-white shadow-sm">
            <div className="divide-y">
              <AnimatePresence initial={false}>
                {lines.map((l) => (
                  <motion.div
                    key={l.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4"
                  >
                    <Image
                      src={l.img}
                      alt={l.name}
                      width={64}
                      height={64}
                      className="rounded border bg-white w-16 h-16 object-contain"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm sm:text-base font-medium text-emerald-950 truncate">
                        {l.name}
                      </div>
                      <div className="text-xs text-emerald-800/70 mt-0.5">
                        {l.currency}
                        {l.price.toLocaleString()}
                      </div>

                      <div className="mt-2 inline-flex items-center rounded-xl border overflow-hidden">
                        <button
                          className="w-8 h-8 grid place-items-center hover:bg-emerald-50"
                          onClick={() => updateQty(l.id, l.qty - 1)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <div className="w-10 h-8 grid place-items-center text-sm">
                          {l.qty}
                        </div>
                        <button
                          className="w-8 h-8 grid place-items-center hover:bg-emerald-50"
                          onClick={() => updateQty(l.id, l.qty + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="text-sm sm:text-base font-semibold text-emerald-950">
                      R{l.lineTotal.toLocaleString()}
                    </div>

                    <button
                      onClick={() => removeItem(l.id)}
                      className="ml-1 text-emerald-700/70 hover:text-emerald-900 text-lg"
                      title="Remove"
                      aria-label="Remove item"
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {lines.length === 0 && !loading && (
                <div className="p-6 text-sm text-emerald-900/70">
                  Your cart is empty.{' '}
                  <Link href="/shop" className="text-emerald-700 underline">
                    Browse products
                  </Link>
                  .
                </div>
              )}
            </div>

            {lines.length > 0 && (
              <div className="p-4 sm:p-5 border-t flex items-center justify-between">
                <button
                  onClick={clear}
                  className="text-sm px-4 py-2 rounded-xl border hover:bg-emerald-50"
                >
                  Clear cart
                </button>
                <Link
                  href="/checkout"
                  className="inline-flex items-center justify-center rounded-xl px-4 py-2 bg-emerald-600 text-white shadow hover:bg-emerald-700"
                >
                  Checkout →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Right: summary */}
        <aside className="lg:col-span-2">
          <div className="rounded-2xl border bg-white shadow-sm p-4 sm:p-5">
            <div className="font-semibold text-emerald-950">Order summary</div>

            <div className="mt-3 space-y-2 text-sm">
              <Row label="Subtotal" value={`R${subtotal.toLocaleString()}`} />
              {/* Shipping can be decided on checkout */}
              <Row label="Estimated shipping" value="Calculated at checkout" />
              <div className="border-t pt-2 flex items-center justify-between">
                <div className="font-semibold text-emerald-950">Estimated total</div>
                <div className="font-bold text-emerald-950 text-lg">
                  R{subtotal.toLocaleString()}
                </div>
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-4 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 bg-emerald-600 text-white font-medium shadow hover:bg-emerald-700"
            >
              Proceed to checkout
            </Link>

            <div className="mt-3 text-xs text-emerald-900/70 flex items-center gap-2">
              <span className="inline-grid place-items-center w-6 h-6 rounded-full bg-emerald-100 border">
                🔒
              </span>
              Secure checkout via PayFast (ZAR)
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

/* UI bits */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-emerald-900/80">{label}</span>
      <span className="text-emerald-950">{value}</span>
    </div>
  );
}
