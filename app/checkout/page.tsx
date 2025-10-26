"use client";

import React, { JSX, useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { doc, getDoc, setDoc, collection, addDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { firestore } from "../lib/firebase-client";

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

/* ============================ Toast ============================ */
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
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
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

/* ============================ Types ============================ */
type Product = { id: string; name: string; price: number; currency: "R"; img: string };
type StoredCartItem = { id: string; qty: number };
type ExpandedLine = Product & { qty: number; lineTotal: number };

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

/* ============================ Catalog ============================ */
const CATALOG: Record<string, Product> = {
  "growth-100": { id: "growth-100", name: "Hair Growth Oil · 100ml", price: 300, currency: "R", img: "/products/hair-growth-oil-100ml.png" },
  "detox-60": { id: "detox-60", name: "Scalp Detox Oil · 60ml", price: 260, currency: "R", img: "/products/scalp-detox-oil-60ml.png" },
};

/* ==================== Firestore & LocalStorage =================== */
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
      typeof (item as any).id === "string" &&
      typeof (item as any).qty === "number" &&
      (item as any).qty > 0
    ) {
      valid.push({ id: (item as any).id, qty: Math.floor((item as any).qty) });
    }
  }
  return valid;
}

async function readCart(userId: string): Promise<StoredCartItem[]> {
  const docRef = doc(firestore, CART_PATH(userId));
  const snap = await getDoc(docRef);
  return snap.exists() ? parseCart((snap.data() as any).items) : [];
}

async function writeCart(userId: string, items: StoredCartItem[]): Promise<void> {
  const docRef = doc(firestore, CART_PATH(userId));
  const snap = await getDoc(docRef);

  let token = localStorage.getItem("cart-token");
  let tokenFromDoc: unknown = null;
  if (snap.exists()) tokenFromDoc = (snap.data() as any).token ?? null;

  const resolvedToken = tokenFromDoc ? String(tokenFromDoc) : token ?? uuidv4();
  localStorage.setItem("cart-token", resolvedToken);

  await setDoc(docRef, { items, updatedAt: Date.now(), token: resolvedToken }, { merge: true });
}

async function clearCartAfterCheckout(userId: string): Promise<void> {
  const docRef = doc(firestore, CART_PATH(userId));
  let token: string | null = localStorage.getItem("cart-token");
  if (!token) {
    token = uuidv4();
    localStorage.setItem("cart-token", token);
  }
  await setDoc(docRef, { items: [], updatedAt: Date.now(), token }, { merge: true });
  if (typeof window !== "undefined") {
    const event = new CustomEvent("cartUpdated", { detail: { items: [] } });
    window.dispatchEvent(event);
  }
}

/* ========================== Shipping ========================== */
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

/* ========================= Provinces ========================= */
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

/* ======================= Checkout Body ======================= */
function CheckoutBody(): JSX.Element {
  const { toast, toasts } = useToast();

  const [userId, setUserId] = useState<string>("");
  const [items, setItems] = useState<StoredCartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [payLoading, setPayLoading] = useState(false);

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

  const shipping = formData.shippingMethod === "self-pickup" ? 0 : 100;
  const getShippingLabel = (method: string) => SHIPPING_OPTIONS.find(s => s.value === method)?.label ?? "Standard";

  // Load anonymous user & cart
  useEffect(() => {
    (async () => {
      try {
        const id = getUserId();
        setUserId(id);
        const cartItems = await readCart(id);
        setItems(cartItems);
      } catch (err) {
        console.error("Failed to load cart:", err);
        toast({ title: "Error", description: "Failed to load cart.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  // React to external cart updates
  useEffect(() => {
    const handleCartUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ items: StoredCartItem[] }>;
      if (customEvent.detail?.items) setItems(customEvent.detail.items);
    };
    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, []);

  // Expand items
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
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Valid email is required";
    if (!formData.phone.trim() || !/^\d{10,}$/.test(formData.phone)) errors.phone = "Valid phone number is required (10+ digits)";
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

  const onPay = useCallback(async () => {
    if (!validateForm()) {
      toast({ title: "Error", description: "Please fill in all required fields correctly.", variant: "destructive" });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!userId) {
      toast({ title: "Error", description: "No user ID available.", variant: "destructive" });
      return;
    }

    setPayLoading(true);
    try {
      // Create order (anonymous customer)
      const ordersRef = collection(firestore, "orders");
      const orderData = {
        userId,
        items,
        totals: { subtotal, shipping, grandTotal },
        status: "pending",
        customer: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          shipping: formData.shippingMethod === "self-pickup" ? "self-pickup" : "courier",
          address:
            formData.shippingMethod !== "self-pickup"
              ? {
                  line1: formData.address1,
                  line2: formData.address2 || "",
                  city: formData.city,
                  province: formData.province,
                  postalCode: formData.postalCode,
                }
              : null,
          notes: formData.notes || "",
        },
        shippingMethod: formData.shippingMethod,
        createdAt: new Date(),
      };
      const orderDoc = await addDoc(ordersRef, orderData);
      const orderId = orderDoc.id;

      toast({ title: "Order Created", description: "Redirecting to payment..." });

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
        const text = await res.text().catch(() => "");
        throw new Error(`Payment initiation failed: ${res.status} ${text ? `- ${text}` : ""}`);
      }
      const data: PaystackInitResponse = await res.json();

      // Clear cart and go to Paystack
      await clearCartAfterCheckout(userId);
      toast({ title: "Cart Cleared", description: "Redirecting to payment..." });
      window.location.href = data.authorization_url;
    } catch (err) {
      console.error("onPay error:", err);
      const message = err instanceof Error ? err.message : "Payment error";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setPayLoading(false);
    }
  }, [userId, items, lines, subtotal, shipping, grandTotal, formData, toast]);

  /* ============================ UI ============================ */
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

  // Normal anonymous checkout flow
  return (
    <main className="bg-white min-h-screen">
      <ToastComponent toasts={toasts} />

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
            <Image src="/logo.png" alt="Delightful Naturals" width={32} height={32} className="rounded" />
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
                  <label htmlFor="firstName" className="block text-sm font-medium text-emerald-950">First Name *</label>
                  <input
                    id="firstName" name="firstName" type="text" value={formData.firstName} onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-xl border ${formErrors.firstName ? "border-red-500" : "border-neutral-200"} p-2 text-sm`}
                    placeholder="Enter your first name"
                  />
                  {formErrors.firstName && <p className="mt-1 text-xs text-red-600">{formErrors.firstName}</p>}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-emerald-950">Last Name *</label>
                  <input
                    id="lastName" name="lastName" type="text" value={formData.lastName} onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-xl border ${formErrors.lastName ? "border-red-500" : "border-neutral-200"} p-2 text-sm`}
                    placeholder="Enter your last name"
                  />
                  {formErrors.lastName && <p className="mt-1 text-xs text-red-600">{formErrors.lastName}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-emerald-950">Email *</label>
                <input
                  id="email" name="email" type="email" value={formData.email} onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-xl border ${formErrors.email ? "border-red-500" : "border-neutral-200"} p-2 text-sm`}
                  placeholder="Enter your email"
                />
                {formErrors.email && <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-emerald-950">Phone *</label>
                <input
                  id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-xl border ${formErrors.phone ? "border-red-500" : "border-neutral-200"} p-2 text-sm`}
                  placeholder="Enter your phone number"
                />
                {formErrors.phone && <p className="mt-1 text-xs text-red-600">{formErrors.phone}</p>}
              </div>

              <div>
                <label htmlFor="shippingMethod" className="block text-sm font-medium text-emerald-950">Shipping Method *</label>
                <select
                  id="shippingMethod" name="shippingMethod" value={formData.shippingMethod} onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-xl border ${formErrors.shippingMethod ? "border-red-500" : "border-neutral-200"} p-2 text-sm`}
                >
                  <option value="">Select shipping method</option>
                  {SHIPPING_OPTIONS.map((service) => (
                    <option key={service.value} value={service.value}>{service.label}</option>
                  ))}
                </select>
                {formErrors.shippingMethod && <p className="mt-1 text-xs text-red-600">{formErrors.shippingMethod}</p>}
              </div>

              {formData.shippingMethod === "self-pickup" && (
                <div className="p-4 rounded-lg bg-emerald-50 text-emerald-800 text-sm">
                  Self pickup is available at our store in Johannesburg. Please contact us for the exact address and pickup times.
                </div>
              )}

              {formData.shippingMethod && formData.shippingMethod !== "self-pickup" && (
                <>
                  <div>
                    <label htmlFor="address1" className="block text-sm font-medium text-emerald-950">Address Line 1 *</label>
                    <input
                      id="address1" name="address1" type="text" value={formData.address1} onChange={handleInputChange}
                      className={`mt-1 block w-full rounded-xl border ${formErrors.address1 ? "border-red-500" : "border-neutral-200"} p-2 text-sm`}
                      placeholder="Enter your street address"
                    />
                    {formErrors.address1 && <p className="mt-1 text-xs text-red-600">{formErrors.address1}</p>}
                  </div>
                  <div>
                    <label htmlFor="address2" className="block text-sm font-medium text-emerald-950">Address Line 2 (Optional)</label>
                    <input
                      id="address2" name="address2" type="text" value={formData.address2} onChange={handleInputChange}
                      className="mt-1 block w-full rounded-xl border border-neutral-200 p-2 text-sm"
                      placeholder="Apartment, suite, unit, etc."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-emerald-950">City *</label>
                      <input
                        id="city" name="city" type="text" value={formData.city} onChange={handleInputChange}
                        className={`mt-1 block w-full rounded-xl border ${formErrors.city ? "border-red-500" : "border-neutral-200"} p-2 text-sm`}
                        placeholder="Enter your city"
                      />
                      {formErrors.city && <p className="mt-1 text-xs text-red-600">{formErrors.city}</p>}
                    </div>
                    <div>
                      <label htmlFor="province" className="block text-sm font-medium text-emerald-950">Province *</label>
                      <select
                        id="province" name="province" value={formData.province} onChange={handleInputChange}
                        className={`mt-1 block w-full rounded-xl border ${formErrors.province ? "border-red-500" : "border-neutral-200"} p-2 text-sm`}
                      >
                        <option value="">Select province</option>
                        {PROVINCES.map((prov) => (
                          <option key={prov.value} value={prov.value}>{prov.label}</option>
                        ))}
                      </select>
                      {formErrors.province && <p className="mt-1 text-xs text-red-600">{formErrors.province}</p>}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-emerald-950">Postal Code *</label>
                    <input
                      id="postalCode" name="postalCode" type="text" value={formData.postalCode} onChange={handleInputChange}
                      className={`mt-1 block w-full rounded-xl border ${formErrors.postalCode ? "border-red-500" : "border-neutral-200"} p-2 text-sm`}
                      placeholder="Enter your postal code"
                    />
                    {formErrors.postalCode && <p className="mt-1 text-xs text-red-600">{formErrors.postalCode}</p>}
                  </div>
                </>
              )}

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-emerald-950">Order Notes (Optional)</label>
                <textarea
                  id="notes" name="notes" value={formData.notes} onChange={handleInputChange}
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
                  <div className="text-emerald-900/80">{line.name} × {line.qty}</div>
                  <div className="text-emerald-950">R{line.lineTotal.toLocaleString()}</div>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <div className="text-emerald-900/80">Subtotal</div>
                <div className="text-emerald-950">R{subtotal.toLocaleString()}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-emerald-900/80">Shipping ({getShippingLabel(formData.shippingMethod)})</div>
                <div className="text-emerald-950">R{shipping.toLocaleString()}</div>
              </div>
              <div className="border-t pt-2 flex items-center justify-between">
                <div className="font-semibold text-emerald-950">Estimated Total</div>
                <div className="font-bold text-emerald-950 text-lg">R{grandTotal.toLocaleString()}</div>
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
              <span className="inline-grid place-items-center w-6 h-6 rounded-full bg-emerald-100 border">🔒</span>
              Secure checkout via Paystack (ZAR)
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

/* =========================== Export =========================== */
export default function CheckoutPage() {
  return <CheckoutBody />;
}
