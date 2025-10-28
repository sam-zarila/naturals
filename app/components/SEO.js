import Head from 'next/head'
import { useRouter } from 'next/router'

const SEO = ({
  title = "Your Default Site Title",
  description = "Your default site description",
  canonicalUrl,
  ogType = "website",
  ogImage = "/default-og-image.jpg",
  structuredData,
  noindex = false,
  children
}) => {
  const router = useRouter()
  const pageUrl = canonicalUrl || `${process.env.NEXT_PUBLIC_SITE_URL}${router.asPath}`

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={pageUrl} />
      
      {/* Robots */}
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow"} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Your Site Name" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      )}
      
      {children}
    </Head>
  )
}

export default SEO