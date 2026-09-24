"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Review = {
  id: string;
  name: string;
  role?: string;
  text: string;
  rating: number;
  avatarUrl?: string;
};

function stars(rating: number) {
  const n = Math.max(1, Math.min(5, Math.round(rating || 5)));
  return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
}

export default function ReviewsPage() {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/testimonials?limit=50", { cache: "no-store" });
        if (!res.ok) throw new Error("Could not load reviews");
        const data = await res.json();
        if (!cancelled) setItems(Array.isArray(data.items) ? data.items : []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load reviews");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <nav className="text-sm text-emerald-800/80 mb-6">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="px-2">/</span>
          <Link href="/shop" className="hover:underline">Shop</Link>
          <span className="px-2">/</span>
          <span className="text-emerald-950 font-medium">Reviews</span>
        </nav>

        <h1 className="text-3xl font-bold text-emerald-950">Customer Reviews</h1>
        <p className="mt-2 text-emerald-900/70">What people are saying about Delightful Naturals.</p>

        {loading && (
          <div className="mt-8 space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 rounded-2xl border border-emerald-100 bg-white animate-pulse" />
            ))}
          </div>
        )}

        {error && <p className="mt-8 text-sm text-red-600">{error}</p>}

        {!loading && !error && items.length === 0 && (
          <p className="mt-8 text-emerald-900/70">No reviews yet. Check back soon.</p>
        )}

        {!loading && !error && items.length > 0 && (
          <ul className="mt-8 space-y-4">
            {items.map((review) => (
              <li key={review.id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                <div className="text-amber-500 text-sm" aria-label={`${review.rating} out of 5 stars`}>
                  {stars(review.rating)}
                </div>
                <p className="mt-2 text-emerald-950 leading-relaxed">{review.text}</p>
                <div className="mt-4 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={review.avatarUrl || "/logo.png"}
                    alt=""
                    width={36}
                    height={36}
                    className="w-9 h-9 rounded-full border object-cover bg-emerald-50"
                  />
                  <div>
                    <div className="text-sm font-medium text-emerald-900">{review.name}</div>
                    <div className="text-xs text-emerald-800/70">{review.role || "Verified Purchase"}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 bg-emerald-600 text-white font-medium hover:bg-emerald-700"
          >
            Back to shop
          </Link>
        </div>
      </div>
    </main>
  );
}
