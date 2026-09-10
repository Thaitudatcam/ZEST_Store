import { X, CirclePlus, User } from 'lucide-react'

export default function OrderTabs({ orders, currentIdx, onSwitch, onAdd, onRemove }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {orders.map((o, i) => {
        const isActive = i === currentIdx
        const orderCode = `HD${String(i + 1).padStart(3, '0')}`
        const customerName = o.customer?.hoTen || 'Khách lẻ'
        return (
          <div key={o.id}
            onClick={() => onSwitch(i)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all whitespace-nowrap border ${
              isActive
                ? 'bg-[var(--primary-color)] text-white border-[var(--primary-color)] shadow-sm'
                : 'bg-white text-ink border-stone/20 hover:border-[var(--primary-color)]'
            }`}>
            <span className="max-w-[200px] truncate">{orderCode} - {customerName}</span>
            {o.customer && (
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isActive ? 'bg-white/20' : 'bg-[var(--primary-bg)] text-[var(--primary-color)]'}`}>
                <User className="h-3 w-3" />
              </span>
            )}
            {orders.length > 1 && (
              <button onClick={(e) => { e.stopPropagation(); onRemove(i) }}
                className={`ml-1 transition p-0.5 rounded ${isActive ? 'text-white/70 hover:text-white hover:bg-white/20' : 'text-stone/50 hover:text-bordeaux hover:bg-bordeaux/10'}`}
                aria-label="Đóng đơn">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )
      })}
      <button onClick={onAdd}
        className="p-2 text-stone hover:text-[var(--primary-color)] hover:bg-[var(--primary-bg)] rounded-xl transition-all"
        aria-label="Tạo đơn mới">
        <CirclePlus className="h-5 w-5" />
      </button>
    </div>
  )
}
