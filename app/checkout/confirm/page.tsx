// app/checkout/confirm/page.tsx
'use client';

import { useEffect, useState } from 'react';

type VerifyRes = {
  status: boolean;
  message: string;
  data?: {
    status?: string; // "success", "failed", "abandoned"
    amount?: number; // in cents
    currency?: string;
    reference?: string;
    customer?: { email?: string };
    paid_at?: string;
  };
};

export default function ConfirmPage() {
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<VerifyRes | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const reference = sp.get('reference');

    if (!reference) {
      setPayload({ status: false, message: 'Missing reference' });
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`);
        const data = (await res.json()) as VerifyRes;
        setPayload(data);
      } catch (e) {
        setPayload({ status: false, message: 'Verification error' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <main className="max-w-xl mx-auto p-6">
        <h1 className="text-xl font-semibold">Verifying payment…</h1>
      </main>
    );
  }

  const ok = payload?.status && payload?.data?.status === 'success';
  const amtZar = payload?.data?.amount ? (payload.data.amount / 100).toFixed(2) : null;

  return (
    <main className="max-w-xl mx-auto p-6">
      {ok ? (
        <>
          <h1 className="text-2xl font-bold text-emerald-700">Payment successful 🎉</h1>
          <p className="mt-2 text-sm text-neutral-700">
            Reference: <b>{payload?.data?.reference}</b>
          </p>
          <p className="text-sm text-neutral-700">Amount: <b>ZAR {amtZar}</b></p>
          <p className="text-sm text-neutral-700">Email: {payload?.data?.customer?.email}</p>
         
    
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-red-600">Payment not completed</h1>
          <p className="mt-2 text-sm text-neutral-700">{payload?.message}</p>
          <a href="/cart" className="inline-flex mt-6 rounded-xl border px-4 py-2">
            Back to cart
          </a>
        </>
      )}
    </main>
  );
}
