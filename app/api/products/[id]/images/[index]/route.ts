export const runtime = "nodejs";

import { db } from "@/app/lib/firebase-admin";
import { NextResponse } from "next/server";

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

    // Try common field names
    const dataField = snap.get("data") || snap.get("bytes") || snap.get("blob");

    const mime =
      (snap.get("mime") as string) ||
      (snap.get("contentType") as string) ||
      "application/octet-stream";

    let body: Uint8Array | Buffer | ArrayBuffer | null = null;

    if (
      typeof (dataField as { toUint8Array?: () => Uint8Array }).toUint8Array === "function"
    ) {
      body = (dataField as { toUint8Array: () => Uint8Array }).toUint8Array();
    } else if (
      typeof (dataField as { toBuffer?: () => Buffer }).toBuffer === "function"
    ) {
      body = (dataField as { toBuffer: () => Buffer }).toBuffer();
    } else if (dataField instanceof Uint8Array) {
      body = dataField;
    } else if (Buffer.isBuffer(dataField)) {
      body = dataField;
    } else if (typeof dataField === "string") {
      body = Buffer.from(dataField.replace(/^data:[^,]+,/, ""), "base64");
    }

    if (!body || body.byteLength === 0) {
      return NextResponse.json(
        {
          error: `The requested resource isn't a valid image for /api/products/${id}/images/${index}`,
        },
        { status: 404 }
      );
    }

    return new NextResponse(body as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load image";
    console.error(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
