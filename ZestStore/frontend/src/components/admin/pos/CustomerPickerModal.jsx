import { useState, useEffect, useRef } from 'react'
import { X, Search, UserPlus } from 'lucide-react'
import { posApi } from './apiClient'

export default function CustomerPickerModal({ open, onClose, onSelect }) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickForm, setQuickForm] = useState({ hoTen: '', soDienThoai: '', email: '' })
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200)
      setSearch('')
      setResults([])
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!search.trim() || search.trim().length < 2) { setResults([]); return }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await posApi.searchCustomers(search.trim())
        setResults(Array.isArray(res) ? res : [])
      } catch { setResults([]) }
      setSearching(false)
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [search, open])

  const handleQuickAdd = async () => {
    if (!quickForm.hoTen.trim()) return
    setSaving(true)
    try {
      const res = await posApi.createCustomer({ ...quickForm, nguonTao: 'POS_QUICK' })
      onSelect(res)
      setShowQuickAdd(false)
      setQuickForm({ hoTen: '', soDienThoai: '', email: '' })
      onClose()
    } catch { }
    setSaving(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose} role="dialog" aria-modal="true" aria-label="Chọn khách hàng">
      <div className="bg-ivory rounded-2xl max-w-md w-full mx-4 shadow-2xl animate-scale-in"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone/10">
          <h3 className="font-bold text-lg">Chọn khách hàng</h3>
          <button onClick={onClose} className="p-1.5 text-stone hover:text-ink hover:bg-ivory-100 rounded-lg transition" aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
            <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm tên, email hoặc SĐT..."
              className="w-full pl-10 pr-4 py-2.5 border border-stone/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] bg-white" />
          </div>

          <button onClick={() => setShowQuickAdd(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-[var(--primary-color)] text-[var(--primary-color)] rounded-xl text-sm font-semibold hover:bg-[var(--primary-bg)] transition">
            <UserPlus className="h-4 w-4" /> Thêm khách hàng nhanh
          </button>

          {searching && <p className="text-xs text-stone text-center">Đang tìm...</p>}

          {results.length > 0 && (
            <div className="max-h-60 overflow-y-auto border border-stone/10 rounded-xl divide-y">
              {results.map(c => (
                <button key={c.maNguoiDung} onClick={() => { onSelect(c); onClose() }}
                  className="w-full text-left px-4 py-3 hover:bg-[var(--primary-bg)] transition">
                  <p className="text-sm font-semibold">{c.hoTen}</p>
                  <p className="text-xs text-stone">{c.email}{c.soDienThoai ? ` - ${c.soDienThoai}` : ''}</p>
                </button>
              ))}
            </div>
          )}

          {search.trim().length >= 2 && !searching && results.length === 0 && (
            <p className="text-xs text-stone text-center">Không tìm thấy khách hàng</p>
          )}

          {showQuickAdd && (
            <div className="border border-stone/10 rounded-xl p-4 space-y-3 bg-white">
              <p className="text-sm font-semibold">Thêm khách hàng nhanh</p>
              <input value={quickForm.hoTen} onChange={e => setQuickForm(f => ({ ...f, hoTen: e.target.value }))}
                placeholder="Họ tên *" className="w-full border border-stone/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
              <input value={quickForm.soDienThoai} onChange={e => setQuickForm(f => ({ ...f, soDienThoai: e.target.value }))}
                placeholder="Số điện thoại" className="w-full border border-stone/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
              <input value={quickForm.email} onChange={e => setQuickForm(f => ({ ...f, email: e.target.value }))}
                placeholder="Email (tự động nếu để trống)" className="w-full border border-stone/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
              <div className="flex gap-2">
                <button onClick={() => setShowQuickAdd(false)} className="flex-1 py-2 border border-stone/20 rounded-lg text-sm font-medium hover:bg-ivory-100 transition">Hủy</button>
                <button onClick={handleQuickAdd} disabled={saving || !quickForm.hoTen.trim()}
                  className="flex-1 py-2 bg-[var(--primary-color)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--primary-hover)] transition disabled:opacity-50">
                  {saving ? 'Đang lưu...' : 'Thêm'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
