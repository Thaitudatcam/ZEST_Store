import { useRef, useState } from 'react'

export default function SpotlightCard({ children, className = '', spotlightColor = 'rgba(255, 255, 255, 0.25)' }) {
  const divRef = useRef(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)

  const handleMouseMove = e => {
    if (!divRef.current) return
    const rect = divRef.current.getBoundingClientRect()
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  return (
    <div ref={divRef} onMouseMove={handleMouseMove} onMouseEnter={() => setOpacity(0.6)} onMouseLeave={() => setOpacity(0)}
      className={`relative rounded-3xl overflow-hidden ${className}`}>
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-in-out"
        style={{ opacity, background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)` }} />
      {children}
    </div>
  )
}
