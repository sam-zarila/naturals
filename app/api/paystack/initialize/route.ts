// app/api/paystack/initialize/route.ts
import { NextResponse } from 'next/server';

type InitBody = {
  email: string;
  amountZar: number;   // grand total in ZAR
  name?: string;
  phone?: string;
  cart?: Array<{ id: string; name: string; price: number; qty: number }>;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as InitBody;

    if (!body?.email || !Number.isFinite(body?.amountZar)) {
      return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
    }

    // ⚠️ You asked to hard-code keys. Keep SECRET on the server only.
    const PAYSTACK_SECRET = 'sk_test_26a87b10623002929df848dedee197e3f08d5a8c';

    // amount must be in the **lowest denomination** (ZAR cents)
    const amountCents = Math.round(body.amountZar * 100);

    const reference = `DN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Best callback is your deployed origin; fall back to request origin
    const origin =
      process.env.NEXT_PUBLIC_BASE_URL ||
      req.headers.get('origin') ||
      'http://localhost:3000';

    const payload = {
      email: body.email,
      amount: amountCents,
      currency: 'ZAR',
      reference,
      callback_url: `${origin}/checkout/confirm`,
      metadata: {
        name: body.name || '',
        phone: body.phone || '',
        cart: body.cart || [],
        origin,
      },
    };

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data?.data?.authorization_url) {
      console.error('Paystack initialize error:', data);
      return NextResponse.json(
        { message: data?.message || 'Initialize failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      reference,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
