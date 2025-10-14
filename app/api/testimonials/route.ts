// app/api/testimonials/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { db } from "@/app/lib/firebase-admin";
import { NextResponse } from "next/server";
import type { Timestamp } from "firebase-admin/firestore";

/** Simple guard for Firestore Timestamp */
function isTimestamp(v: unknown): v is Timestamp {
  return typeof v === "object" && v !== null && typeof (v as { toMillis?: unknown }).toMillis === "function";
}

/** GET /api/testimonials?limit=12 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limitRaw = Number(searchParams.get("limit"));
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(50, limitRaw)) : 12;

    // Grab a reasonable window and sort in memory (avoids index requirements).
    const snap = await db.collection("testimonials").limit(200).get();

    const normalized = snap.docs.map((d) => {
      const data = (d.data() ?? {}) as Record<string, unknown>;

      // createdAt can be number or Firestore Timestamp
      const createdSrc = data["createdAt"];
      const createdAt =
        typeof createdSrc === "number"
          ? createdSrc
          : isTimestamp(createdSrc)
          ? createdSrc.toMillis()
          : Date.now();

      // clamp rating 1..5
      const r = Number(data["rating"]);
      const rating = Number.isFinite(r) ? Math.max(1, Math.min(5, r)) : 5;

      return {
        id: String((data["id"] ?? d.id) as unknown),
        name: String((data["author"] ?? data["name"] ?? "Anonymous") as unknown),
        role: String((data["location"] ?? data["role"] ?? "Verified Purchase") as unknown),
        text: String((data["text"] ?? data["message"] ?? "") as unknown),
        rating,
        avatarUrl: String((data["avatarUrl"] ?? "") as unknown),
        createdAt, // epoch ms
      };
    });

    // Latest first, then apply the limit requested
    normalized.sort((a, b) => b.createdAt - a.createdAt);
    const items = normalized.slice(0, limit);

    return NextResponse.json({ ok: true, items });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    console.error("GET /api/testimonials failed:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
