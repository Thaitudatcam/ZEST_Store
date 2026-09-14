import { useRef, useState, useEffect } from 'react'

export default function FadeContent({ children, blur = false, duration = 1000, delay = 0, y = 50, className = '' }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay)
          observer.unobserve(el)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : `translateY(${y}px)`,
        filter: blur && !visible ? 'blur(8px)' : 'none',
        transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out${blur ? `, filter ${duration}ms ease-out` : ''}`,
      }}
    >
      {children}
    </div>
  )
}
