'use client';

import React, { JSX, useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { doc, getDoc, setDoc, collection, addDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, User } from "firebase/auth";
import { v4 as uuidv4 } from "uuid";
import { firestore } from "../lib/firebase-client";

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
   Types
============================================================================ */
type Product = {
  id: string;
  name: string;
  price: number;
  currency: "R";
  img: string;
};

type StoredCartItem = { id: string; qty: number };

type ExpandedLine = Product & {
  qty: number;
  lineTotal: number;
};

interface CheckoutPayload {
  orderId?: string;
  email: string;
  amountZar: number;
  name?: string;
  phone?: string;
  cart?: Array<{ id: string; name: string; price: number; qty: number }>;
};

interface PaystackInitResponse {
  authorization_url: string;
  reference: string;
}

/* ============================================================================
   Catalog
============================================================================ */
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
   Firestore and LocalStorage Helpers
============================================================================ */
const USER_ID_KEY = "cart-user-id";
const CART_PATH = (userId: string) => `carts/${userId}`;

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

async function readCart(userId: string): Promise<StoredCartItem[]> {
  try {
    const docRef = doc(firestore, CART_PATH(userId));
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? parseCart(docSnap.data().items) : [];
  } catch (err) {
    console.error("Error reading cart:", err);
    throw err;
  }
}

async function writeCart(userId: string, items: StoredCartItem[]): Promise<void> {
  try {
    const docRef = doc(firestore, CART_PATH(userId));
    const docSnap = await getDoc(docRef);

    // Start with any token already in localStorage (may be null)
    let token = localStorage.getItem("cart-token");

    // Prefer token from Firestore if present, otherwise keep local token
    let tokenFromDoc: unknown = null;
    if (docSnap.exists()) {
      const data = docSnap.data();
      tokenFromDoc = (data as any).token ?? null;
    }

    // Resolve a final string token (guaranteed non-null)
    const resolvedToken = tokenFromDoc ? String(tokenFromDoc) : token ?? uuidv4();

    // Persist resolved token to localStorage and Firestore
    localStorage.setItem("cart-token", resolvedToken);
    await setDoc(docRef, { items, updatedAt: Date.now(), token: resolvedToken }, { merge: true });
  } catch (err) {
    console.error("Error writing cart:", err);
    throw err;
  }
}

// Function to clear cart after successful checkout
async function clearCartAfterCheckout(userId: string): Promise<void> {
  try {
    const docRef = doc(firestore, CART_PATH(userId));
    let token: string | null = localStorage.getItem("cart-token");
    
    if (!token) {
      token = uuidv4();
      localStorage.setItem("cart-token", token);
    }
    
    await setDoc(docRef, { items: [], updatedAt: Date.now(), token }, { merge: true });
    
    // Also update localStorage to reflect empty cart
    if (typeof window !== "undefined") {
      const event = new CustomEvent("cartUpdated", { detail: { items: [] } });
      window.dispatchEvent(event);
    }
  } catch (err) {
    console.error("Error clearing cart after checkout:", err);
    throw err;
  }
}

/* ============================================================================
   Shipping Options
============================================================================ */
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
] as const;

/* ============================================================================
   South African Provinces
============================================================================ */
const PROVINCES = [
  { value: "eastern-cape", label: "Eastern Cape" },
  { value: "free-state", label: "Free State" },
  { value: "gauteng", label: "Gauteng" },
  { value: "kwa-zulu-natal", label: "KwaZulu-Natal" },
  { value: "limpopo", label: "Limpopo" },
  { value: "mpumalanga", label: "Mpumalanga" },
  { value: "northern-cape", label: "Northern Cape" },
  { value: "north-west", label: "North West" },
  { value: "western-cape", label: "Western Cape" },
] as const;

/* ============================================================================
   Auth Modal Component - Non-dismissible
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAuth();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      // Remove backdrop click handler to prevent closing
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
          {/* Remove close button to prevent closing without authentication */}
        </div>
        <p className="text-emerald-900/70 mb-6">
          You must {isLogin ? "log in" : "sign up"} to proceed with checkout and track your orders.
        </p>
        <div className="space-y-4" onKeyPress={handleKeyPress}>
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
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-neutral-500">Or continue with</span>
            </div>
          </div>
          <button
            onClick={handleGoogle}
            disabled={authLoading}
            className="w-full rounded-2xl px-6 py-3 border border-neutral-200 text-emerald-950 hover:bg-emerald-50 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Log in with Google
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ============================================================================
   Checkout Component - Enforces Authentication
============================================================================ */
function CheckoutBody(): JSX.Element {
  const auth = getAuth(firestore.app);
  const { toast, toasts } = useToast();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<StoredCartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [payLoading, setPayLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Form handling
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    province: "",
    postalCode: "",
    notes: "",
    shippingMethod: "",
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof typeof formData, string>>>({});

  // Shipping cost (fixed for small packages in SA)
  const shipping = formData.shippingMethod === "self-pickup" ? 0 : 100;
  const getShippingLabel = (method: string) => {
    const service = SHIPPING_OPTIONS.find(s => s.value === method);
    return service ? service.label : 'Standard';
  };

  // Initialize auth state and enforce authentication
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      let localId = localStorage.getItem(USER_ID_KEY);
      
      if (!user) {
        // No user is authenticated - show auth modal and prevent proceeding
        setShowAuthModal(true);
        setAuthChecked(true);
        setLoading(false);
        return;
      }

      // User is authenticated - proceed with cart operations
      if (!localId) {
        localId = uuidv4();
        localStorage.setItem(USER_ID_KEY, localId);
      }
      
      let id = user.uid;
      
      try {
        // Merge carts if necessary
        if (user.uid !== localId) {
          const anonItems = await readCart(localId);
          const authItems = await readCart(user.uid);
          const mergedMap = new Map<string, StoredCartItem>();
          [...authItems, ...anonItems].forEach((item) => {
            const existing = mergedMap.get(item.id);
            if (existing) {
              existing.qty += item.qty;
            } else {
              mergedMap.set(item.id, { ...item });
            }
          });
          const merged = Array.from(mergedMap.values());
          await writeCart(user.uid, merged);
          await writeCart(localId, []);
          localStorage.setItem(USER_ID_KEY, user.uid);
          setItems(merged);
        } else {
          const cartItems = await readCart(user.uid);
          setItems(cartItems);
        }

        // Prefill form data from user profile
        const displayName = user.displayName || "";
        const [firstName, ...lastParts] = displayName.split(" ");
        const lastName = lastParts.join(" ");
        const phone = user.phoneNumber || "";
        setFormData((prev) => ({
          ...prev,
          firstName: prev.firstName || firstName,
          lastName: prev.lastName || lastName,
          email: prev.email || user.email || "",
          phone: prev.phone || phone,
        }));

        setUserId(id);
        setShowAuthModal(false);
      } catch (err) {
        console.error("Cart operation error:", err);
        toast({
          title: "Error",
          description: "Failed to load cart.",
          variant: "destructive",
        });
      } finally {
        setAuthChecked(true);
        setLoading(false);
      }
    });
    
    return unsubscribe;
  }, [toast]);

  // Listen for cart updates from other components
  useEffect(() => {
    const handleCartUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ items: StoredCartItem[] }>;
      if (customEvent.detail && Array.isArray(customEvent.detail.items)) {
        setItems(customEvent.detail.items);
      }
    };
    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
    };
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

  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + l.lineTotal, 0), [lines]);
  const grandTotal = subtotal + shipping;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errors: Partial<Record<keyof typeof formData, string>> = {};
    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email))
      errors.email = "Valid email is required";
    if (!formData.phone.trim() || !/^\d{10,}$/.test(formData.phone))
      errors.phone = "Valid phone number is required (10+ digits)";
    if (!formData.shippingMethod) errors.shippingMethod = "Shipping method is required";
    if (formData.shippingMethod !== "self-pickup") {
      if (!formData.address1.trim()) errors.address1 = "Address is required";
      if (!formData.city.trim()) errors.city = "City is required";
      if (!formData.province) errors.province = "Province is required";
      if (!formData.postalCode.trim()) errors.postalCode = "Postal code is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Payment handler - requires authentication
  const onPay = useCallback(async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      toast({
        title: "Authentication Required",
        description: "Please log in to complete your purchase.",
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!userId) {
      toast({
        title: "Error",
        description: "User not identified.",
        variant: "destructive",
      });
      return;
    }

    setPayLoading(true);
    try {
      // Create order in Firestore
      const ordersRef = collection(firestore, "orders");
      const orderData = {
        userId,
        items,
        totals: {
          subtotal,
          shipping,
          grandTotal,
        },
        status: "pending",
        customer: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          shipping: formData.shippingMethod === "self-pickup" ? "self-pickup" : "courier",
          address: formData.shippingMethod !== "self-pickup" ? {
            line1: formData.address1,
            line2: formData.address2 || "",
            city: formData.city,
            province: formData.province,
            postalCode: formData.postalCode,
          } : null,
          notes: formData.notes || "",
        },
        shippingMethod: formData.shippingMethod,
        createdAt: new Date(),
      };
      
      const orderDoc = await addDoc(ordersRef, orderData);
      const orderId = orderDoc.id;

      // Show feedback after order creation
      toast({
        title: "Order Created",
        description: "Redirecting to payment...",
      });

      const payload: CheckoutPayload = {
        orderId,
        email: formData.email,
        amountZar: grandTotal,
        name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        cart: lines.map(({ id, name, price, qty }) => ({ id, name, price, qty })),
      };

      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        let errorText = '';
        try {
          errorText = await res.text();
        } catch {
          errorText = 'No response text';
        }
        throw new Error(`Payment initiation failed: ${res.status} - ${errorText || 'Unknown error'}`);
      }

      const data: PaystackInitResponse = await res.json();

      // Clear the cart before redirecting to payment
      await clearCartAfterCheckout(userId);
      
      toast({
        title: "Cart Cleared",
        description: "Your cart has been cleared. Redirecting to payment...",
      });

      // Redirect to Paystack authorization URL
      window.location.href = data.authorization_url;
    } catch (err) {
      console.error("onPay error:", err);
      const message = err instanceof Error ? err.message : "Payment error";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setPayLoading(false);
    }
  }, [currentUser, userId, items, lines, subtotal, shipping, grandTotal, formData, toast]);

  // Show loading state
  if (loading) {
    return (
      <main className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-emerald-900">Loading checkout...</p>
        </div>
      </main>
    );
  }

  // Show authentication required state
  if (!currentUser && authChecked) {
    return (
      <main className="bg-white min-h-screen">
        <ToastComponent toasts={toasts} />
        <AnimatePresence>
          {showAuthModal && <AuthModal onClose={() => {}} />}
        </AnimatePresence>
        
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
              <span className="font-semibold text-emerald-900">Delightful Naturals</span>
            </Link>
            <Link href="/cart" className="text-sm text-emerald-700 hover:underline">
              Back to cart
            </Link>
          </div>
        </div>

        {/* Authentication Required Message */}
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 max-w-md mx-auto">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h2 className="text-2xl font-bold text-amber-900 mb-2">Authentication Required</h2>
            <p className="text-amber-800 mb-6">
              Please log in or create an account to proceed with your purchase.
            </p>
            <p className="text-sm text-amber-700 mb-4">
              The authentication modal should appear automatically. If it does not, please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-amber-700 hover:underline"
            >
              Refresh page
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Normal checkout flow for authenticated users
  return (
    <main className="bg-white min-h-screen">
      <ToastComponent toasts={toasts} />
      <AnimatePresence>
        {showAuthModal && <AuthModal onClose={() => {}} />}
      </AnimatePresence>
      
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
            <span className="font-semibold text-emerald-900">Delightful Naturals</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-emerald-700">
              Welcome, {currentUser?.displayName || currentUser?.email}
            </span>
            <Link href="/cart" className="text-sm text-emerald-700 hover:underline">
              Back to cart
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12 grid lg:grid-cols-5 gap-8">
        {/* Left: Form */}
        <section className="lg:col-span-3">
          <h1 className="text-3xl font-bold text-emerald-950">Checkout</h1>
          <p className="text-emerald-900/70 mt-1">Enter your details to complete your order.</p>
          <div className="mt-2 flex items-center gap-2 text-sm text-emerald-700">
            <span className="inline-grid place-items-center w-5 h-5 rounded-full bg-emerald-100">
              ✓
            </span>
            Authenticated as {currentUser?.email}
          </div>

          <div className="mt-4 rounded-2xl border bg-white shadow-sm p-4 sm:p-5">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-emerald-950">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-xl border ${
                      formErrors.firstName ? "border-red-500" : "border-neutral-200"
                    } p-2 text-sm`}
                    placeholder="Enter your first name"
                  />
                  {formErrors.firstName && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-emerald-950">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-xl border ${
                      formErrors.lastName ? "border-red-500" : "border-neutral-200"
                    } p-2 text-sm`}
                    placeholder="Enter your last name"
                  />
                  {formErrors.lastName && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.lastName}</p>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-emerald-950">
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-xl border ${
                    formErrors.email ? "border-red-500" : "border-neutral-200"
                  } p-2 text-sm`}
                  placeholder="Enter your email"
                />
                {formErrors.email && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>
                )}
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-emerald-950">
                  Phone *
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-xl border ${
                    formErrors.phone ? "border-red-500" : "border-neutral-200"
                  } p-2 text-sm`}
                  placeholder="Enter your phone number"
                />
                {formErrors.phone && <p className="mt-1 text-xs text-red-600">{formErrors.phone}</p>}
              </div>
              <div>
                <label htmlFor="shippingMethod" className="block text-sm font-medium text-emerald-950">
                  Shipping Method *
                </label>
                <select
                  id="shippingMethod"
                  name="shippingMethod"
                  value={formData.shippingMethod}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-xl border ${
                    formErrors.shippingMethod ? "border-red-500" : "border-neutral-200"
                  } p-2 text-sm`}
                >
                  <option value="">Select shipping method</option>
                  {SHIPPING_OPTIONS.map((service) => (
                    <option key={service.value} value={service.value}>
                      {service.label}
                    </option>
                  ))}
                </select>
                {formErrors.shippingMethod && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.shippingMethod}</p>
                )}
              </div>
              {formData.shippingMethod === "self-pickup" && (
                <div className="p-4 rounded-lg bg-emerald-50 text-emerald-800 text-sm">
                  Self pickup is available at our store in Johannesburg. Please contact us for the exact address and pickup times.
                </div>
              )}
              {formData.shippingMethod && formData.shippingMethod !== "self-pickup" && (
                <>
                  <div>
                    <label htmlFor="address1" className="block text-sm font-medium text-emerald-950">
                      Address Line 1 *
                    </label>
                    <input
                      id="address1"
                      name="address1"
                      type="text"
                      value={formData.address1}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full rounded-xl border ${
                        formErrors.address1 ? "border-red-500" : "border-neutral-200"
                      } p-2 text-sm`}
                      placeholder="Enter your street address"
                    />
                    {formErrors.address1 && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.address1}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="address2" className="block text-sm font-medium text-emerald-950">
                      Address Line 2 (Optional)
                    </label>
                    <input
                      id="address2"
                      name="address2"
                      type="text"
                      value={formData.address2}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-xl border border-neutral-200 p-2 text-sm"
                      placeholder="Apartment, suite, unit, etc."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-emerald-950">
                        City *
                      </label>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        value={formData.city}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full rounded-xl border ${
                          formErrors.city ? "border-red-500" : "border-neutral-200"
                        } p-2 text-sm`}
                        placeholder="Enter your city"
                      />
                      {formErrors.city && <p className="mt-1 text-xs text-red-600">{formErrors.city}</p>}
                    </div>
                    <div>
                      <label htmlFor="province" className="block text-sm font-medium text-emerald-950">
                        Province *
                      </label>
                      <select
                        id="province"
                        name="province"
                        value={formData.province}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full rounded-xl border ${
                          formErrors.province ? "border-red-500" : "border-neutral-200"
                        } p-2 text-sm`}
                      >
                        <option value="">Select province</option>
                        {PROVINCES.map((prov) => (
                          <option key={prov.value} value={prov.value}>
                            {prov.label}
                          </option>
                        ))}
                      </select>
                      {formErrors.province && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.province}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-emerald-950">
                      Postal Code *
                    </label>
                    <input
                      id="postalCode"
                      name="postalCode"
                      type="text"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full rounded-xl border ${
                        formErrors.postalCode ? "border-red-500" : "border-neutral-200"
                      } p-2 text-sm`}
                      placeholder="Enter your postal code"
                    />
                    {formErrors.postalCode && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.postalCode}</p>
                    )}
                  </div>
                </>
              )}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-emerald-950">
                  Order Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-xl border border-neutral-200 p-2 text-sm"
                  rows={3}
                  placeholder="Any special instructions for your order..."
                />
              </div>
            </div>
          </div>
        </section>

        {/* Right: Summary */}
        <aside className="lg:col-span-2">
          <div className="rounded-2xl border bg-white shadow-sm p-4 sm:p-5 sticky top-4">
            <div className="font-semibold text-emerald-950">Order Summary</div>
            <div className="mt-3 space-y-2 text-sm">
              {lines.map((line) => (
                <div key={line.id} className="flex items-center justify-between">
                  <div className="text-emerald-900/80">
                    {line.name} × {line.qty}
                  </div>
                  <div className="text-emerald-950">R{line.lineTotal.toLocaleString()}</div>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <div className="text-emerald-900/80">Subtotal</div>
                <div className="text-emerald-950">R{subtotal.toLocaleString()}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-emerald-900/80">
                  Shipping ({getShippingLabel(formData.shippingMethod)})
                </div>
                <div className="text-emerald-950">R{shipping.toLocaleString()}</div>
              </div>
              <div className="border-t pt-2 flex items-center justify-between">
                <div className="font-semibold text-emerald-950">Estimated Total</div>
                <div className="font-bold text-emerald-950 text-lg">
                  R{grandTotal.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={onPay}
                disabled={payLoading}
                className="relative inline-flex items-center justify-center rounded-2xl px-6 py-3 bg-emerald-600 text-white font-medium shadow hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {payLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  "Pay Now"
                )}
              </button>
              <Link
                href="/cart"
                className="inline-flex items-center justify-center rounded-2xl px-6 py-3 border border-neutral-200 text-emerald-950 hover:bg-emerald-50 transition-colors"
              >
                Back to Cart
              </Link>
            </div>
            <div className="mt-3 text-xs text-emerald-900/70 flex items-center gap-2">
              <span className="inline-grid place-items-center w-6 h-6 rounded-full bg-emerald-100 border">
                🔒
              </span>
              Secure checkout via Paystack (ZAR)
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

/* Export default */
export default function CheckoutPage() {
  return <CheckoutBody />;
}