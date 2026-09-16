import { useState, useEffect, useRef, useCallback } from 'react'
import { getNotifications, getUnreadCount } from '../api/notifications'

export function useNotificationStream({ onNotification } = {}) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [connected, setConnected] = useState(false)
  const esRef = useRef(null)
  const pollRef = useRef(null)

  const fetchUnread = useCallback(async () => {
    try {
      const res = await getUnreadCount()
      setUnreadCount(res.count ?? 0)
    } catch {}
  }, [])

  const fetchList = useCallback(async () => {
    try {
      const list = await getNotifications()
      setNotifications(list)
    } catch {}
  }, [])

  useEffect(() => {
    fetchUnread()
    fetchList()
  }, [fetchUnread, fetchList])

  useEffect(() => {
    let es

    const startSSE = () => {
      es = new EventSource('/api/notifications/stream')
      esRef.current = es

      es.addEventListener('connected', () => {
        setConnected(true)
        if (pollRef.current) {
          clearInterval(pollRef.current)
          pollRef.current = null
        }
      })

      es.addEventListener('notification', (e) => {
        try {
          const data = JSON.parse(e.data)
          setNotifications(prev => [data, ...prev])
          setUnreadCount(prev => prev + 1)
          onNotification?.(data)
        } catch {}
      })

      es.onerror = () => {
        setConnected(false)
        es?.close()

        if (!pollRef.current) {
          pollRef.current = setInterval(() => {
            fetchUnread()
            fetchList()
          }, 30000)
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
  }, [fetchUnread, fetchList, onNotification])

  const markRead = useCallback((id) => {
    setNotifications(prev => prev.map(n =>
      n.maThongBao === id ? { ...n, daDoc: true } : n
    ))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const refreshAll = useCallback(() => { fetchList(); fetchUnread() }, [fetchList, fetchUnread])

  return { notifications, unreadCount, connected, refresh: refreshAll, markRead }
}
