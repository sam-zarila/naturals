// app/api/paystack/verify/route.ts
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const reference = url.searchParams.get('reference');
    if (!reference) {
      return NextResponse.json({ message: 'Missing reference' }, { status: 400 });
    }

   const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message || 'Verify failed' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
