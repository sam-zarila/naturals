'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import React, { JSX, useEffect, useMemo, useState } from 'react';

/* ============================================================================
   Types & Catalog
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
   Local storage helpers
============================================================================ */
const CART_KEY = 'dn-cart';
function readCart(): StoredCartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x: any) => x && typeof x.id === 'string' && Number.isFinite(x.qty))
      .map((x: any) => ({ id: x.id, qty: Math.max(1, Math.min(99, Number(x.qty))) }));
  } catch {
    return [];
  }
}
function writeCart(next: StoredCartItem[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(next));
  } catch {}
}

/* ============================================================================
   Page
============================================================================ */
export default function CheckoutPage(): JSX.Element {
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

  const onPay = async () => {
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setLoading(true);
    try {
      // optional: include cart in metadata
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
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || 'Failed to start payment');
      }

      const { authorization_url } = (await res.json()) as {
        authorization_url: string;
        reference: string;
      };

      // Redirect customer to Paystack hosted page
      window.location.href = authorization_url;
    } catch (err: any) {
      alert(err?.message || 'Payment error');
      setLoading(false);
    }
  };

  return (
    <main className="bg-white">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Delightful Naturals" width={32} height={32} className="rounded" />
            <span className="font-semibold text-emerald-900">Delightful Naturals</span>
          </Link>
          <Link href="/cart" className="text-sm text-emerald-700 hover:underline">
            Back to cart
          </Link>
        </div>
      </div>

      {/* Layout */}
      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12 grid lg:grid-cols-5 gap-8">
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

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
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
        <aside className="lg:col-span-2">
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

            <div className="mt-4 flex items-center gap-3 text-xs text-emerald-900/70">
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

/* UI bits */
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
