import { useState, useEffect, useRef } from 'react'

export function useOrderStream(orderId, { onUpdate, onError } = {}) {
  const [connected, setConnected] = useState(false)
  const esRef = useRef(null)
  const pollRef = useRef(null)
  const lastStatusRef = useRef(null)

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
          if (data.trangThaiMoi && data.trangThaiMoi !== lastStatusRef.current) {
            lastStatusRef.current = data.trangThaiMoi
            onUpdate?.(data)
          }
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
                const newStatus = data.order?.trangThaiDon
                if (newStatus && newStatus !== lastStatusRef.current) {
                  lastStatusRef.current = newStatus
                  onUpdate?.({ trangThaiMoi: newStatus, source: 'poll' })
                }
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
