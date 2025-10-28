import type { NextConfig } from "next";


const nextConfig = {
  trailingSlash: true, // Better for SEO
  compress: true,
  poweredByHeader: false, // Remove for security
  images: {
    domains: ['https://delightfulnaturals.co.za/'], // Add your image domains
    formats: ['image/webp', 'image/avif'], // Modern formats
  },
  experimental: {
    optimizeCss: true,
  },
}

module.exports = nextConfig