import { useState, useRef, useEffect } from 'react'
import { Search, Sparkles, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AiChatPanel from '../../components/AiChatPanel'

const QUICK_PROMPTS = [
  { type: 'analytics', text: 'Doanh thu hôm nay', question: 'Doanh thu hôm nay là bao nhiêu?' },
  { type: 'analytics', text: 'Đơn hàng chờ xử lý', question: 'Có bao nhiêu đơn hàng đang chờ xử lý?' },
  { type: 'analytics', text: 'Sản phẩm bán chạy', question: 'Sản phẩm bán chạy nhất là gì?' },
]

export default function AskAi() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const q = search.trim()
    if (!q) return
    navigate(`/admin/products?keyword=${encodeURIComponent(q)}`)
  }

  const clearSearch = () => {
    setSearch('')
    navigate('/admin/products', { replace: true })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setOpen(false); document.activeElement?.blur() }
  }

  return (
    <div className="relative flex-1 max-w-xl min-w-0" ref={ref}>
      <div className={`flex items-center rounded-xl border transition-all duration-200 ${
        open ? 'border-gold ring-2 ring-gold/20 bg-white' : 'border-noir-600/15 bg-ivory-100/50'
      }`}>
        <Search className="h-4 w-4 text-stone-light ml-3.5 shrink-0" />
        <form onSubmit={handleSearchSubmit} className="flex flex-1 min-w-0">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm kiếm..."
            className="flex-1 bg-transparent text-sm text-ink placeholder-stone-light outline-none px-3 py-2.5 min-w-0"
          />
        </form>
        {search && (
          <button type="button" onClick={clearSearch}
            className="p-1 text-stone-light hover:text-stone mr-0.5 shrink-0">
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="w-px self-stretch my-2 bg-stone/15 shrink-0" />
        <button type="button" onClick={() => setOpen((o) => !o)}
          className={`flex items-center gap-1.5 pl-3 pr-4 py-2.5 text-sm font-medium shrink-0 transition-colors ${
            open ? 'text-gold' : 'text-gold-dark hover:text-gold'
          }`}>
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Ask AI</span>
        </button>
      </div>

      <div className={`fixed inset-x-0 top-16 bottom-0 z-50 sm:absolute sm:inset-auto sm:top-full sm:left-0 sm:mt-2 sm:h-[600px] sm:w-[480px] sm:rounded-2xl sm:shadow-2xl sm:max-w-[calc(100vw-2rem)] transition-all duration-200 ${
        open ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
      }`}>
        <AiChatPanel open={open} onClose={() => setOpen(false)} quickPrompts={QUICK_PROMPTS} />
      </div>
    </div>
  )
}
