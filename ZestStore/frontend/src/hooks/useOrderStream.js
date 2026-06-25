import { useState, useEffect, useRef, useCallback } from 'react'

export function useOrderStream(orderId, { onUpdate, onError } = {}) {
  const [connected, setConnected] = useState(false)
  const esRef = useRef(null)
  const pollRef = useRef(null)

  useEffect(() => {
    if (!orderId) return

    let es = null

    const startSSE = () => {
      es = new EventSource(`/api/orders/${orderId}/stream`)
      esRef.current = es

      es.addEventListener('connected', () => {
        setConnected(true)
        if (pollRef.current) {
          clearInterval(pollRef.current)
          pollRef.current = null
        }
      })

      es.addEventListener('order-update', (e) => {
        try {
          const data = JSON.parse(e.data)
          onUpdate?.(data)
        } catch {}
      })

      es.onerror = () => {
        setConnected(false)
        onError?.(null)
        es?.close()

        if (!pollRef.current) {
          pollRef.current = setInterval(() => {
            fetch(`/api/orders/${orderId}`)
              .then((r) => r.json())
              .then((data) => {
                onUpdate?.({ trangThaiMoi: data.order?.trangThaiDon, source: 'poll' })
              })
              .catch(() => {})
          }, 15000)
        }
      }
    }

    startSSE()

    return () => {
      es?.close()
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
      setConnected(false)
    }
  }, [orderId])

  return { connected }
}
