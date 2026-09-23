"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { firestore } from "./firebase-client";

export type Product = {
  id: string;
  name: string;
  price: number;
  currency: "R";
  img: string;
  size?: string;
  gallery?: string[];
};

/** Local files that actually exist under /public/products */
export const PRODUCT_FALLBACK_IMG: Record<string, string> = {
  "growth-100": "/products/hair-growth-oil-100ml.png",
  "detox-60": "/products/scalp-detox-oil-60ml.jpg",
};

export function productImageCandidates(id: string, gallery: string[] = []): string[] {
  const cleaned = gallery.filter((u) => typeof u === "string" && u.trim().length > 0);
  const localPrimary = PRODUCT_FALLBACK_IMG[id];
  // Extra local aliases for detox (older code / DB gallery paths)
  const localAliases =
    id === "detox-60"
      ? ["/products/scalp-detox-oil-60ml.jpg", "/products/scalp-detox-60ml.jpg", "/products/scalp-detox-oil-60ml.png"]
      : id === "growth-100"
        ? ["/products/hair-growth-oil-100ml.png", "/products/hair-growth-oil-100ml.jpeg"]
        : [];
  const list = [localPrimary, ...localAliases, ...cleaned, "/logo.png"].filter(Boolean) as string[];
  return Array.from(new Set(list));
}

export function resolveProductImg(id: string, gallery: string[] = []): string {
  return productImageCandidates(id, gallery)[0] || "/logo.png";
}

export function mapProductDoc(id: string, data: Record<string, unknown>): Product {
  const gallery = Array.isArray(data.gallery)
    ? (data.gallery as unknown[]).filter((u): u is string => typeof u === "string" && u.trim().length > 0)
    : [];
  const priceRaw = data.price;
  const price =
    typeof priceRaw === "number"
      ? priceRaw
      : typeof priceRaw === "string"
        ? Number(priceRaw) || 0
        : 0;

  return {
    id,
    name: typeof data.name === "string" && data.name ? data.name : `Product ${id}`,
    price,
    currency: "R",
    // Prefer known-good local/API images over stale gallery URLs that 404
    img: resolveProductImg(id, gallery),
    size: typeof data.size === "string" ? data.size : "",
    gallery: productImageCandidates(id, gallery),
  };
}

/** One-shot fetch for a single product document. */
export async function fetchProduct(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(firestore, "products", id));
  if (!snap.exists()) return null;
  return mapProductDoc(snap.id, snap.data() as Record<string, unknown>);
}

/** Live catalog from Firestore `products` — prices update when you change them in the DB. */
export function useProducts() {
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(firestore, "products"),
      (snap) => {
        const next: Record<string, Product> = {};
        snap.forEach((d) => {
          next[d.id] = mapProductDoc(d.id, d.data() as Record<string, unknown>);
        });
        setProducts(next);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Failed to load products:", err);
        setError(err.message || "Failed to load products");
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return { products, loading, error };
}
