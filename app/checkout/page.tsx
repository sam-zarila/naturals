'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../lib/firebase-client';
import { motion, AnimatePresence } from 'framer-motion';

// Define types
type Product = {
  id: string;
  name: string;
  price: number;
  currency: string;
  img: string;
};

type CartItem = Product & { qty: number };

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

function IconCheckout({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 4h16v2H4V4Zm0 6h16v2H4v-2Zm0 6h16v2H4v-2Z" />
      <path d="M7 15h10" strokeLinecap="round" />
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

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load cart items on component mount
  useEffect(() => {
    loadCartItems();

    // Listen for cart updates
    const handleCartUpdate = () => {
      loadCartItems();
    };
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const loadCartItems = async () => {
    try {
      const userId = localStorage.getItem('cart-user-id');
      if (!userId) {
        setCartItems([]);
        setLoading(false);
        return;
      }

      // Try Firestore first
      const docRef = doc(firestore, `carts/${userId}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const firestoreData = docSnap.data();
        if (firestoreData && Array.isArray(firestoreData.items)) {
          const cartItems = firestoreData.items.map((item: { id: string; qty: number }) => ({
            id: item.id,
            name: `Product ${item.id}`,
            price: item.id === 'growth-100' ? 300 : 260,
            currency: 'R',
            img: '/products/hair-growth-oil-100ml.png',
            qty: item.qty,
          }));
          setCartItems(cartItems);
          // Update localStorage to sync
          localStorage.setItem(`firestore:cart:${userId}`, JSON.stringify({ userId, items: firestoreData.items, updatedAt: Date.now() }));
          localStorage.setItem('dn-cart', JSON.stringify(firestoreData.items));
          setLoading(false);
          return;
        }
      }

      // Fallback to localStorage Firestore structure
      const firestoreData = localStorage.getItem(`firestore:cart:${userId}`);
      if (firestoreData) {
        const parsed = JSON.parse(firestoreData);
        if (parsed && Array.isArray(parsed.items)) {
          const cartItems = parsed.items.map((item: { id: string; qty: number }) => ({
            id: item.id,
            name: `Product ${item.id}`,
            price: item.id === 'growth-100' ? 300 : 260,
            currency: 'R',
            img: '/products/hair-growth-oil-100ml.png',
            qty: item.qty,
          }));
          setCartItems(cartItems);
          setLoading(false);
          return;
        }
      }

      // Fallback to legacy structure
      const legacyData = localStorage.getItem('dn-cart');
      if (legacyData) {
        const items = JSON.parse(legacyData) as Array<{ id: string; qty: number }>;
        const cartItems = items.map((item) => ({
          id: item.id,
          name: `Product ${item.id}`,
          price: item.id === 'growth-100' ? 300 : 260,
          currency: 'R',
          img: '/products/hair-growth-oil-100ml.png',
          qty: item.qty,
        }));
        setCartItems(cartItems);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (id: string, newQty: number) => {
    if (newQty < 1) return;

    const updatedItems = cartItems.map((item) =>
      item.id === id ? { ...item, qty: newQty } : item
    );
    setCartItems(updatedItems);
    saveCart(updatedItems);
  };

  const removeItem = (id: string) => {
    const updatedItems = cartItems.filter((item) => item.id !== id);
    setCartItems(updatedItems);
    saveCart(updatedItems);
  };

  const saveCart = async (items: CartItem[]) => {
    try {
      const userId = localStorage.getItem('cart-user-id');
      if (!userId) return;

      const storedItems = items.map((item) => ({
        id: item.id,
        qty: item.qty,
      }));

      // Save to Firestore
      const docRef = doc(firestore, `carts/${userId}`);
      await setDoc(docRef, { items: storedItems, updatedAt: Date.now() }, { merge: true });

      // Save to localStorage for compatibility
      const firestoreData = { userId, items: storedItems, updatedAt: Date.now() };
      localStorage.setItem(`firestore:cart:${userId}`, JSON.stringify(firestoreData));
      localStorage.setItem('dn-cart', JSON.stringify(storedItems));

      // Dispatch event for other components to sync
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    try {
      const userId = localStorage.getItem('cart-user-id');
      if (userId) {
        localStorage.removeItem(`firestore:cart:${userId}`);
        await setDoc(doc(firestore, `carts/${userId}`), { items: [], updatedAt: Date.now() }, { merge: true });
      }
      localStorage.removeItem('dn-cart');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + ((item.price ?? 0) * item.qty), 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.qty, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-emerald-900 mb-8">Checkout</h1>
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
                  <span className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 text-white px-3 py-1.5 text-sm shadow">
                    <span className="inline-grid place-items-center w-6 h-6 rounded-xl bg-white/20 border border-white/30">
                      <IconCheckout className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-semibold">Checkout</span>
                  </span>
                </li>
              </ol>
            </div>
          </nav>
        </motion.div>

        <h1 className="text-3xl font-bold text-emerald-900 mb-8">Checkout</h1>

        {cartItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl p-8 text-center shadow-sm border border-emerald-100"
          >
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold text-emerald-900 mb-4">Your Cart is Empty</h2>
            <p className="text-emerald-700 mb-6">Explore our products and add something special to your cart!</p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-full px-6 py-3 bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition shadow-md"
            >
              Shop Now
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden"
              >
                <AnimatePresence>
                  {cartItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="p-4 sm:p-6 flex items-center gap-4 border-b border-emerald-100 last:border-b-0"
                    >
                      <Image
                        src={item.img}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="rounded-xl object-contain border border-emerald-100"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-emerald-900 text-lg">{item.name}</h3>
                        <p className="text-emerald-700">
                          {item.currency} {(item.price ?? 0).toLocaleString('en-ZA')}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center rounded-xl border border-emerald-200 bg-white shadow-sm">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => updateQuantity(item.id, item.qty - 1)}
                            className="w-10 h-10 flex items-center justify-center text-emerald-700 hover:bg-emerald-50 transition"
                            disabled={item.qty <= 1}
                            aria-label="Decrease quantity"
                          >
                            −
                          </motion.button>
                          <span className="w-12 h-10 flex items-center justify-center text-emerald-900 font-medium">
                            {item.qty}
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => updateQuantity(item.id, item.qty + 1)}
                            className="w-10 h-10 flex items-center justify-center text-emerald-700 hover:bg-emerald-50 transition"
                            aria-label="Increase quantity"
                          >
                            +
                          </motion.button>
                        </div>
                        <div className="w-20 text-right font-semibold text-emerald-900">
                          {item.currency} {((item.price ?? 0) * item.qty).toLocaleString('en-ZA')}
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeItem(item.id)}
                          className="w-10 h-10 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-full transition"
                          title="Remove item"
                          aria-label="Remove item"
                        >
                          ×
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Cart Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 sticky top-4"
            >
              <h2 className="text-xl font-semibold text-emerald-900 mb-4">Order Summary</h2>
              <div className="flex justify-between items-center mb-4">
                <span className="text-emerald-700">Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'}):</span>
                <span className="text-lg font-semibold text-emerald-900">
                  R {subtotal.toLocaleString('en-ZA')}
                </span>
              </div>
              <div className="border-t border-emerald-100 pt-4 mb-4">
                <p className="text-sm text-emerald-600 flex items-center gap-2">
                  <span className="text-base">🚚</span> Free shipping on orders over R500
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={clearCart}
                  className="w-full py-3 px-6 border border-emerald-200 text-emerald-700 rounded-full hover:bg-emerald-50 transition font-medium"
                >
                  Clear Cart
                </motion.button>
                <Link
                  href="/checkout"
                  className="w-full py-3 px-6 bg-emerald-600 text-white text-center rounded-full hover:bg-emerald-700 transition font-medium shadow-md"
                >
                  Proceed to Checkout
                </Link>
              </div>
              <div className="mt-4 text-center">
                <Link
                  href="/shop"
                  className="text-emerald-600 hover:text-emerald-700 underline text-sm"
                >
                  Continue Shopping
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}