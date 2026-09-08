import { X, CirclePlus } from 'lucide-react'

export default function OrderTabs({ orders, currentIdx, onSwitch, onAdd, onRemove }) {
  return (
    <div className="flex items-center gap-1 px-1 pt-2 overflow-x-auto scrollbar-hide">
      {orders.map((o, i) => {
        const total = o.cart.reduce((s, c) => s + c.gia * c.soLuong, 0)
        const isActive = i === currentIdx
        return (
          <div key={o.id}
            onClick={() => onSwitch(i)}
            className={`flex items-center gap-2 px-3 py-2 rounded-t-xl text-xs font-semibold cursor-pointer transition-all whitespace-nowrap border-b-2 ${
              isActive
                ? 'bg-white text-[var(--primary-color)] border-[var(--primary-color)] shadow-sm'
                : 'bg-transparent text-stone border-transparent hover:bg-white/60 hover:text-ink'
            }`}>
            <span className="max-w-[80px] truncate">Đơn {i + 1}</span>
            {o.cart.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--primary-bg)] text-[var(--primary-color)] font-bold">
                {new Intl.NumberFormat('vi-VN').format(total)}đ
              </span>
            )}
            {orders.length > 1 && (
              <button onClick={(e) => { e.stopPropagation(); onRemove(i) }}
                className="ml-1 text-stone/50 hover:text-bordeaux transition p-0.5 rounded hover:bg-bordeaux/10"
                aria-label="Đóng đơn">
                <X className="h-3 w-3" />
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
