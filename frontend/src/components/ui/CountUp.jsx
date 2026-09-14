import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

export default function CountUp({ to = 0, from = 0, direction = 'up', delay = 0, duration = 2, className = '', startWhen = true, separator = '', onStart, onEnd }) {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState(0)
  const observerRef = useRef(null)
  const frameRef = useRef(null)
  const hasAnimated = useRef(false)

  const getDecimalPlaces = num => { const str = num.toString(); if (str.includes('.')) { const decimals = str.split('.')[1]; if (parseInt(decimals) !== 0) return decimals.length } return 0 }
  const maxDecimals = Math.max(getDecimalPlaces(from), getDecimalPlaces(to))

  const formatValue = useCallback(latest => {
    const options = { useGrouping: !!separator, minimumFractionDigits: maxDecimals > 0 ? maxDecimals : 0, maximumFractionDigits: maxDecimals > 0 ? maxDecimals : 0 }
    const formattedNumber = Intl.NumberFormat('en-US', options).format(latest)
    return separator ? formattedNumber.replace(/,/g, separator) : formattedNumber
  }, [maxDecimals, separator])

  useEffect(() => {
    if (reduced) { setDisplay(to); return }
    setDisplay(direction === 'down' ? to : from)
  }, [reduced, to, from, direction])

  useEffect(() => {
    if (reduced || !startWhen || hasAnimated.current) return
    const el = ref.current
    if (!el) return

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          hasAnimated.current = true
          observerRef.current?.disconnect()
          const start = direction === 'down' ? to : from
          const end = direction === 'down' ? from : to
          const range = end - start
          let startTime = null

          const startDelay = setTimeout(() => {
            if (typeof onStart === 'function') onStart()
            const animate = (timestamp) => {
              if (!startTime) startTime = timestamp
              const elapsed = (timestamp - startTime) / 1000
              const progress = Math.min(elapsed / duration, 1)
              const eased = 1 - (1 - progress) * (1 - progress)
              const current = start + range * eased
              setDisplay(current)
              if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate)
              } else {
                setDisplay(end)
                if (typeof onEnd === 'function') onEnd()
              }
            }
            frameRef.current = requestAnimationFrame(animate)
          }, delay * 1000)

          return () => clearTimeout(startDelay)
        }
      },
      { threshold: 0 }
    )
    observerRef.current.observe(el)
    return () => { observerRef.current?.disconnect(); if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [reduced, startWhen, direction, from, to, delay, duration, onStart, onEnd])

  return <span className={className} ref={ref}>{formatValue(display)}</span>
}
