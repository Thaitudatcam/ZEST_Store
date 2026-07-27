import { motion, useScroll, useSpring } from 'motion/react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

export default function ScrollProgress({ className = '' }) {
  const { scrollYProgress } = useScroll()
  const reduced = useReducedMotion()
  const scaleY = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })

  if (reduced) return null

  return <motion.div className={`fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 origin-left z-[9999] ${className}`} style={{ scaleY }} />
}
