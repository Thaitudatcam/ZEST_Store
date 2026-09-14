import { useState, useRef, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNotificationStream } from '../hooks/useNotificationStream'
import { markAsRead, markAllRead } from '../api/notifications'

function timeAgo(dateStr) {
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Vừa xong'
  if (mins < 60) return mins + ' phút trước'
  const hours = Math.floor(mins / 60)
  if (hours < 24) return hours + ' giờ trước'
  const days = Math.floor(hours / 24)
  if (days < 30) return days + ' ngày trước'
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

export default function NotificationBell({ className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  const { notifications, unreadCount, refresh, markRead } = useNotificationStream()

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleClick = async (n) => {
    if (!n.daDoc) {
      markRead(n.maThongBao)
      await markAsRead(n.maThongBao).catch(() => {})
    }
    setOpen(false)
    if (n.lienKet) navigate(n.lienKet)
  }

  const handleMarkAll = async () => {
    await markAllRead().catch(() => {})
    refresh()
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className={`relative flex items-center justify-center w-9 h-9 rounded-full text-ink-soft hover:text-noir hover:bg-noir/5 transition ${className}`}
        aria-label="Thông báo">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-bordeaux text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none animate-scale-in">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-beige-light border border-beige-deep/40 rounded-2xl shadow-lux z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-beige-deep/40">
            <h3 className="text-sm font-semibold text-ink">Thông báo</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAll}
                className="text-xs text-gold-dark hover:text-gold font-medium">
                Đọc tất cả
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-stone text-sm flex flex-col items-center gap-2">
                <BellOff className="h-6 w-6 text-beige-deep" />
                Chưa có thông báo nào
              </div>
            ) : (
              notifications.map((n) => (
                <button key={n.maThongBao} onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-beige-deep/30 hover:bg-beige transition-colors flex items-start gap-3 ${!n.daDoc ? 'bg-white/60' : ''}`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.daDoc ? 'bg-bordeaux' : 'bg-transparent'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">{n.tieuDe}</p>
                    <p className="text-xs text-stone mt-0.5 line-clamp-2">{n.noiDung}</p>
                    <p className="text-[10px] text-stone-light mt-1">{timeAgo(n.ngayTao)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
