export const runtime = "nodejs";

import { db } from "@/app/lib/firebase-admin";
import { NextResponse } from "next/server";

// Support only these two IDs
const ALLOWED = new Set(["detox-60", "growth-100"] as const);
type ProductID = "detox-60" | "growth-100";

type Ctx = { params: Promise<{ id: string; index: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id, index } = await ctx.params;

  if (!ALLOWED.has(id as ProductID)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }
  if (!/^\d+$/.test(index)) {
    return NextResponse.json({ error: "Invalid image index" }, { status: 400 });
  }

  try {
    const ref = db.collection("products").doc(id).collection("images").doc(index);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Try the common field names you might’ve used
    const dataField =
      (snap.get("data") as unknown) ??
      (snap.get("bytes") as unknown) ??
      (snap.get("blob") as unknown);

    const mime =
      (snap.get("mime") as string) ||
      (snap.get("contentType") as string) ||
      "application/octet-stream";

    // Normalize to a body Next can send
    let body: Uint8Array | Buffer | ArrayBuffer | null = null;

    if (typeof (dataField as any)?.toUint8Array === "function") {
      body = (dataField as any).toUint8Array(); // Firestore Blob
    } else if (typeof (dataField as any)?.toBuffer === "function") {
      body = (dataField as any).toBuffer(); // Some SDKs expose toBuffer()
    } else if (dataField instanceof Uint8Array) {
      body = dataField;
    } else if (Buffer.isBuffer(dataField)) {
      body = dataField as Buffer;
    } else if (typeof dataField === "string") {
      // base64 string (fallback)
      body = Buffer.from(dataField.replace(/^data:[^,]+,/, ""), "base64");
    }

    if (!body || (body as Uint8Array).length === 0) {
      return NextResponse.json(
        { error: `The requested resource isn't a valid image for /api/products/${id}/images/${index} received ${typeof dataField}` },
        { status: 404 }
      );
    }

    return new NextResponse(body as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": mime,
        // Cache hard — you can bust by updating the image doc
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed to load image" }, { status: 500 });
  }
}
