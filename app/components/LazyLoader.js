import { useEffect, useRef } from 'react'

const LazyLoader = ({ onVisible, children }) => {
  const ref = useRef()

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onVisible?.()
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [onVisible])

  return <div ref={ref}>{children}</div>
}

export default LazyLoader