import { useState, useEffect, useRef } from 'react'
import { X, Search, ChevronRight } from 'lucide-react'
import { posApi } from './apiClient'

export default function CustomerPickerModal({ open, onClose, onSelect }) {
  const [search, setSearch] = useState('')
  const [allCustomers, setAllCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setSearch('')
      setLoading(true)
      posApi.getCustomers().then(data => {
        setAllCustomers(Array.isArray(data) ? data : [])
        setLoading(false)
      }).catch(() => { setAllCustomers([]); setLoading(false) })
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const filtered = search.trim()
    ? allCustomers.filter(c => {
        const q = search.toLowerCase()
        return (c.hoTen || '').toLowerCase().includes(q) ||
               (c.soDienThoai || '').includes(q) ||
               (c.email || '').toLowerCase().includes(q)
      })
    : allCustomers

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose} role="dialog" aria-modal="true" aria-label="Chọn khách hàng">
      <div className="bg-ivory rounded-2xl max-w-md w-full mx-4 shadow-2xl animate-scale-in flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone/10">
          <h3 className="font-bold text-lg text-ink">Chọn khách hàng</h3>
          <button onClick={onClose} className="p-1.5 text-stone hover:text-ink hover:bg-stone/10 rounded-lg transition" aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
            <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo tên, số điện thoại..."
              className="w-full pl-10 pr-4 py-2.5 border border-stone/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] bg-white" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-2 min-h-[120px] max-h-[340px]">
          {loading && <p className="text-xs text-stone text-center py-4">Đang tải...</p>}

          {!loading && filtered.length > 0 && (
            <div className="divide-y divide-stone/10">
              {filtered.map(c => (
                <button key={c.maNguoiDung} onClick={() => { onSelect(c); onClose() }}
                  className="w-full flex items-center justify-between px-2 py-3.5 hover:bg-[var(--primary-bg)] rounded-lg transition group">
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-semibold text-ink truncate">{c.hoTen}</p>
                    {c.soDienThoai && <p className="text-xs text-stone mt-0.5">SĐT: {c.soDienThoai}</p>}
                  </div>
                  <ChevronRight className="h-4 w-4 text-stone/40 shrink-0 group-hover:text-[var(--primary-color)] transition" />
                </button>
              ))}
            </div>
          )}

          {!loading && search.trim() && filtered.length === 0 && (
            <p className="text-xs text-stone text-center py-4">Không tìm thấy khách hàng</p>
          )}
        </div>

        <div className="px-5 py-3 border-t border-stone/10 flex justify-end">
          <button onClick={onClose}
            className="px-5 py-2 border border-stone/20 rounded-xl text-sm font-semibold text-stone hover:bg-stone/5 transition">
            Hủy bỏ
          </button>
        </div>
      </div>
    </div>
  )
}
