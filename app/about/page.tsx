'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="relative">
      {/* HERO */}
      <section className="bg-emerald-50/50">
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-14 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-xs tracking-widest uppercase text-emerald-700/80">
              About Delightful Naturals
            </p>
            <h1 className="mt-2 text-3xl md:text-5xl font-extrabold text-emerald-950 leading-tight">
              Luxury Ayurveda for Real Hair Journeys
            </h1>
            <p className="mt-4 text-emerald-900/90">
              Created by <span className="font-semibold">Lesley May</span>,
              our small-batch blends were born from a personal journey through postpartum
              shedding and the need for simple, potent care. We pair time-honoured herbs
              with cold-pressed oils to soothe scalps, fortify strands, and bring back glow.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Shop our oils
              </Link>
              <a
                href="https://wa.me/27672943837"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 border border-emerald-200 text-emerald-900 hover:bg-emerald-50"
              >
                WhatsApp us
              </a>
            </div>
          </div>

          {/* Product image */}
          <div className="relative h-[320px] sm:h-[380px] md:h-[460px] grid place-items-center">
            <Image
              src="/hero/hair-growth-oil-100ml.png"
              alt="Mega Potent Hair Growth Oil"
              width={640}
              height={800}
              priority
              className="w-[220px] sm:w-[280px] md:w-[340px] h-auto drop-shadow-[0_24px_50px_rgba(0,0,0,0.18)]"
            />
          </div>
        </div>
      </section>

      {/* STORY */}
      <section>
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-14 grid md:grid-cols-2 gap-8 items-start">
          <div className="order-2 md:order-1">
            <h2 className="text-2xl md:text-3xl font-bold text-emerald-950">
              Our Story
            </h2>
            <p className="mt-3 text-emerald-900/90">
              Delightful Naturals started with one goal: make hair care that works and
              feels beautiful. We keep formulas intentionally minimal so each ingredient
              shines. Small batches protect potency, texture, and that lightweight slip.
            </p>
            <p className="mt-3 text-emerald-900/90">
              Whether you’re regrowing after postpartum, protecting styles, or simply
              seeking softness and shine—every drop is crafted to restore, nourish, and
              empower.
            </p>
          </div>

          {/* Side image */}
          <div className="order-1 md:order-2">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-emerald-100">
              <Image
                src="/products/hair-growth-oil-100ml.png"
                alt="Small-batch craft"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-contain p-6"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* SIMPLE GALLERY */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-14">
          <h3 className="text-xl md:text-2xl font-bold text-emerald-950">
            Inside the Bottle
          </h3>
          <p className="mt-2 text-emerald-900/80">
            Rich oils and heritage herbs, blended for results and ritual.
          </p>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="relative aspect-[1/1] overflow-hidden rounded-xl border border-emerald-100 bg-white">
              <Image
                src="/hero/hair-growth-oil-100ml.png"
                alt="Hero bottle"
                fill
                sizes="(min-width: 640px) 33vw, 50vw"
                className="object-contain p-4"
              />
            </div>
            <div className="relative aspect-[1/1] overflow-hidden rounded-xl border border-emerald-100 bg-white">
              <Image
                src="/hero/hair-growth-oil-100ml1.jpeg"
                alt="Bottle detail"
                fill
                sizes="(min-width: 640px) 33vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="relative aspect-[1/1] overflow-hidden rounded-xl border border-emerald-100 bg-white">
              <Image
                src="/products/hair-growth-oil-100ml12.jpeg"
                alt="Ingredients & mood"
                fill
                sizes="(min-width: 640px) 33vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SMALL CTA */}
      <section className="bg-emerald-50/60">
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-14 text-center">
          <h4 className="text-xl md:text-2xl font-bold text-emerald-950">
            Ready to restore your roots?
          </h4>
          <p className="mt-2 text-emerald-900/80">
            Start your ritual with Mega Potent Hair Growth Oil.
          </p>
          <div className="mt-5">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Shop now
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
