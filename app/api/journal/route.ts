// app/api/journal/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { db } from "@/app/lib/firebase-admin";  // Your admin DB import
import { NextResponse } from "next/server";

/** GET /api/journal?limit=6 (published only) */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.max(1, Math.min(50, Number(searchParams.get("limit") || 6)));

    // Query: published=true, latest first (use updatedAt since publishedAt is missing)
    let q = db
      .collection("journal")
      .where("published", "==", true)
      .orderBy("updatedAt", "desc");  // ← Fix: Order by existing field (updatedAt)

    const snap = await q.limit(limit).get();
    console.log(`Journal query found ${snap.docs.length} docs`);  // Temp log for debug

    const items = snap.docs.map((d) => {
      const data = d.data() || {};
      
      // Handle publishedAt as Timestamp or fallback to updatedAt/createdAt
      let publishedAt: Date | null = null;
      if (data.publishedAt?.toDate) {
        publishedAt = data.publishedAt.toDate();
      } else if (data.updatedAt?.toDate) {  // ← Prioritize updatedAt
        publishedAt = data.updatedAt.toDate();
      } else if (data.createdAt?.toDate) {
        publishedAt = data.createdAt.toDate();
      }

      return {
        id: d.id,
        title: String(data.title || ""),
        slug: String(data.slug || ""),
        excerpt: String(data.excerpt || ""),
        content: String(data.content || ""),  // ← Matches your doc field
        coverUrl: String(data.coverUrl || ""),
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        publishedAt: publishedAt ? publishedAt.toISOString() : null,
      };
    });

    // Sort in-memory if needed (but query already orders)
    items.sort((a, b) => {
      const dateA = new Date(a.publishedAt || 0).getTime();
      const dateB = new Date(b.publishedAt || 0).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    console.error("GET /api/journal failed:", e);  // ← Better logging
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}