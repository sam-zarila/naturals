import SEO from '../components/SEO'
import Link from 'next/link'

export default function Custom404() {
  return (
    <>
      <SEO
        title="Page Not Found - Your Site Name"
        description="The page you're looking for doesn't exist."
        noindex={true}
      />
      
      <div className="error-page">
        <h1>404 - Page Not Found</h1>
        <p>Sorry, the page you are looking for does not exist.</p>
        <Link href="/">
          <a>Return to Homepage</a>
        </Link>
      </div>
    </>
  )
}