'use client';

import React, { JSX, useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { firestore } from '../lib/firebase-client';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

/* ============================================================================
   Toast Hook and Component
============================================================================ */
interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
    const id = uuidv4();
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return { toast, toasts };
}

function ToastComponent({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`p-4 rounded-lg shadow-lg text-white ${
              toast.variant === 'destructive' ? 'bg-red-600' : 'bg-emerald-600'
            }`}
          >
            <div className="font-semibold">{toast.title}</div>
            {toast.description && <div className="text-sm mt-1">{toast.description}</div>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================================
   Types
============================================================================ */
type Product = {
  id: string;
  name: string;
  price: number;
  currency: 'R';
  img: string;
};

type StoredCartItem = { id: string; qty: number };

type ExpandedLine = Product & {
  qty: number;
  lineTotal: number;
};

/* ============================================================================
   Catalog
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
   Firestore and LocalStorage Helpers
============================================================================ */
const USER_ID_KEY = 'cart-user-id';
const CART_PATH = (userId: string) => `carts/${userId}`; // Document path

function getUserId(): string {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

function parseCart(raw: unknown): StoredCartItem[] {
  if (!Array.isArray(raw)) return [];
  const valid: StoredCartItem[] = [];
  for (const item of raw) {
    if (
      typeof item === 'object' &&
      item !== null &&
      'id' in item &&
      'qty' in item &&
      typeof item.id === 'string' &&
      typeof item.qty === 'number' &&
      item.qty > 0
    ) {
      valid.push({ id: item.id, qty: Math.floor(item.qty) });
    }
  }
  return valid;
}

async function readCart(userId: string): Promise<StoredCartItem[]> {
  try {
    const docRef = doc(firestore, CART_PATH(userId));
    const docSnap = await getDoc(docRef);
    console.log('readCart: userId:', userId, 'data:', docSnap.exists() ? docSnap.data() : 'No document');
    return docSnap.exists() ? parseCart(docSnap.data().items) : [];
  } catch (err) {
    console.error('Error reading cart:', err);
    throw err;
  }
}

async function writeCart(userId: string, items: StoredCartItem[]): Promise<void> {
  try {
    const docRef = doc(firestore, CART_PATH(userId));
    // Fetch existing document to get current token
    const docSnap = await getDoc(docRef);
    let token: string | null = localStorage.getItem('cart-token');
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && typeof data.token === 'string' && data.token) {
        // Use existing token from Firestore if available and a string
        token = data.token;
        localStorage.setItem('cart-token', token);
      }
    }
    if (!token) {
      // Generate new token only if no token exists
      token = uuidv4();
      localStorage.setItem('cart-token', token);
    }
    console.log('writeCart: userId:', userId, 'token:', token, 'items:', items);
    await setDoc(docRef, { items, updatedAt: Date.now(), token }, { merge: true });
  } catch (err) {
    console.error('Error writing cart:', err);
    throw err;
  }
}

// Function to clear cart after successful checkout
export async function clearCartAfterCheckout(userId: string): Promise<void> {
  try {
    const docRef = doc(firestore, CART_PATH(userId));
    let token: string | null = localStorage.getItem('cart-token');
    
    if (!token) {
      token = uuidv4();
      localStorage.setItem('cart-token', token);
    }
    
    console.log('clearCartAfterCheckout: userId:', userId, 'token:', token);
    await setDoc(docRef, { items: [], updatedAt: Date.now(), token }, { merge: true });
    
    // Also update localStorage to reflect empty cart
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('cartUpdated', { detail: { items: [] } });
      window.dispatchEvent(event);
    }
  } catch (err) {
    console.error('Error clearing cart after checkout:', err);
    throw err;
  }
}

/* ============================================================================
   Page
============================================================================ */
export default function CartPage(): JSX.Element {
  const { toast, toasts } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<StoredCartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize userId and fetch cart
  useEffect(() => {
    const id = getUserId();
    setUserId(id);
    setLoading(true);
    readCart(id)
      .then((cart) => {
        setItems(cart);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Cart load error:', err);
        toast({ title: 'Error', description: `Failed to load cart: ${err instanceof Error ? err.message : 'Unknown error'}`, variant: 'destructive' });
        setLoading(false);
      });
  }, []); // Empty dependency array

  // Listen for cart updates from other components (like checkout)
  useEffect(() => {
    const handleCartUpdate = (event: CustomEvent) => {
      if (event.detail && Array.isArray(event.detail.items)) {
        setItems(event.detail.items);
      }
    };

    // Add event listener for cart updates
    window.addEventListener('cartUpdated', handleCartUpdate as EventListener);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate as EventListener);
    };
  }, []);

  // Memoized cart operations
  const updateQty = useCallback(
    async (id: string, qty: number) => {
      if (!userId) return;
      try {
        const q = Math.max(1, qty);
        const next = items.map((x) => (x.id === id ? { ...x, qty: q } : x));
        setItems(next);
        await writeCart(userId, next);
        toast({ title: 'Cart updated', description: `Quantity for ${CATALOG[id]?.name || 'item'} updated.` });
      } catch (err) {
        console.error('updateQty error:', err);
        toast({ title: 'Error', description: `Failed to update cart: ${err instanceof Error ? err.message : 'Unknown error'}`, variant: 'destructive' });
      }
    },
    [userId, items, toast]
  );

  const removeItem = useCallback(
    async (id: string) => {
      if (!userId) return;
      try {
        const next = items.filter((x) => x.id !== id);
        setItems(next);
        await writeCart(userId, next);
        toast({ title: 'Item removed', description: `${CATALOG[id]?.name || 'Item'} removed from cart.` });
      } catch (err) {
        console.error('removeItem error:', err);
        toast({ title: 'Error', description: `Failed to remove item: ${err instanceof Error ? err.message : 'Unknown error'}`, variant: 'destructive' });
      }
    },
    [userId, items, toast]
  );

  const clear = useCallback(
    async () => {
      if (!userId) return;
      try {
        setItems([]);
        await writeCart(userId, []);
        toast({ title: 'Cart cleared', description: 'All items removed from cart.' });
      } catch (err) {
        console.error('clear error:', err);
        toast({ title: 'Error', description: `Failed to clear cart: ${err instanceof Error ? err.message : 'Unknown error'}`, variant: 'destructive' });
      }
    },
    [userId, toast]
  );

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
    [lines]
  );

  if (loading) {
    return (
      <main className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">Loading cart...</div>
      </main>
    );
  }

  return (
    <main className="bg-white min-h-screen">
      <ToastComponent toasts={toasts} />
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

              {lines.length === 0 && (
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