'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { firestore } from '../lib/firebase-client';
import { motion, AnimatePresence } from 'framer-motion';

// Icon Components (same as before)
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

// Define types
type Product = {
  id: string;
  name: string;
  price: number;
  currency: string;
  img: string;
};

type OrderItem = {
  id: string;
  qty: number;
  name?: string;
  price?: number;
};

type Order = {
  id: string;
  userId: string;
  items: OrderItem[];
  totals: {
    subtotal: number;
    shipping: number;
    grandTotal: number;
  };
  status: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    shipping: string;
    address: any;
    notes: string;
  };
  shippingMethod: string;
  createdAt: any;
};

// Fixed CATALOG with index signature
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

// Helper function to safely get product from catalog
const getProduct = (id: string): Product | null => {
  return CATALOG[id] || null;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const auth = getAuth(firestore.app);

  // Load user orders
  const loadOrders = async (user: User | null) => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      const ordersRef = collection(firestore, 'orders');
      const q = query(
        ordersRef, 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const userOrders: Order[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        userOrders.push({
          id: doc.id,
          ...data
        } as Order);
      });
      
      setOrders(userOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Initialize auth state and load orders
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      await loadOrders(user);
    });
    return unsubscribe;
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-emerald-900 mb-8">My Orders</h1>
          <div className="animate-pulse">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100">
              <div className="h-4 bg-emerald-100 rounded w-1/4 mb-4"></div>
              <div className="h-20 bg-emerald-100 rounded mb-4"></div>
              <div className="h-20 bg-emerald-100 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-12">
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

          <h1 className="text-3xl font-bold text-emerald-900 mb-8">My Orders</h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl p-8 text-center shadow-sm border border-emerald-100"
          >
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-semibold text-emerald-900 mb-4">Authentication Required</h2>
            <p className="text-emerald-700 mb-6">Please log in to view your order history.</p>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center rounded-full px-6 py-3 bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition shadow-md"
            >
              Log In to Continue
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-12">
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

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-900">My Orders</h1>
          {currentUser && (
            <div className="text-sm text-emerald-700">
              Welcome, {currentUser.displayName || currentUser.email}
            </div>
          )}
        </div>

        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl p-8 text-center shadow-sm border border-emerald-100"
          >
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-semibold text-emerald-900 mb-4">No Orders Yet</h2>
            <p className="text-emerald-700 mb-6">You have not placed any orders yet. Start shopping to see your order history here!</p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-full px-6 py-3 bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition shadow-md"
            >
              Start Shopping
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden"
              >
                <div className="p-6 border-b border-emerald-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-emerald-900 text-lg">
                        Order #{order.id.slice(-8).toUpperCase()}
                      </h3>
                      <p className="text-emerald-700 text-sm">
                        Placed on {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <span className="text-lg font-semibold text-emerald-900">
                        R {order.totals.grandTotal.toLocaleString('en-ZA')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Order Items */}
                    <div className="lg:col-span-2">
                      <h4 className="font-medium text-emerald-900 mb-4">Order Items</h4>
                      <ul className="space-y-2">
                        {order.items.map((item: OrderItem) => {
                          // FIXED: Use the helper function to safely get product
                          const product = getProduct(item.id);
                          return (
                            <li key={item.id} className="flex justify-between text-sm text-emerald-900/80">
                              <span>{product ? product.name : 'Unknown Product'} × {item.qty}</span>
                              <span>R{((product?.price ?? 0) * item.qty).toLocaleString('en-ZA')}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {/* Order Details */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-emerald-900 mb-2">Shipping Details</h4>
                        <div className="text-sm text-emerald-700 space-y-1">
                          <p>{order.customer.name}</p>
                          <p>{order.customer.email}</p>
                          <p>{order.customer.phone}</p>
                          {order.customer.address && (
                            <>
                              <p>{order.customer.address.line1}</p>
                              {order.customer.address.line2 && <p>{order.customer.address.line2}</p>}
                              <p>{order.customer.address.city}, {order.customer.address.province}</p>
                              <p>{order.customer.address.postalCode}</p>
                            </>
                          )}
                          {order.shippingMethod === 'self-pickup' && (
                            <p className="font-medium">Self Pickup</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-emerald-900 mb-2">Order Summary</h4>
                        <div className="text-sm text-emerald-700 space-y-1">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>R {order.totals.subtotal.toLocaleString('en-ZA')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Shipping:</span>
                            <span>R {order.totals.shipping.toLocaleString('en-ZA')}</span>
                          </div>
                          <div className="flex justify-between font-semibold border-t border-emerald-100 pt-1">
                            <span>Total:</span>
                            <span>R {order.totals.grandTotal.toLocaleString('en-ZA')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {order.customer.notes && (
                    <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
                      <h4 className="font-medium text-emerald-900 mb-2">Order Notes</h4>
                      <p className="text-sm text-emerald-700">{order.customer.notes}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}