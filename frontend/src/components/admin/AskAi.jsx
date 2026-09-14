import { useState, useRef, useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import AiChatPanel from '../../components/AiChatPanel'

const QUICK_PROMPTS = [
  { type: 'analytics', text: 'Doanh thu hôm nay', question: 'Doanh thu hôm nay là bao nhiêu?' },
  { type: 'analytics', text: 'Đơn hàng chờ xử lý', question: 'Có bao nhiêu đơn hàng đang chờ xử lý?' },
  { type: 'analytics', text: 'Sản phẩm bán chạy', question: 'Sản phẩm bán chạy nhất là gì?' },
]

export default function AskAi() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'Escape') { setOpen(false); document.activeElement?.blur() }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  return (
    <div className="relative shrink-0" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium shrink-0 transition-all duration-200 ${
          open ? 'border-gold ring-2 ring-gold/20 bg-white text-gold' : 'border-noir-600/15 bg-ivory-100/50 text-gold-dark hover:text-gold hover:border-gold'
        }`}>
        <Sparkles className="h-4 w-4" />
        Ask AI
      </button>

      <div className={`fixed inset-x-0 top-16 bottom-0 z-50 sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:mt-2 sm:h-[600px] sm:w-[480px] sm:rounded-2xl sm:shadow-2xl sm:max-w-[calc(100vw-2rem)] transition-all duration-200 ${
        open ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
      }`}>
        <AiChatPanel open={open} onClose={() => setOpen(false)} quickPrompts={QUICK_PROMPTS} />
      </div>
    </div>
  )
}
