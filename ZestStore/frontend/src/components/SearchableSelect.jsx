import { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown, X } from 'lucide-react'

/**
 * Combobox có ô tìm kiếm: gõ để lọc, bấm để chọn.
 * options: [{ id, name }], value: id đang chọn (0/'' = chưa chọn)
 */
export default function SearchableSelect({
  value,
  options = [],
  onChange,
  placeholder = 'Chọn...',
  searchPlaceholder = 'Gõ để tìm...',
  disabled = false,
  idKey = 'id',
  labelKey = 'name',
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const boxRef = useRef(null)

  const selected = options.find((o) => String(o[idKey]) === String(value) && String(value) !== '' && String(value) !== '0') || null

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open ])

  const q = query.trim().toLowerCase()
  const filtered = q
    ? options.filter((o) => String(o[labelKey] || '').toLowerCase().includes(q))
    : options

  const pick = (o) => {
    onChange?.(o[idKey], o[labelKey])
    setQuery('')
    setOpen(false)
  }

  const clear = (e) => {
    e.stopPropagation()
    onChange?.('', '')
    setQuery('')
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => { setQuery(''); setOpen((v) => !v) }}
        className="w-full border border-stone/20 rounded-lg px-3 py-2.5 text-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold disabled:bg-stone/5 flex items-center justify-between gap-2"
      >
        <span className={`truncate ${selected ? 'text-ink' : 'text-stone'}`}>
          {selected ? selected[labelKey] : placeholder}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {selected && !disabled && (
            <span onClick={clear} className="text-stone hover:text-bordeaux cursor-pointer">
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className={`h-4 w-4 text-stone transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {open && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-stone/20 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-stone/10 flex items-center gap-2">
            <Search className="h-4 w-4 text-stone shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full text-sm outline-none bg-transparent"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <p className="text-xs text-stone text-center py-3">Không tìm thấy</p>
            )}
            {filtered.map((o) => (
              <button
                key={o[idKey]}
                type="button"
                onClick={() => pick(o)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gold/10 transition ${String(o[idKey]) === String(value) ? 'bg-gold/10 font-medium text-gold' : ''}`}
              >
                {o[labelKey]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
