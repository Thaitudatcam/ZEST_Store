import { useState, useEffect } from 'react'

const DAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

export default function RealtimeClock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const pad = (n) => n.toString().padStart(2, '0')
  const h = now.getHours()
  const m = now.getMinutes()
  const s = now.getSeconds()
  const day = DAYS[now.getDay()]
  const date = now.toLocaleDateString('vi-VN')

  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-bold text-gold tabular-nums leading-tight">
        {pad(h)}:{pad(m)}:{pad(s)}
      </span>
      <span className="text-xs text-dark-muted mt-0.5">{day}, {date}</span>
    </div>
  )
}