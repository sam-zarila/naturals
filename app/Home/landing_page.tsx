'use client';

import { MotionConfig, motion, useScroll, useTransform, AnimatePresence, animate, useMotionValue, useSpring } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

// ——————————————————————————————————————————————
// Delightful Naturals — Ultra‑Slick Landing Page (single file)
// Drop this file at: app/page.js
// Requires Tailwind CSS + framer-motion (npm i framer-motion)
// ——————————————————————————————————————————————

// Shared reveal animation props for framer-motion components
const revealProps = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55 }
};

export default function LandingPage() {
  const { scrollYProgress } = useScroll(); // global for progress bar

  return (
    <MotionConfig transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>
      <main className="relative overflow-x-clip">
        {/* Smooth scrolling for anchor links */}
        <style jsx global>{`
          html { scroll-behavior: smooth; }
        `}</style>

        {/* Top scroll progress */}
        <motion.div style={{ scaleX: scrollYProgress }} className="fixed top-0 left-0 right-0 h-1 origin-left bg-emerald-500/60 z-[60]" />

        <Header />
        <Hero />
        <DiscountStrip />
        <OrganicIntro />
        <NewArrivals />
        <Testimonials />
        <FAQSection />
        <ContactSection />
        <SupportSection />
        <QuoteBlock />
        <NewsletterCTA />
        <Footer />
      </main>
    </MotionConfig>
  );
}



// Shared product list for Shop dropdown
const SHOP_PRODUCTS = [
  { id: 'growth-100', name: 'Hair Growth Oil', detail: 'Mega Potent · 100ml', price: 'R300', img: '/products/hair-growth-oil-100ml.png' },
  { id: 'detox-60',  name: 'Scalp Detox Oil',   detail: 'Hydration · 60ml',   price: 'R260', img: '/products/scalp-detox-oil-60ml.png' },
];

// ——————————————————————————————————————————————
// Header (sticky w/ smooth morph)
// ——————————————————————————————————————————————
function Header() {
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 120], ['rgba(235,244,235,0)', 'rgba(255,255,255,0.9)']);
  const border = useTransform(scrollY, [0, 120], ['rgba(0,0,0,0)', 'rgba(0,0,0,0.08)']);
  const shadow = useTransform(scrollY, [0, 140], ['0 0 0 rgba(0,0,0,0)', '0 12px 34px rgba(0,0,0,0.08)']);

  return (
    <motion.header style={{ backgroundColor: bg, borderBottomColor: border, boxShadow: shadow }} className="sticky top-0 z-50 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 h-16 grid grid-cols-3 items-center">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Delightful Naturals" className="w-8 h-8 rounded" />
          <span className="font-semibold text-brand-ink">Delightful Naturals</span>
        </Link>
        <nav className="hidden md:flex items-center justify-center gap-8">
          <a href="#" className="navlink">Company</a>
          <a href="#new" className="navlink">Products</a>
          <a href="#best" className="navlink">Best Sellers</a>
          <a href="#faqs" className="navlink">FAQ</a>
          <a href="#support" className="navlink">Support</a>
          <ShopMenu />
        </nav>
        <div className="flex items-center justify-end gap-4">
          <IconSearch className="w-5 h-5 text-emerald-700/80" />
          <CartIcon className="w-5 h-5 text-emerald-700/80" />
        </div>
      </div>
      <style jsx>{`
        .navlink{ @apply text-sm font-medium text-emerald-800/80 hover:text-emerald-900 relative; }
        .navlink:after{ content:''; position:absolute; left:0; bottom:-6px; height:2px; width:0; background:#059669; border-radius:2px; transition:width .35s cubic-bezier(.16,1,.3,1); }
        .navlink:hover:after{ width:100%; }
      `}</style>
    </motion.header>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}><path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-5.4-5.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
  );
}

// Cart icon SVG
function IconCart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 6h15l-1.5 9h-13z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="9" cy="20" r="1" fill="currentColor" />
      <circle cx="18" cy="20" r="1" fill="currentColor" />
    </svg>
  );
}


// Cart icon wrapper that reacts to add-to-cart events
function CartIcon({ className }: { className?: string }) {
  const [pop, setPop] = useState(false);
  useEffect(() => {
    const onAdd = () => { setPop(true); setTimeout(() => setPop(false), 700); };
    window.addEventListener('cart:add', onAdd);
    return () => window.removeEventListener('cart:add', onAdd);
  }, []);
  return (
    <div className="relative">
      <IconCart className={className} />
      {pop && (
        <>
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </>
      )}
    </div>
  );
}

// Shop dropdown menu (with + add buttons)
function ShopMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { 
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); 
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onKey); };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        className="navlink flex items-center gap-1"
        onClick={() => setOpen(v => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Shop
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M5.3 7.3a1 1 0 011.4 0L10 10.59l3.3-3.3a1 1 0 111.4 1.42l-4 4a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.42z"/></svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            className="absolute left-1/2 -translate-x-1/2 top-[140%] z-[60] w-[360px]"
            role="menu"
          >
            <div className="rounded-2xl border border-emerald-100 bg-white shadow-xl p-3">
              {SHOP_PRODUCTS.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-emerald-50/70">
                  <img src={p.img} alt={p.name} className="w-12 h-12 object-contain" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-emerald-950">{p.name}</div>
                    <div className="text-xs text-emerald-800/70">{p.detail} · {p.price}</div>
                  </div>
                  <AddButton productId={p.id} />
                </div>
              ))}
              <div className="mt-2 px-2">
                <Link href="/shop" className="inline-flex text-sm text-emerald-700 hover:underline">View all →</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddButton({ productId }: { productId: string }) {
  const [ping, setPing] = useState(false);
  return (
    <button
      onClick={() => {
        setPing(true);
        setTimeout(() => setPing(false), 600);
        // Hook for future cart store
        try { window.dispatchEvent(new CustomEvent('cart:add', { detail: { id: productId, qty: 1 } })); } catch {}
      }}
      className="relative grid place-items-center w-8 h-8 rounded-full border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white transition"
      aria-label={`Add ${productId} to cart`}
      title="Add to cart"
    >
      <IconPlus className="w-4 h-4" />
      {ping && <span className="absolute inline-flex h-full w-full rounded-full border-2 border-emerald-400 animate-ping" />}
    </button>
  );
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
  );
}

// ——————————————————————————————————————————————
// HERO (more green gradients + parallax)
// ——————————————————————————————————————————————
function Hero() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const yBottle = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const xWaveL = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const xWaveR = useTransform(scrollYProgress, [0, 1], [0, 30]);
  const haloPulse = useSpring(useMotionValue(0.7), { stiffness: 40, damping: 12 });

  useEffect(() => {
    const controls = animate(haloPulse, 1, { duration: 2.6, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' });
    return () => controls.stop();
  }, []);

  return (
    <section ref={heroRef} className="relative bg-gradient-to-b from-emerald-50 via-emerald-50/50 to-white">
      {/* background olives & soft glows */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-10 -left-10 h-72 w-72 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(16,185,129,0.28), transparent 60%)' }} />
        <div className="absolute -bottom-10 right-0 h-80 w-80 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle at 60% 60%, rgba(16,185,129,0.18), transparent 60%)' }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 md:py-16 grid md:grid-cols-2 gap-8 items-center">
        {/* LEFT copy */}
        <div>
          <motion.h1 {...revealProps} className="text-5xl md:text-6xl font-bold text-emerald-950 leading-tight">Organic Oil</motion.h1>
          <motion.p {...revealProps} transition={{ delay: 0.05 }} className="mt-2 text-lg text-emerald-700">Pure Natural Organic Oil</motion.p>
          <motion.p {...revealProps} transition={{ delay: 0.1 }} className="mt-3 text-emerald-800/80 max-w-md">Nourish your scalp, boost shine, and love your hair care process. The key to results is keeping your routine simple.</motion.p>

          {/* CTAs + social proof */}
          <motion.div {...revealProps} transition={{ delay: 0.18 }} className="mt-6 flex flex-wrap items-center gap-3">
            <Magnetic>
              <Link href="/shop" className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 bg-emerald-600 text-white shadow-md">
                Try it →
              </Link>
            </Magnetic>
            <div className="flex items-center -space-x-2">
              {['a','b','c','d'].map((k,i)=> (
                <img key={String(i)} src={`/avatars/${String(i+1)}.jpg`} onError={(e)=>e.currentTarget.style.opacity="0.3"} alt="customer" className="w-8 h-8 rounded-full border-2 border-white" />
              ))}
            </div>
            <span className="text-xs text-emerald-900/70">Our Satisfied Customers · ★ 4.9 (320 reviews)</span>
          </motion.div>
        </div>

        {/* RIGHT artwork */}
        <div className="relative h-[380px] md:h-[520px]">
          {/* waves */}
          <motion.img style={{ x: xWaveL }} src="/hero/wave-left.jpg" alt="wave" onError={(e)=>e.currentTarget.style.display='none'} className="absolute left-[-40px] top-[80px] w-[260px] md:w-[360px] opacity-90" />
          <motion.img style={{ x: xWaveR }} src="/hero/wave-right.jpg" alt="wave" onError={(e)=>e.currentTarget.style.display='none'} className="absolute right-[-30px] top-[120px] w-[260px] md:w-[360px] opacity-90" />

          {/* bottle */}
          <motion.div style={{ y: yBottle }} className="absolute inset-0 grid place-items-center">
            <Image src="/hero/bottle.jpg" alt="Bottle" width={560} height={680} className="w-[220px] md:w-[320px] drop-shadow-[0_24px_50px_rgba(0,0,0,0.25)]" />
          </motion.div>

          {/* shimmering halo */}
          <motion.div aria-hidden style={{ opacity: haloPulse }} className="absolute inset-0" >
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[220px] rounded-full blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(255,255,255,0.9), transparent)' }} />
          </motion.div>
        </div>
      </div>

      {/* mini product cards under hero */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid sm:grid-cols-2 gap-4">
          <ProductMiniCard name="Hair Growth Oil" price="R300" image="/products/hair-growth-oil-100ml.png" />
          <ProductMiniCard name="Scalp Detox Oil" price="R260" image="/products/scalp-detox-oil-60ml.jpg" />
        </div>
      </div>
    </section>
  );
}

// Magnetic hover wrapper for CTAs
function Magnetic({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const dx = useSpring(x, { stiffness: 120, damping: 12 });
  const dy = useSpring(y, { stiffness: 120, damping: 12 });
  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return; const mx = e.clientX - (r.left + r.width/2); const my = e.clientY - (r.top + r.height/2);
        x.set(mx * 0.15); y.set(my * 0.15);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ x: dx, y: dy }}
      className="will-change-transform"
    >{children}</motion.div>
  );
}

type ProductMiniCardProps = {
  name: string;
  price: string;
  image: string;
};

function ProductMiniCard({ name, price, image }: ProductMiniCardProps) {
  return (
    <motion.div whileHover={{ y: -4, boxShadow: '0 14px 30px rgba(0,0,0,0.08)' }} className="bg-white/90 backdrop-blur rounded-2xl p-4 border shadow-sm flex items-center gap-4">
      <img src={image} alt={name} className="w-14 h-14 object-contain" />
      <div className="flex-1">
        <div className="font-medium text-emerald-950">{name}</div>
        <div className="text-sm text-emerald-800/70">{price}</div>
      </div>
      <Link href="/shop" className="inline-flex rounded-lg px-3 py-1.5 bg-emerald-600 text-white text-sm shadow">Buy</Link>
    </motion.div>
  );
}

// ——————————————————————————————————————————————
// Discount strip (animated pop)
// ——————————————————————————————————————————————
function DiscountStrip() {
  return (
    <section className="max-w-6xl mx-auto px-4 -mt-4 md:-mt-6">
      <motion.div initial={{ scale: 0.96, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} className="inline-flex items-center gap-3 rounded-2xl bg-emerald-600 text-white px-4 py-2 shadow">
        <span className="text-sm font-semibold">20% Off</span>
        <span className="text-xs opacity-90">this week on bundles</span>
      </motion.div>
    </section>
  );
}

// ——————————————————————————————————————————————
// Organic intro (staggered reveal)
// ——————————————————————————————————————————————
function OrganicIntro() {
  return (
    <section className="relative">
      <div className="absolute inset-0 -z-10 pointer-events-none bg-[radial-gradient(600px_400px_at_50%_20%,rgba(16,185,129,0.08),transparent_60%)]" />
      <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-8 items-center">
        <div className="relative">
          <img src="/decor/olive-blob.png" alt="olive" onError={(e)=>e.currentTarget.style.opacity="0.15"} className="absolute -top-10 -left-8 w-40 opacity-80" />
          <motion.h2 {...revealProps} className="text-2xl md:text-3xl font-bold text-emerald-950">We Source Organically Grown Ingredients From Family Owned Farms</motion.h2>
          <motion.p {...revealProps} transition={{ delay: 0.06 }} className="mt-3 text-emerald-900/80">We keep our blends simple: high‑performing botanicals with clean INCI names. Small batches ensure freshness, and every bottle is filled with care.</motion.p>
          <motion.div {...revealProps} transition={{ delay: 0.12 }}>
            <Link href="/about" className="mt-4 inline-flex rounded-xl px-4 py-2 bg-emerald-600 text-white shadow">About us</Link>
          </motion.div>
        </div>
        <div className="relative min-h-[220px]">
          <motion.img {...revealProps} src="/decor/olives.png" alt="olives" onError={(e)=>e.currentTarget.style.display='none'} className="absolute right-0 top-0 w-64" />
        </div>
      </div>
    </section>
  );
}

// ——————————————————————————————————————————————
// New Arrivals (hover lift + fade) with green backdrop
// ——————————————————————————————————————————————
function NewArrivals() {
  const items = [
    { name: 'Hair Growth Oil', price: 'R300', img: '/products/hair-growth-oil-100ml.png' },
    { name: 'Scalp Detox Oil', price: 'R260', img: '/products/scalp-detox-oil-60ml.png' },
    { name: 'Hair Growth Oil', price: 'R300', img: '/products/hair-growth-oil-100ml.png' },
    { name: 'Scalp Detox Oil', price: 'R260', img: '/products/scalp-detox-oil-60ml.png' },
  ];
  return (
    <section id="new" className="relative">
      <div className="absolute inset-0 -z-10 pointer-events-none bg-gradient-to-b from-emerald-50/60 to-transparent" />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="text-center mb-6">
          <h3 className="text-xl md:text-2xl font-semibold text-emerald-950">New Arrival Product</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {items.map((it, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }} whileHover={{ y: -6, boxShadow: '0 16px 34px rgba(0,0,0,0.08)' }} className="rounded-2xl border bg-white p-4 text-center shadow-sm">
              <img src={it.img} alt={it.name} className="w-20 h-20 object-contain mx-auto" />
              <div className="mt-2 font-medium text-emerald-950 text-sm">{it.name}</div>
              <div className="text-xs text-emerald-900/70">{it.price}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ——————————————————————————————————————————————
// Testimonials — Beautiful green carousel
// ——————————————————————————————————————————————
function Testimonials() {
  const items = [
    { name: 'Nabiso M.', role: 'Verified Purchase', text: 'My scalp finally feels calm and fresh. The detox oil is a lifesaver between wash days!', rating: 5, avatar: '/avatars/1.jpg' },
    { name: 'Prudence K.', role: 'Verified Purchase', text: 'I saw less breakage in 3 weeks. The hair growth oil leaves my ends so soft.', rating: 5, avatar: '/avatars/2.jpg' },
    { name: 'Tariro L.', role: 'Verified Purchase', text: 'Lightweight but effective. Love the scent and the shine it gives.', rating: 5, avatar: '/avatars/3.jpg' },
    { name: 'Ayanda S.', role: 'Repeat Customer', text: 'The only oils that don’t weigh my hair down. Instant scalp relief.', rating: 5, avatar: '/avatars/4.jpg' },
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % items.length), 4500);
    return () => clearInterval(id);
  }, [items.length]);

  return (
    <section className="relative">
      {/* green canvas background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(800px_500px_at_50%_-10%,rgba(16,185,129,0.12),transparent_60%)]" />
      <div className="max-w-5xl mx-auto px-4 py-12 md:py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-950">What our customers are saying</h2>

        <div className="mt-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.98 }}
              transition={{ duration: 0.35 }}
              className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-white p-8 shadow-[0_20px_40px_rgba(16,185,129,0.12)]"
            >
              {/* deco gradient */}
              <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full blur-3xl" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(234,179,8,0.14))' }} />

              <div className="flex justify-center gap-1 text-amber-500 mb-3">
                {Array.from({ length: items[i].rating }).map((_, s) => <span key={s}>★</span>)}
              </div>
              <p className="text-lg text-emerald-950">“{items[i].text}”</p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <img src={items[i].avatar} onError={(e)=>e.currentTarget.style.opacity="0.3"} alt="avatar" className="w-9 h-9 rounded-full border" />
                <div className="text-left">
                  <div className="text-sm font-medium text-emerald-900">{items[i].name}</div>
                  <div className="text-xs text-emerald-800/70">{items[i].role}</div>
                </div>
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Verified</span>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="mt-4 flex justify-center gap-2">
            {items.map((_, idx) => (
              <button key={idx} onClick={() => setI(idx)} className={`h-2.5 rounded-full transition ${i===idx?'w-6 bg-emerald-600':'w-2.5 bg-emerald-200'}`} aria-label={`Go to review ${idx+1}`} />
            ))}
          </div>
        </div>

        {/* mini grid for desktop under the carousel */}
        <div className="mt-10 hidden md:grid grid-cols-3 gap-4">
          {items.map((r, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: idx*0.05 }} className="rounded-2xl border border-emerald-200 bg-white p-4 text-left">
              <div className="flex items-center gap-2">
                <img src={r.avatar} onError={(e)=>e.currentTarget.style.opacity="0.3"} alt="avatar" className="w-8 h-8 rounded-full border" />
                <div className="text-sm font-medium text-emerald-900">{r.name}</div>
              </div>
              <p className="mt-2 text-sm text-emerald-900/90">{r.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ——————————————————————————————————————————————
// FAQ Section — animated accordion
// ——————————————————————————————————————————————
function FAQSection() {
  const faqs = [
    { q: 'How often should I use the Hair Growth Oil?', a: '3–4 times per week is a great start. Focus on dry or fragile areas and adjust based on how your hair feels.' },
    { q: 'Is the Scalp Detox Oil suitable for sensitive scalps?', a: 'Yes. Start with a few drops and massage gently. Always patch test and discontinue use if irritation occurs.' },
    { q: 'Can I use both oils together?', a: 'Absolutely. Use Scalp Detox Oil to refresh the scalp between wash days, and Hair Growth Oil to seal in moisture on lengths.' },
    { q: 'Do you ship?', a: 'Yes. Shipping and payment are finalised during checkout/WhatsApp confirmation. We’ll share options for your area.' },
    { q: 'What are the ingredients?', a: 'Key botanicals include Grapeseed, Avocado, Jojoba, Rosemary and Nettle, with Tocopherol and Caprylic/Capric Triglyceride.' },
    { q: 'Storage & shelf life', a: 'Store in a cool, dry place away from direct sunlight. Best used within 12 months of opening.' },
  ];

  return (
    <section id="faqs" className="relative">
      <div className="max-w-4xl mx-auto px-4 py-14 md:py-16">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-emerald-950">Frequently asked questions</h2>
          <p className="mt-2 text-emerald-900/80">Quick answers to common questions.</p>
        </div>

        <div className="relative">
          <div className="absolute -inset-1 rounded-[26px] bg-gradient-to-br from-emerald-200/40 to-amber-200/40 blur-xl -z-10" aria-hidden />
          <div className="rounded-[22px] border border-emerald-200 bg-white shadow-sm divide-y">
            {faqs.map((item, idx) => (
              <FAQItem key={idx} q={item.q} a={item.a} defaultOpen={idx === 0} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

type FAQItemProps = {
  q: string;
  a: string;
  defaultOpen?: boolean;
};

function FAQItem({ q, a, defaultOpen = false }: FAQItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="p-4 md:p-5">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-4 text-left" aria-expanded={open}>
        <span className="font-medium text-emerald-950">{q}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }} className="inline-grid place-items-center rounded-full border w-6 h-6 text-sm">+</motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="content" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="pt-3 text-sm text-emerald-900/90">{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ——————————————————————————————————————————————
// Contact Section — phone, WhatsApp, email
// ——————————————————————————————————————————————
function ContactSection() {
  return (
    <section id="contact" className="relative">
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-amber-50 p-8 md:p-12">
          <motion.div aria-hidden className="absolute -top-12 -right-12 h-72 w-72 rounded-full blur-3xl pointer-events-none -z-10" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.22), rgba(234,179,8,0.22))' }} animate={{ x: [0, 10, -6, 0], y: [0, 6, -10, 0] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} />

          <motion.h3 {...revealProps} className="text-2xl md:text-3xl font-bold text-emerald-950">Contact us</motion.h3>
          <motion.p {...revealProps} transition={{ delay: 0.05 }} className="mt-2 text-emerald-900/80 max-w-xl">We’re happy to help with product questions and personalised routines.</motion.p>

          <motion.div {...revealProps} transition={{ delay: 0.1 }} className="mt-6 grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
              <div className="font-medium text-emerald-950">Phone & WhatsApp</div>
              <a className="mt-1 block underline" href="tel:+27672943837">+27 67 294 3837</a>
              <a className="mt-2 inline-flex w-fit rounded-xl px-4 py-2 bg-emerald-600 text-white shadow hover:scale-[1.02] transition" href="https://wa.me/27672943837" target="_blank" rel="noreferrer">Chat on WhatsApp</a>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
              <div className="font-medium text-emerald-950">Email</div>
              <a className="mt-1 block underline" href="mailto:hello@delightfulnaturals.co.za">hello@delightfulnaturals.co.za</a>
              <p className="mt-2 text-sm text-emerald-900/80">We usually reply within 24 hours.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ——————————————————————————————————————————————
// Support Section — help topics & quick links
// ——————————————————————————————————————————————
function SupportSection() {
  const cards = [
    { t: 'Shipping & Delivery', d: 'Typical delivery in 2–4 business days. We’ll share courier options for your area at checkout.', icon: '🚚', link: '#faqs' },
    { t: 'Returns & Exchanges', d: 'Unopened items within 14 days. If something’s wrong, we’ll make it right — just reach out.', icon: '↩️', link: 'mailto:hello@delightfulnaturals.co.za' },
    { t: 'Order Help', d: 'Need to change your address or track a parcel? Message us on WhatsApp and we’ll assist.', icon: '💬', link: 'https://wa.me/27672943837' },
  ];

  return (
    <section id="support" className="relative">
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-emerald-950">Support</h2>
          <p className="mt-2 text-emerald-900/80">Quick links to common topics.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {cards.map((c, i) => (
            <motion.a key={c.t} href={c.link} target={c.link.startsWith('http') ? '_blank' : undefined} rel={c.link.startsWith('http') ? 'noreferrer' : undefined} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.06 }} className="block bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition">
              <div className="text-2xl">{c.icon}</div>
              <div className="mt-2 font-semibold text-emerald-950">{c.t}</div>
              <p className="text-sm mt-1 text-emerald-900/80">{c.d}</p>
              <span className="mt-3 inline-flex text-emerald-700 text-sm">Learn more →</span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ——————————————————————————————————————————————
// Quote block (soft float)
// ——————————————————————————————————————————————
function QuoteBlock() {
  return (
    <section className="relative">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="rounded-3xl border bg-white p-8 shadow-sm text-center">
          <p className="text-lg text-emerald-950">“We source organically grown botanicals and bottle in small batches to keep every drop potent and fresh.”</p>
          <div className="mt-3 text-sm text-emerald-900/80">— Sister Lesley</div>
        </motion.div>
      </div>
    </section>
  );
}

// ——————————————————————————————————————————————
// Newsletter CTA (animated shine on button)
// ——————————————————————————————————————————————
function NewsletterCTA() {
  const [submitting, setSubmitting] = useState(false);
  return (
    <section className="relative">
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-emerald-50 to-amber-50 p-8 md:p-12">
          <motion.div aria-hidden className="absolute -top-10 -right-10 h-60 w-60 rounded-full blur-3xl pointer-events-none -z-10" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(16,185,129,0.22), rgba(234,179,8,0.18))' }} animate={{ x: [0, 10, -6, 0], y: [0, 6, -10, 0] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.h3 {...revealProps} className="text-2xl md:text-3xl font-bold text-emerald-950">Subscribe to our Newsletter</motion.h3>
          <motion.p {...revealProps} transition={{ delay: 0.06 }} className="mt-2 text-emerald-900/80 max-w-xl">Tips for healthy hair care, exclusive promos, and new product drops. No spam.</motion.p>
          <motion.form {...revealProps} transition={{ delay: 0.12 }} onSubmit={(e)=>{ e.preventDefault(); setSubmitting(true); setTimeout(()=>setSubmitting(false), 1500); }} className="mt-6 flex flex-col sm:flex-row gap-3">
            <input type="email" required placeholder="Enter your email" className="flex-1 rounded-xl border px-4 py-3 bg-white/80 backdrop-blur shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="relative inline-flex overflow-hidden rounded-xl px-6 py-3 bg-emerald-600 text-white shadow">
              <span className="relative z-10">{submitting ? 'Thanks!' : 'Subscribe'}</span>
              <motion.span aria-hidden initial={{ x: '-120%' }} animate={{ x: '120%' }} transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }} className="absolute inset-y-0 left-0 w-1/3 skew-x-[-20deg] bg-white/30" />
            </motion.button>
          </motion.form>
        </div>
      </div>
    </section>
  );
}

// ——————————————————————————————————————————————
// Footer
// ——————————————————————————————————————————————
function Footer() {
  return (
    <footer className="bg-emerald-900 text-emerald-50 mt-10">
      <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-4 gap-6 text-sm">
        <div>
          <div className="flex items-center gap-2">
            <img src="/logo.png" className="w-8 h-8 rounded" alt="logo" />
            <span className="font-semibold">Delightful Naturals</span>
          </div>
          <p className="mt-3 text-emerald-100/80">Mega Potent Hair Growth Oil & Scalp Detox Oil.</p>
          <div className="mt-3 flex gap-3 text-xl">
            <span>🌿</span><span>💧</span><span>✨</span>
          </div>
        </div>
        <div>
          <div className="font-semibold">Quick Links</div>
          <ul className="mt-2 space-y-1">
            <li><a href="#" className="hover:underline">Company</a></li>
            <li><a href="#new" className="hover:underline">Products</a></li>
            <li><a href="#best" className="hover:underline">Best Sellers</a></li>
            <li><a href="#faqs" className="hover:underline">FAQ</a></li>
            <li><a href="#support" className="hover:underline">Support</a></li>
            <li><Link href="/shop" className="hover:underline">Shop</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold">Help</div>
          <ul className="mt-2 space-y-1">
            <li><a href="#faqs" className="hover:underline">FAQ</a></li>
            <li><a href="#contact" className="hover:underline">Contact</a></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold">Contact</div>
          <p className="mt-2">
            Phone: <a className="underline" href="tel:+27672943837">+27 67 294 3837</a><br/>
            Email: <a className="underline" href="mailto:hello@delightfulnaturals.co.za">hello@delightfulnaturals.co.za</a>
          </p>
        </div>
      </div>
      <div className="border-top border-emerald-800 py-4 text-center text-xs text-emerald-100/80">© {new Date().getFullYear()} Delightful Naturals. All rights reserved.</div>
    </footer>
  );
}
