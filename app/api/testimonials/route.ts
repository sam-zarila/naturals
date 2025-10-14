// app/api/testimonials/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { db } from "@/app/lib/firebase-admin";
import { NextResponse } from "next/server";


/** GET /api/testimonials?limit=12 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limitRaw = Number(searchParams.get("limit"));
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(50, limitRaw)) : 12;

    // Grab a reasonable window and sort in memory (avoids index requirements).
    const snap = await db
      .collection("testimonials")
      .limit(200)
      .get();

    const normalized = snap.docs.map((d) => {
      const data: any = d.data() || {};

      // createdAt can be number or Firestore Timestamp
      const createdAt =
        typeof data.createdAt === "number"
          ? data.createdAt
          : typeof data.createdAt?.toMillis === "function"
          ? data.createdAt.toMillis()
          : Date.now();

      // clamp rating 1..5
      const r = Number(data.rating);
      const rating = Number.isFinite(r) ? Math.max(1, Math.min(5, r)) : 5;

      return {
        id: String(data.id || d.id),
        name: String(data.author ?? data.name ?? "Anonymous"),
        role: String(data.location ?? data.role ?? "Verified Purchase"),
        text: String(data.text ?? data.message ?? ""),
        rating,
        avatarUrl: String(data.avatarUrl ?? ""),
        createdAt, // epoch ms
      };
    });

    // Latest first, then apply the limit requested
    normalized.sort((a, b) => b.createdAt - a.createdAt);
    const items = normalized.slice(0, limit);

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    console.error("GET /api/testimonials failed:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
