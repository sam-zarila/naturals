'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { firestore } from '../lib/firebase-client';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

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

// Toast Hook and Component
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

// Auth Modal Component
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
            {isLogin ? "Log In Required" : "Sign Up Required"}
          </h2>
        </div>
        <p className="text-emerald-900/70 mb-6">
          You must {isLogin ? "log in" : "sign up"} to view your cart and orders.
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
              placeholder="Enter your email"
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
              placeholder="Enter your password"
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

// Define types
type Product = {
  id: string;
  name: string;
  price: number;
  currency: string;
  img: string;
};

type CartItem = Product & { qty: number };

// Catalog
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

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const { toast, toasts } = useToast();
  const auth = getAuth(firestore.app);

  // Firestore and LocalStorage Helpers
  const USER_ID_KEY = "cart-user-id";
  const CART_PATH = (userId: string) => `carts/${userId}`;

  function getUserId(): string | null {
    if (currentUser) return currentUser.uid;
    return localStorage.getItem(USER_ID_KEY);
  }

  function parseCart(raw: unknown): Array<{ id: string; qty: number }> {
    if (!Array.isArray(raw)) return [];
    const valid: Array<{ id: string; qty: number }> = [];
    for (const item of raw) {
      if (
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        "qty" in item &&
        typeof item.id === "string" &&
        typeof item.qty === "number" &&
        item.qty > 0
      ) {
        valid.push({ id: item.id, qty: Math.floor(item.qty) });
      }
    }
    return valid;
  }

  async function readCart(userId: string): Promise<Array<{ id: string; qty: number }>> {
    try {
      const docRef = doc(firestore, CART_PATH(userId));
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? parseCart(docSnap.data().items) : [];
    } catch (err) {
      console.error("Error reading cart:", err);
      toast({ title: "Error", description: "Failed to load cart.", variant: "destructive" });
      return [];
    }
  }

  async function writeCart(userId: string, items: Array<{ id: string; qty: number }>): Promise<void> {
    try {
      const docRef = doc(firestore, CART_PATH(userId));
      await setDoc(docRef, { items, updatedAt: Date.now() }, { merge: true });
    } catch (err) {
      console.error("Error writing cart:", err);
      toast({ title: "Error", description: "Failed to save cart.", variant: "destructive" });
    }
  }

  const loadCartItems = async (user: User | null) => {
    setLoading(true);
    try {
      if (!user) {
        // No user - show auth modal
        setShowAuthModal(true);
        setCartItems([]);
        setAuthChecked(true);
        setLoading(false);
        return;
      }

      const userId = user.uid;
      const storedItems = await readCart(userId);

      // Check if there's an anonymous cart to merge
      const anonUserId = localStorage.getItem(USER_ID_KEY);
      if (anonUserId && anonUserId !== user.uid) {
        const anonItems = await readCart(anonUserId);
        const mergedMap = new Map<string, { id: string; qty: number }>();
        
        // Add authenticated user's items
        storedItems.forEach((item) => {
          mergedMap.set(item.id, { ...item });
        });
        
        // Merge anonymous items
        anonItems.forEach((item) => {
          const existing = mergedMap.get(item.id);
          if (existing) {
            existing.qty += item.qty;
          } else {
            mergedMap.set(item.id, { ...item });
          }
        });
        
        const mergedItems = Array.from(mergedMap.values());
        await writeCart(user.uid, mergedItems);
        await writeCart(anonUserId, []); // Clear anonymous cart
        localStorage.setItem(USER_ID_KEY, user.uid);
        
        setCartItems(mergedItems.map((item) => ({
          ...CATALOG[item.id] || { 
            id: item.id, 
            name: `Product ${item.id}`, 
            price: item.id === 'growth-100' ? 300 : 260, 
            currency: 'R', 
            img: '/products/hair-growth-oil-100ml.png' 
          },
          qty: item.qty,
        })));
      } else {
        const cartItems = storedItems.map((item) => ({
          ...CATALOG[item.id] || { 
            id: item.id, 
            name: `Product ${item.id}`, 
            price: item.id === 'growth-100' ? 300 : 260, 
            currency: 'R', 
            img: '/products/hair-growth-oil-100ml.png' 
          },
          qty: item.qty,
        }));
        setCartItems(cartItems);
      }
      
      setShowAuthModal(false);
    } catch (error) {
      console.error('Error loading cart:', error);
      setCartItems([]);
      toast({ title: "Error", description: "Failed to load cart.", variant: "destructive" });
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  };

  // Initialize auth state and load cart
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      await loadCartItems(user);
    });
    return unsubscribe;
  }, []);

  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      loadCartItems(currentUser);
    };
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [currentUser]);

  const updateQuantity = (id: string, newQty: number) => {
    if (!currentUser) {
      setShowAuthModal(true);
      toast({ 
        title: "Authentication Required", 
        description: "Please log in to modify your cart.", 
        variant: "destructive" 
      });
      return;
    }

    if (newQty < 1) return;

    const updatedItems = cartItems.map((item) =>
      item.id === id ? { ...item, qty: newQty } : item
    );
    setCartItems(updatedItems);
    saveCart(updatedItems);
  };

  const removeItem = (id: string) => {
    if (!currentUser) {
      setShowAuthModal(true);
      toast({ 
        title: "Authentication Required", 
        description: "Please log in to modify your cart.", 
        variant: "destructive" 
      });
      return;
    }

    const updatedItems = cartItems.filter((item) => item.id !== id);
    setCartItems(updatedItems);
    saveCart(updatedItems);
  };

  const saveCart = async (items: CartItem[]) => {
    if (!currentUser) {
      toast({ 
        title: "Authentication Required", 
        description: "Please log in to save your cart.", 
        variant: "destructive" 
      });
      return;
    }

    try {
      const userId = currentUser.uid;
      const storedItems = items.map((item) => ({
        id: item.id,
        qty: item.qty,
      }));
      await writeCart(userId, storedItems);
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error saving cart:', error);
      toast({ title: "Error", description: "Failed to save cart.", variant: "destructive" });
    }
  };

  const clearCart = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      toast({ 
        title: "Authentication Required", 
        description: "Please log in to clear your cart.", 
        variant: "destructive" 
      });
      return;
    }

    setCartItems([]);
    try {
      const userId = currentUser.uid;
      await writeCart(userId, []);
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast({ title: "Error", description: "Failed to clear cart.", variant: "destructive" });
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + ((item.price ?? 0) * item.qty), 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.qty, 0);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-emerald-900 mb-8">Cart</h1>
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

  // Show authentication required state
  if (!currentUser && authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-12">
        <ToastComponent toasts={toasts} />
        <AnimatePresence>
          {showAuthModal && <AuthModal onClose={() => {}} />}
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
                  <li aria-current="page">
                    <span
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 text-white px-3 py-1.5 text-sm shadow"
                    >
                      <span className="inline-grid place-items-center w-6 h-6 rounded-xl bg-white/20 border border-white/30">
                        <IconCart className="w-3.5 h-3.5" />
                      </span>
                      <span className="font-semibold">Cart</span>
                    </span>
                  </li>
                </ol>
              </div>
            </nav>
          </motion.div>

          <h1 className="text-3xl font-bold text-emerald-900 mb-8">Cart</h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl p-8 text-center shadow-sm border border-emerald-100"
          >
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-semibold text-emerald-900 mb-4">Authentication Required</h2>
            <p className="text-emerald-700 mb-6">Please log in to view and manage your cart.</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="inline-flex items-center justify-center rounded-full px-6 py-3 bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition shadow-md"
            >
              Log In to Continue
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Normal cart page for authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-12">
      <ToastComponent toasts={toasts} />
      <AnimatePresence>
        {showAuthModal && <AuthModal onClose={() => {}} />}
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
                <li aria-current="page">
                  <span
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 text-white px-3 py-1.5 text-sm shadow"
                  >
                    <span className="inline-grid place-items-center w-6 h-6 rounded-xl bg-white/20 border border-white/30">
                      <IconCart className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-semibold">Cart</span>
                  </span>
                </li>
                <li aria-hidden className="px-1 text-emerald-700/60">
                  <IconChevron className="w-4 h-4" />
                </li>
                <li>
                  <Link
                    href="/orders"
                    className="group inline-flex items-center gap-2 rounded-2xl border bg-white px-3 py-1.5 text-sm text-emerald-900 shadow-sm hover:-translate-y-0.5 hover:shadow transition"
                  >
                    <span className="inline-grid place-items-center w-6 h-6 rounded-xl bg-emerald-100 text-emerald-700 border">
                      <IconOrders className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-medium">My Orders</span>
                  </Link>
                </li>
              </ol>
            </div>
          </nav>
        </motion.div>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-900">Cart</h1>
          {currentUser && (
            <div className="text-sm text-emerald-700">
              Welcome, {currentUser.displayName || currentUser.email}
            </div>
          )}
        </div>

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