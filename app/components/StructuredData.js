// components/StructuredData.js
export const WebsiteSchema = ({ url, name, description }) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  url,
  name,
  description,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${url}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string'
  }
})

export const OrganizationSchema = ({ url, name, logo, sameAs = [] }) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  url,
  name,
  logo,
  sameAs
})

export const BlogPostSchema = ({ title, description, url, image, datePublished, dateModified, author }) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: title,
  description,
  url,
  image: [image],
  datePublished,
  dateModified: dateModified || datePublished,
  author: {
    '@type': 'Person',
    name: author
  }
})