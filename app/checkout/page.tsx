'use client';

import React, { JSX, useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { doc, getDoc, setDoc, collection, addDoc, updateDoc } from "firebase/firestore";
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
}

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
    
    console.log('clearCartAfterCheckout: userId:', userId, 'token:', token);
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
   Courier Services
============================================================================ */
const COURIER_SERVICES = [
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
   Checkout Component
============================================================================ */
function CheckoutBody(): JSX.Element {
  const { toast, toasts } = useToast();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<StoredCartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [payLoading, setPayLoading] = useState(false);

  // Shipping cost (fixed for small packages in SA)
  const shipping = 100;
  const getShippingLabel = (method: string) => {
    const service = COURIER_SERVICES.find(s => s.value === method);
    return service ? service.label : 'Standard';
  };

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
        console.error("Cart load error:", err);
        toast({
          title: "Error",
          description: `Failed to load cart: ${err instanceof Error ? err.message : "Unknown error"}`,
          variant: "destructive",
        });
        setLoading(false);
      });
  }, [toast]);

  // Listen for cart updates from other components
  useEffect(() => {
    const handleCartUpdate = (event: CustomEvent) => {
      if (event.detail && Array.isArray(event.detail.items)) {
        setItems(event.detail.items);
      }
    };

    window.addEventListener("cartUpdated", handleCartUpdate as EventListener);
    
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate as EventListener);
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
    if (!formData.address1.trim()) errors.address1 = "Address is required";
    if (!formData.city.trim()) errors.city = "City is required";
    if (!formData.province) errors.province = "Province is required";
    if (!formData.postalCode.trim()) errors.postalCode = "Postal code is required";
    if (!formData.shippingMethod) errors.shippingMethod = "Shipping method is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Payment handler
  const onPay = useCallback(async () => {
    if (!validateForm()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!userId || !items.length) {
      toast({
        title: "Error",
        description: "Cart is empty or user not identified.",
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
          shipping: "courier",
          address: {
            line1: formData.address1,
            line2: formData.address2 || "",
            city: formData.city,
            province: formData.province,
            postalCode: formData.postalCode,
          },
          notes: formData.notes || "",
        },
        shippingMethod: formData.shippingMethod,
        createdAt: new Date(),
      };
      
      console.log("Creating order:", orderData);
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
        console.error('API Error Response:', errorText);
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
  }, [userId, items, lines, subtotal, shipping, grandTotal, formData, toast]);

  // Check if cart is empty
  useEffect(() => {
    if (items.length === 0 && !loading) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checkout.",
        variant: "destructive",
      });
      // Redirect to shop after a short delay
      const timer = setTimeout(() => {
        router.push("/shop");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [items, loading, toast, router]);

  if (loading) {
    return (
      <main className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">Loading checkout...</div>
      </main>
    );
  }

  if (items.length === 0 && !loading) {
    return (
      <main className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">Your cart is empty</div>
          <Link href="/shop" className="text-emerald-700 underline">
            Continue shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-white min-h-screen">
      <ToastComponent toasts={toasts} />
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

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12 grid lg:grid-cols-5 gap-8">
        {/* Left: Form */}
        <section className="lg:col-span-3">
          <h1 className="text-3xl font-bold text-emerald-950">Checkout</h1>
          <p className="text-emerald-900/70 mt-1">Enter your details to complete your order.</p>

          <div className="mt-4 rounded-2xl border bg-white shadow-sm p-4 sm:p-5">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-emerald-950">
                    First Name
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
                  />
                  {formErrors.firstName && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-emerald-950">
                    Last Name
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
                  />
                  {formErrors.lastName && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.lastName}</p>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-emerald-950">
                  Email
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
                />
                {formErrors.email && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>
                )}
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-emerald-950">
                  Phone
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
                />
                {formErrors.phone && <p className="mt-1 text-xs text-red-600">{formErrors.phone}</p>}
              </div>
              <div>
                <label htmlFor="address1" className="block text-sm font-medium text-emerald-950">
                  Address Line 1
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
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-emerald-950">
                    City
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
                  />
                  {formErrors.city && <p className="mt-1 text-xs text-red-600">{formErrors.city}</p>}
                </div>
                <div>
                  <label htmlFor="province" className="block text-sm font-medium text-emerald-950">
                    Province
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-emerald-950">
                    Postal Code
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
                  />
                  {formErrors.postalCode && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.postalCode}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="shippingMethod" className="block text-sm font-medium text-emerald-950">
                    Shipping Method
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
                    {COURIER_SERVICES.map((service) => (
                      <option key={service.value} value={service.value}>
                        {service.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.shippingMethod && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.shippingMethod}</p>
                  )}
                </div>
              </div>
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
                />
              </div>
            </div>
          </div>
        </section>

        {/* Right: Summary */}
        <aside className="lg:col-span-2">
          <div className="rounded-2xl border bg-white shadow-sm p-4 sm:p-5">
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
                className="relative inline-flex items-center justify-center rounded-2xl px-6 py-3 bg-emerald-600 text-white font-medium shadow hover:bg-emerald-700 disabled:opacity-50"
              >
                {payLoading ? "Processing..." : "Pay Now"}
              </button>
              <Link
                href="/cart"
                className="inline-flex items-center justify-center rounded-2xl px-6 py-3 border text-emerald-950 hover:bg-emerald-50"
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