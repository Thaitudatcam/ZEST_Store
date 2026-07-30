import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

export default function AskAi() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setFocused(false) }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setResult(null)
    setOpen(true)
    try {
      const res = await api.post('/ai/analytics/ask', { question: query.trim() }).then(r => r.data)
      setResult(res)
    } catch {
      setResult({ answer: 'Không thể kết nối AI, vui lòng thử lại sau.' })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e)
    if (e.key === 'Escape') { setOpen(false); setFocused(false); document.activeElement?.blur() }
  }

  const close = () => { setOpen(false); setResult(null); setQuery('') }

  return (
    <div className="relative flex-1 max-w-xl" ref={ref}>
      <form onSubmit={handleSubmit}>
        <div className={`relative flex items-center transition-all duration-200 rounded-xl border ${
          focused ? 'border-gold ring-2 ring-gold/20 bg-white' : 'border-noir-600/15 bg-ivory-100/50'
        }`}>
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={focused ? 'Hỏi AI về doanh thu, đơn hàng, sản phẩm...' : 'Tìm kiếm...'}
            className="flex-1 bg-transparent text-sm text-ink placeholder-stone-light outline-none px-3.5 py-2.5 min-w-0"
          />
          {query && (
            <button type="button" onClick={() => { setQuery(''); setResult(null) }}
              className="p-1 text-stone-light hover:text-stone mr-0.5">
              <X className="h-4 w-4" />
            </button>
          )}
          <button type="submit" disabled={loading || !query.trim()}
            className="p-2 text-gold-dark hover:text-gold disabled:opacity-40 transition-colors">
            <Sparkles className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />
          </button>
        </div>
      </form>

      {open && (result || loading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-ivory border border-gold/15 rounded-2xl shadow-xl z-50 overflow-hidden">
          {loading ? (
            <div className="px-4 py-6 flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-2 h-2 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: '0.15s' }} />
              <div className="w-2 h-2 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
          ) : result ? (
            <div>
              <div className="px-4 py-3.5 text-sm text-ink leading-relaxed">
                {result.answer}
              </div>
              {result.lienKet && (
                <div className="px-4 pb-3.5">
                  <button onClick={() => { navigate(result.lienKet); close() }}
                    className="flex items-center gap-1.5 text-xs text-gold-dark hover:text-gold font-medium">
                    Xem chi tiết <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
