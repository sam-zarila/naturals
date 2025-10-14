// app/api/journal/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { db } from "@/app/lib/firebase-admin";  // ← Fix: import { db }, not { getDb }
import { NextResponse } from "next/server";

/** GET /api/journal?limit=6 (published only) */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.max(1, Math.min(50, Number(searchParams.get("limit") || 6)));

    // Query: published=true, latest first
    let q = db
      .collection("journal")
      .where("published", "==", true)
      .orderBy("publishedAt", "desc");

    const snap = await q.limit(limit).get();
    const items = snap.docs.map((d) => {
      const data = d.data() || {};
      
      // Handle publishedAt as Timestamp or fallback to createdAt
      let publishedAt: Date | null = null;
      if (data.publishedAt?.toDate) {
        publishedAt = data.publishedAt.toDate();
      } else if (data.createdAt?.toDate) {
        publishedAt = data.createdAt.toDate();
      }

      return {
        id: d.id,
        title: String(data.title || ""),
        slug: String(data.slug || ""),
        excerpt: String(data.excerpt || ""),
        content: String(data.content || ""),
        coverUrl: String(data.coverUrl || ""),
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        publishedAt: publishedAt ? publishedAt.toISOString() : null,
      };
    });

    // Sort in-memory if needed (but query already orders by publishedAt desc)
    items.sort((a, b) => {
      const dateA = new Date(a.publishedAt || 0).getTime();
      const dateB = new Date(b.publishedAt || 0).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    console.error("GET /api/journal failed", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}