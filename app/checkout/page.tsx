'use client';

import React, { useEffect, useMemo, useRef, useState, ChangeEvent } from 'react';
import Link from 'next/link';

/* =========================
   Types & Catalog
========================= */
type ProductId = 'detox-60' | 'growth-100';

type CatalogEntry = {
  id: ProductId;
  name: string;
  price: number;      // ZAR
  currency: 'R';
  img: string;
};

const CATALOG: Record<ProductId, CatalogEntry> = {
  'detox-60': {
    id: 'detox-60',
    name: 'Scalp Detox Oil',
    price: 260,
    currency: 'R',
    img: '/products/hair-growth-oil-100ml.png',
  },
  'growth-100': {
    id: 'growth-100',
    name: 'Mega Potent Hair Growth Oil',
    price: 300,
    currency: 'R',
    img: '/products/hair-growth-oil-100ml.png',
  },
};

type CartRow = { id: ProductId; qty: number };

type LineItem = CatalogEntry & { qty: number };

type CheckoutForm = {
  fullName: string;
  email: string;
  phone?: string;
  address1: string;
  address2?: string;
  city: string;
  postalCode: string;
  notes?: string;
};

type CheckoutOk = { ok: true; redirectUrl?: string };
type CheckoutErr = { ok: false; message: string };
type CheckoutResponse = CheckoutOk | CheckoutErr;

/* =========================
   Helpers (typed)
========================= */
const CART_KEY = 'dn-cart';

function safeParseCart(raw: string | null): CartRow[] {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x: unknown): x is CartRow =>
          typeof x === 'object' &&
          x !== null &&
          typeof (x as CartRow).id === 'string' &&
          typeof (x as CartRow).qty === 'number'
      )
      .map((x) => ({
        id: (x as CartRow).id as ProductId,
        qty: Math.max(1, Math.min(99, Number((x as CartRow).qty))),
      }));
  } catch {
    return [];
  }
}

function readCart(): CartRow[] {
  if (typeof window === 'undefined') return [];
  return safeParseCart(localStorage.getItem(CART_KEY));
}

function writeCart(rows: CartRow[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_KEY, JSON.stringify(rows));
  // notify listeners (cart badge / mini-cart)
  try {
    const total = rows.reduce<number>((s, r) => s + r.qty, 0);
    window.dispatchEvent(
      new CustomEvent('cart:add', { detail: { id: rows[0]?.id, qty: total } })
    );
  } catch {}
}

/* =========================
   Page
========================= */
export default function CheckoutPage() {
  const [lines, setLines] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [form, setForm] = useState<CheckoutForm>({
    fullName: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    postalCode: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // load cart on mount
  useEffect(() => {
    const rows = readCart();
    const withDetails: LineItem[] = rows
      .filter((r) => r.id in CATALOG)
      .map((r) => ({ ...CATALOG[r.id], qty: r.qty }));
    setLines(withDetails);
    setLoading(false);
  }, []);

  const subtotal = useMemo(
    () => lines.reduce<number>((s, x) => s + x.qty * x.price, 0),
    [lines]
  );

  const handleChange =
    <K extends keyof CheckoutForm>(key: K) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setForm((f) => ({ ...f, [key]: value }));
    };

  const updateQty = (id: ProductId, nextQty: number): void => {
    setLines((prev) => {
      const clamped = Math.max(1, Math.min(99, nextQty));
      const copy = prev.map((l) => (l.id === id ? { ...l, qty: clamped } : l));
      // mirror to storage
      const rows: CartRow[] = copy.map((l) => ({ id: l.id, qty: l.qty }));
      writeCart(rows);
      return copy;
    });
  };

  const removeLine = (id: ProductId): void => {
    setLines((prev) => {
      const next = prev.filter((l) => l.id !== id);
      const rows: CartRow[] = next.map((l) => ({ id: l.id, qty: l.qty }));
      writeCart(rows);
      return next;
    });
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (lines.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    if (!form.fullName.trim() || !form.email.trim() || !form.address1.trim() || !form.city.trim() || !form.postalCode.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      // Replace with your real checkout endpoint
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: form,
          items: lines.map((l) => ({ id: l.id, qty: l.qty })),
          subtotal,
          currency: 'ZAR',
        }),
      });

      // Typed response
      const data: CheckoutResponse = await res.json();

      if (!res.ok || !data.ok) {
        const message = !res.ok
          ? `Checkout failed (${res.status})`
          : (data as CheckoutErr).message || 'Checkout failed.';
        setError(message);
      } else {
        // Optionally clear cart on success
        writeCart([]);
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          // Stay on page, show success UI or route elsewhere:
          // router.push('/thank-you')
          alert('Order placed successfully!');
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================
     UI
  ========================= */
  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="animate-pulse h-6 w-40 bg-neutral-200 rounded mb-4" />
        <div className="animate-pulse h-32 w-full bg-neutral-100 rounded" />
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-emerald-950">Checkout</h1>

      {lines.length === 0 ? (
        <div className="mt-6 rounded-xl border p-6 bg-white">
          <p className="text-neutral-700">Your cart is empty.</p>
          <Link href="/shop" className="mt-3 inline-block text-emerald-700 underline">
            Continue shopping →
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-[1.2fr_1fr]">
          {/* Cart summary */}
          <section className="rounded-xl border bg-white">
            <div className="px-4 py-3 border-b font-semibold text-emerald-950">Items</div>
            <ul className="divide-y">
              {lines.map((l) => (
                <li key={l.id} className="p-4 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.img} alt={l.name} className="w-14 h-14 rounded border object-contain" />
                  <div className="flex-1">
                    <div className="font-medium text-emerald-950">{l.name}</div>
                    <div className="text-sm text-neutral-600">
                      {l.currency}
                      {l.price.toLocaleString('en-ZA')}
                    </div>
                    <div className="mt-2 inline-flex items-center rounded border overflow-hidden">
                      <button
                        type="button"
                        className="w-8 h-8 grid place-items-center hover:bg-emerald-50"
                        onClick={() => updateQty(l.id, l.qty - 1)}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <div className="w-10 h-8 grid place-items-center text-sm">{l.qty}</div>
                      <button
                        type="button"
                        className="w-8 h-8 grid place-items-center hover:bg-emerald-50"
                        onClick={() => updateQty(l.id, l.qty + 1)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      R{(l.price * l.qty).toLocaleString('en-ZA')}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(l.id)}
                      className="mt-1 text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-4 py-3 border-t flex items-center justify-between">
              <span className="text-neutral-700">Subtotal</span>
              <span className="font-semibold">R{subtotal.toLocaleString('en-ZA')}</span>
            </div>
          </section>

          {/* Checkout form */}
          <section className="rounded-xl border bg-white">
            <div className="px-4 py-3 border-b font-semibold text-emerald-950">
              Shipping details
            </div>

            {error && (
              <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="p-4 grid gap-3">
              <div className="grid grid-cols-1 gap-3">
                <label className="text-xs font-medium text-neutral-700">
                  Full Name *
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={handleChange('fullName')}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </label>

                <label className="text-xs font-medium text-neutral-700">
                  Email *
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange('email')}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </label>

                <label className="text-xs font-medium text-neutral-700">
                  Phone
                  <input
                    type="tel"
                    value={form.phone || ''}
                    onChange={handleChange('phone')}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <label className="text-xs font-medium text-neutral-700">
                  Address Line 1 *
                  <input
                    type="text"
                    required
                    value={form.address1}
                    onChange={handleChange('address1')}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </label>

                <label className="text-xs font-medium text-neutral-700">
                  Address Line 2
                  <input
                    type="text"
                    value={form.address2 || ''}
                    onChange={handleChange('address2')}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-medium text-neutral-700">
                    City *
                    <input
                      type="text"
                      required
                      value={form.city}
                      onChange={handleChange('city')}
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                    />
                  </label>
                  <label className="text-xs font-medium text-neutral-700">
                    Postal Code *
                    <input
                      type="text"
                      required
                      value={form.postalCode}
                      onChange={handleChange('postalCode')}
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                    />
                  </label>
                </div>

                <label className="text-xs font-medium text-neutral-700">
                  Notes
                  <textarea
                    rows={3}
                    value={form.notes || ''}
                    onChange={handleChange('notes')}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-white disabled:opacity-70"
              >
                {submitting ? 'Placing order…' : 'Place order'}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
