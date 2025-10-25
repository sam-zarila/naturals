'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { AnimatePresence, motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";

import Link from 'next/link';
import { firestore } from '../lib/firebase-client';

// Icon Components
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

/* ============================================================================
   Catalog
============================================================================ */
interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  img: string;
}

const CATALOG: Record<string, Product> = {
  "growth-100": {
    id: "growth-100",
    name: "Hair Growth Oil · 100ml",
    price: 300,
    currency: "R",
    img: "/products/hair-growth-oil-100ml.png",
  },
  "detox-60": {
    id: "detox-60",
    name: "Scalp Detox Oil · 60ml",
    price: 260,
    currency: "R",
    img: "/products/scalp-detox-oil-60ml.png",
  },
};

/* ============================================================================
   Toast Hook and Component
============================================================================ */
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
            className={`p-4 rounded-lg shadow-lg text-white ${
              toast.variant === "destructive" ? "bg-red-600" : "bg-emerald-600"
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
   Auth Modal Component
============================================================================ */
function AuthModal({ onClose, initialLogin = true }: { onClose: () => void; initialLogin?: boolean }) {
  const { toast } = useToast();
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isLogin, setIsLogin] = useState(initialLogin);
  const [authLoading, setAuthLoading] = useState(false);
  const auth = getAuth(firestore.app);

  const handleAuth = async () => {
    if (!authEmail || !authPassword) {
      toast({
        title: "Error",
        description: "Please enter email and password.",
        variant: "destructive",
      });
      return;
    }
    setAuthLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        toast({
          title: "Success",
          description: "Logged in successfully.",
        });
      } else {
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        toast({
          title: "Success",
          description: "Registration successful.",
        });
      }
      setAuthEmail("");
      setAuthPassword("");
      onClose();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Authentication failed.",
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogle = async () => {
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      toast({
        title: "Success",
        description: "Logged in with Google.",
      });
      onClose();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Google authentication failed.",
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-emerald-950">
            {isLogin ? "Log In" : "Sign Up"}
          </h2>
          <button onClick={onClose} className="text-emerald-700 hover:text-emerald-900">
            ✕
          </button>
        </div>
        <p className="text-emerald-900/70 mb-6">
          Please {isLogin ? "log in" : "sign up"} to view your order history.
        </p>
        <div className="space-y-4">
          <div>
            <label htmlFor="auth-email" className="block text-sm font-medium text-emerald-950">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-neutral-200 p-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="auth-password" className="block text-sm font-medium text-emerald-950">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-neutral-200 p-2 text-sm"
            />
          </div>
          <button
            onClick={handleAuth}
            disabled={authLoading}
            className="w-full rounded-2xl px-6 py-3 bg-emerald-600 text-white font-medium shadow hover:bg-emerald-700 disabled:opacity-50"
          >
            {authLoading ? "Processing..." : isLogin ? "Log In" : "Sign Up"}
          </button>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full text-sm text-emerald-700 hover:underline"
          >
            {isLogin ? "Need an account? Sign up" : "Have an account? Log in"}
          </button>
          <button
            onClick={handleGoogle}
            disabled={authLoading}
            className="w-full rounded-2xl px-6 py-3 border text-emerald-950 hover:bg-emerald-50"
          >
            Log in with Google
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ============================================================================
   Order History Component
============================================================================ */
function OrderHistoryBody() {
  const auth = getAuth(firestore.app);
  const { toast, toasts } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const q = query(
            collection(firestore, "orders"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
          );
          const querySnap = await getDocs(q);
          const ordersData = querySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setOrders(ordersData);
          setShowAuthModal(false); // Ensure modal is closed after successful login
        } catch (err) {
          console.error("Error loading orders:", err);
          toast({
            title: "Error",
            description: "Failed to load orders. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        setOrders([]);
        setShowAuthModal(true); // Show auth modal immediately for unauthenticated users
      }
      setLoading(false);
    });
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
      <AnimatePresence>
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </AnimatePresence>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Breadcrumbs */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
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
                <li>
                  <Link
                    href="/shop"
                    className="group inline-flex items-center gap-2 rounded-2xl border bg-white px-3 py-1.5 text-sm text-emerald-900 shadow-sm hover:-translate-y-0.5 hover:shadow transition"
                  >
                    <span className="inline-grid place-items-center w-6 h-6 rounded-xl bg-emerald-100 text-emerald-700 border">
                      <IconBag className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-medium">Shop</span>
                  </Link>
                </li>
                <li aria-hidden className="px-1 text-emerald-700/60">
                  <IconChevron className="w-4 h-4" />
                </li>
                <li>
                  <Link
                    href="/cart"
                    className="group inline-flex items-center gap-2 rounded-2xl border bg-white px-3 py-1.5 text-sm text-emerald-900 shadow-sm hover:-translate-y-0.5 hover:shadow transition"
                  >
                    <span className="inline-grid place-items-center w-6 h-6 rounded-xl bg-emerald-100 text-emerald-700 border">
                      <IconCart className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-medium">Cart</span>
                  </Link>
                </li>
                <li aria-hidden className="px-1 text-emerald-700/60">
                  <IconChevron className="w-4 h-4" />
                </li>
                <li aria-current="page">
                  <span
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 text-white px-3 py-1.5 text-sm shadow"
                  >
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

        {currentUser && orders.length === 0 ? (
          <p className="text-emerald-900/70">You have no orders yet.</p>
        ) : currentUser ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="rounded-2xl border bg-white shadow-sm p-4 md:p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-emerald-950">Order #{order.id}</h2>
                    <p className="text-sm text-emerald-900/80">
                      Placed on: {order.createdAt.toDate().toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <div className="mb-4">
                  <h3 className="font-medium text-emerald-950 mb-2">Items:</h3>
                  <ul className="space-y-2">
                    {order.items.map((item: { id: string; qty: number }) => {
                      const product = CATALOG[item.id];
                      return (
                        <li key={item.id} className="flex justify-between text-sm text-emerald-900/80">
                          <span>{product ? product.name : 'Unknown Product'} × {item.qty}</span>
                          <span>R{(product ? product.price * item.qty : 0).toLocaleString()}</span>
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
                    Cost: R{order.totals.shipping.toLocaleString()}
                  </p>
                  {order.customer.address && (
                    <p className="text-sm text-emerald-900/80 mt-2">
                      Address: {order.customer.address.line1}, {order.customer.address.city}, {order.customer.address.province} {order.customer.address.postalCode}
                    </p>
                  )}
                </div>
                <div className="border-t pt-2 flex justify-between text-sm font-medium">
                  <span>Total:</span>
                  <span className="text-emerald-950">R{order.totals.grandTotal.toLocaleString()}</span>
                </div>
                <div className="mt-4">
                  <h3 className="font-medium text-emerald-950 mb-2">Order Progress:</h3>
                  <div className="flex justify-between text-sm">
                    <span className={`text-${order.status === 'pending' ? 'emerald-600' : 'emerald-900/50'}`}>Pending</span>
                    <span className={`text-${order.status === 'processing' ? 'emerald-600' : 'emerald-900/50'}`}>Processing</span>
                    <span className={`text-${order.status === 'shipped' ? 'emerald-600' : 'emerald-900/50'}`}>Shipped</span>
                    <span className={`text-${order.status === 'delivered' ? 'emerald-600' : 'emerald-900/50'}`}>Delivered</span>
                  </div>
                  <div className="mt-2 h-2 bg-emerald-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-all"
                      style={{
                        width: `${
                          order.status === 'pending' ? '25' :
                          order.status === 'processing' ? '50' :
                          order.status === 'shipped' ? '75' :
                          '100'
                        }%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return <OrderHistoryBody />;
}

// Helper function
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
  const service = SHIPPING_OPTIONS.find(s => s.value === method);
  return service ? service.label : 'Standard';
}