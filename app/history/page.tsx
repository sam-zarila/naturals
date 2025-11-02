
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { AnimatePresence, motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import Link from 'next/link';
import { firestore } from '../lib/firebase-client';

/* ============================ Icons ============================ */
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
function IconCart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 3h2l2.5 11.5a2 2 0 0 0 2 1.5H16a2 2 0 0 0 2-1.5L20 6H6" strokeLinecap="round" />
      <circle cx="10" cy="20" r="1" />
      <circle cx="17" cy="20" r="1" />
    </svg>
  );
}
function IconOrders({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 4h16v16H4z" />
      <path d="M8 8h8m-8 4h8m-8 4h8" strokeLinecap="round" />
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

/* ============================ Catalog ============================ */
interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  img: string;
}
const CATALOG: Record<string, Product> = {
  "growth-100": { id: "growth-100", name: "Hair Growth Oil · 100ml", price: 300, currency: "R", img: "/products/hair-growth-oil-100ml.png" },
  "detox-60": { id: "detox-60", name: "Scalp Detox Oil · 60ml", price: 260, currency: "R", img: "/products/scalp-detox-oil-60ml.png" },
};

/* ============================= Toast ============================= */
interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}
function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback(
    ({ title, description, variant = "default" }: Omit<Toast, "id">) => {
      const id = uuidv4();
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    []
  );
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
            className={`p-4 rounded-lg shadow-lg text-white ${toast.variant === "destructive" ? "bg-red-600" : "bg-emerald-600"}`}
          >
            <div className="font-semibold">{toast.title}</div>
            {toast.description && <div className="text-sm mt-1">{toast.description}</div>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* =========================== Utilities =========================== */
const USER_ID_KEY = "cart-user-id";
function getAnonUserId(): string {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}
function getShippingLabel(method: string) {
  const SHIPPING_OPTIONS = [
    { value: "self-pickup", label: "Self Pickup" },
    { value: "the-courier-guy", label: "The Courier Guy" },
    { value: "dhl-express", label: "DHL Express" },
    { value: "fedex", label: "FedEx" },
    { value: "aramex", label: "Aramex" },
    { value: "fastway-couriers", label: "Fastway Couriers" },
    { value: "ram-couriers", label: "RAM Couriers" },
    { value: "dsv", label: "DSV" },
    { value: "postnet", label: "PostNet" },
  ];
  return SHIPPING_OPTIONS.find(s => s.value === method)?.label ?? 'Standard';
}

/* ======================== Order History Body ======================== */
function OrderHistoryBody() {
  const { toast, toasts } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔴 Switched to a real-time listener so status updates from Admin reflect instantly
  useEffect(() => {
    setLoading(true);
    const userId = getAnonUserId();
    const q = query(
      collection(firestore, "orders"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setOrders(rows);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading orders:", err);
        toast({ title: "Error", description: "Failed to load orders. Please try again.", variant: "destructive" });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center py-8">Loading order history...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-12">
      <ToastComponent toasts={toasts} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Breadcrumbs */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6">
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
                <li aria-hidden className="px-1 text-emerald-700/60"><IconChevron className="w-4 h-4" /></li>
                <li>
                  <Link
                    href="/shop"
                    className="group inline-flex items-center gap-2 rounded-2xl border bg-white px-3 py-1.5 text-sm text-emerald-900 shadow-sm hover:-translate-y-0.5 hover:shadow transition"
                  >
                    <span className="inline-grid place-items-center w-6 h-6 rounded-xl bg-emerald-100 text-emerald-700 border"><IconBag className="w-3.5 h-3.5" /></span>
                    <span className="font-medium">Shop</span>
                  </Link>
                </li>
                <li aria-hidden className="px-1 text-emerald-700/60"><IconChevron className="w-4 h-4" /></li>
                <li>
                  <Link
                    href="/cart"
                    className="group inline-flex items-center gap-2 rounded-2xl border bg-white px-3 py-1.5 text-sm text-emerald-900 shadow-sm hover:-translate-y-0.5 hover:shadow transition"
                  >
                    <span className="inline-grid place-items-center w-6 h-6 rounded-xl bg-emerald-100 text-emerald-700 border"><IconCart className="w-3.5 h-3.5" /></span>
                    <span className="font-medium">Cart</span>
                  </Link>
                </li>
                <li aria-hidden className="px-1 text-emerald-700/60"><IconChevron className="w-4 h-4" /></li>
                <li aria-current="page">
                  <span className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 text-white px-3 py-1.5 text-sm shadow">
                    <span className="inline-grid place-items-center w-6 h-6 rounded-xl bg-white/20 border border-white/30">
                      <IconOrders className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-semibold">My Orders</span>
                  </span>
                </li>
              </ol>
            </div>
          </nav>
        </motion.div>

        <h1 className="text-3xl font-bold text-emerald-900 mb-8">Order History</h1>

        {orders.length === 0 ? (
          <div className="rounded-2xl border bg-white shadow-sm p-6 text-center">
            <p className="text-emerald-900/80 mb-4">You have no orders yet.</p>
            <Link href="/shop" className="inline-flex items-center justify-center rounded-full px-6 py-3 bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition shadow-md">
              Shop now
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const createdAt: Date =
                order.createdAt?.toDate?.() ??
                (typeof order.createdAt === 'number' || typeof order.createdAt === 'string'
                  ? new Date(order.createdAt)
                  : new Date());

              const status: string = String(order.status || 'pending');
              const progressPct =
                status === 'pending' ? 25 :
                status === 'processing' ? 50 :
                status === 'shipped' ? 75 :
                100;

              return (
                <div key={order.id} className="rounded-2xl border bg-white shadow-sm p-4 md:p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-emerald-950">Order #{order.id}</h2>
                      <p className="text-sm text-emerald-900/80">
                        Placed on: {createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                        status === 'delivered' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-medium text-emerald-950 mb-2">Items:</h3>
                    <ul className="space-y-2">
                      {(order.items || []).map((item: { id: string; qty: number }) => {
                        const product = CATALOG[item.id];
                        const line = product ? product.price * item.qty : 0;
                        return (
                          <li key={item.id} className="flex justify-between text-sm text-emerald-900/80">
                            <span>{product ? product.name : `Product ${item.id}`} × {item.qty}</span>
                            <span>R{line.toLocaleString()}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-medium text-emerald-950 mb-2">Shipping:</h3>
                    <p className="text-sm text-emerald-900/80">
                      Method: {order.shippingMethod ? getShippingLabel(order.shippingMethod) : 'N/A'}
                    </p>
                    <p className="text-sm text-emerald-900/80">
                      Cost: R{(order.totals?.shipping ?? 0).toLocaleString()}
                    </p>
                    {order.customer?.address && (
                      <p className="text-sm text-emerald-900/80 mt-2">
                        Address: {order.customer.address.line1}
                        {order.customer.address.line2 ? `, ${order.customer.address.line2}` : ''}, {order.customer.address.city}, {order.customer.address.province} {order.customer.address.postalCode}
                      </p>
                    )}
                  </div>

                  <div className="border-t pt-2 flex justify-between text-sm font-medium">
                    <span>Total:</span>
                    <span className="text-emerald-950">R{(order.totals?.grandTotal ?? 0).toLocaleString()}</span>
                  </div>

                  <div className="mt-4">
                    <h3 className="font-medium text-emerald-950 mb-2">Order Progress:</h3>
                    <div className="flex justify-between text-sm">
                      <span className={status === 'pending' ? 'text-emerald-600' : 'text-emerald-900/50'}>Pending</span>
                      <span className={status === 'processing' ? 'text-emerald-600' : 'text-emerald-900/50'}>Processing</span>
                      <span className={status === 'shipped' ? 'text-emerald-600' : 'text-emerald-900/50'}>Shipped</span>
                      <span className={status === 'delivered' ? 'text-emerald-600' : 'text-emerald-900/50'}>Delivered</span>
                    </div>
                    <div className="mt-2 h-2 bg-emerald-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================== Page ============================== */
export default function OrdersPage() {
  return <OrderHistoryBody />;
}
