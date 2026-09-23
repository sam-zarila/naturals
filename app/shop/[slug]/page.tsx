import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopProductSection } from "../shop";

const PRODUCT_SLUGS = {
  "detox-60": {
    id: "detox-60" as const,
    title: "Scalp Detox Oil · 60ml",
    description:
      "Clarifying Scalp Detox Oil for a balanced, refreshed scalp. Shop Delightful Naturals in South Africa.",
  },
  "growth-100": {
    id: "growth-100" as const,
    title: "Hair Growth Oil · 100ml",
    description:
      "Natural Hair Growth Oil for stronger, healthier hair. Shop Delightful Naturals in South Africa.",
  },
  "scalp-detox-oil": {
    id: "detox-60" as const,
    title: "Scalp Detox Oil · 60ml",
    description:
      "Clarifying Scalp Detox Oil for a balanced, refreshed scalp. Shop Delightful Naturals in South Africa.",
  },
  "hair-growth-oil": {
    id: "growth-100" as const,
    title: "Hair Growth Oil · 100ml",
    description:
      "Natural Hair Growth Oil for stronger, healthier hair. Shop Delightful Naturals in South Africa.",
  },
} as const;

type ProductSlug = keyof typeof PRODUCT_SLUGS;

export function generateStaticParams() {
  return Object.keys(PRODUCT_SLUGS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = PRODUCT_SLUGS[slug as ProductSlug];
  if (!entry) {
    return { title: "Product not found | Delightful Naturals" };
  }
  return {
    title: `${entry.title} | Delightful Naturals`,
    description: entry.description,
    alternates: {
      canonical: `https://delightfulnaturals.co.za/shop/${slug}/`,
    },
  };
}

export default async function ShopProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = PRODUCT_SLUGS[slug as ProductSlug];
  if (!entry) notFound();

  return <ShopProductSection initialProductId={entry.id} />;
}
