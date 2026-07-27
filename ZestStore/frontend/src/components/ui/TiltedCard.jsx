import { useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const springValues = { damping: 30, stiffness: 100, mass: 2 }

export default function TiltedCard({ imageSrc, altText = 'Tilted card image', containerHeight = '300px', containerWidth = '100%', imageHeight = '300px', imageWidth = '300px', scaleOnHover = 1.05, rotateAmplitude = 14, overlayContent = null, displayOverlayContent = false }) {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(useMotionValue(0), springValues)
  const rotateY = useSpring(useMotionValue(0), springValues)
  const scale = useSpring(1, springValues)

  function handleMouse(e) {
    if (reduced || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const offsetX = e.clientX - rect.left - rect.width / 2
    const offsetY = e.clientY - rect.top - rect.height / 2
    rotateX.set((offsetY / (rect.height / 2)) * -rotateAmplitude)
    rotateY.set((offsetX / (rect.width / 2)) * rotateAmplitude)
    x.set(e.clientX - rect.left)
    y.set(e.clientY - rect.top)
  }

  function handleMouseEnter() { if (!reduced) scale.set(scaleOnHover) }
  function handleMouseLeave() { scale.set(1); rotateX.set(0); rotateY.set(0) }

  return (
    <figure ref={ref} className="relative w-full h-full [perspective:800px] flex flex-col items-center justify-center" style={{ height: containerHeight, width: containerWidth }}
      onMouseMove={handleMouse} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <motion.div className="relative [transform-style:preserve-3d]" style={{ width: imageWidth, height: imageHeight, rotateX, rotateY, scale }}>
        <motion.img src={imageSrc} alt={altText} className="absolute top-0 left-0 object-cover rounded-[15px] will-change-transform [transform:translateZ(0)]" style={{ width: imageWidth, height: imageHeight }} />
        {displayOverlayContent && overlayContent && <motion.div className="absolute top-0 left-0 z-[2] will-change-transform [transform:translateZ(30px)]">{overlayContent}</motion.div>}
      </motion.div>
    </figure>
  )
}
