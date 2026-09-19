import { Clock } from 'lucide-react'

const STATUS_LABELS = {
  1: 'Chờ xác nhận',
  2: 'Đã xác nhận',
  3: 'Chờ lấy hàng',
  4: 'Chờ giao hàng',
  5: 'Đã hủy',
  6: 'Giao hàng thành công',
  7: 'Yêu cầu trả hàng',
  8: 'Đã trả hàng',
  9: 'Giao hàng không thành công',
}

/**
 * Customer-facing order updates. The API already filters internal notes, but
 * we keep the defensive check here so a private note can never leak in the UI.
 */
export default function OrderCustomerNotes({ history }) {
  const notes = (history || []).filter((entry) => (
    entry
    && entry.khachHangXem !== false
    && entry.ghiChu
    && String(entry.ghiChu).trim()
  ))

  if (!notes.length) return null

  return (
    <section className="bg-white rounded-xl border border-stone/10 p-5 mb-4">
      <h2 className="text-sm font-bold text-ink uppercase tracking-wide mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-gold" /> CẬP NHẬT ĐƠN HÀNG
      </h2>
      <div className="relative space-y-4 pl-1">
        {notes.map((entry, index) => {
          const time = entry.thoiGian
            ? new Date(entry.thoiGian).toLocaleString('vi-VN')
            : null
          const statusLabel = STATUS_LABELS[entry.trangThaiMoi]

          return (
            <div key={`${entry.maLichSu || entry.thoiGian || 'note'}-${index}`} className="relative flex gap-3">
              {index < notes.length - 1 && (
                <span className="absolute left-[5px] top-3 bottom-[-16px] w-px bg-gold/25" aria-hidden="true" />
              )}
              <span className="relative mt-1.5 h-2.5 w-2.5 rounded-full bg-gold ring-4 ring-gold/10 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold text-ink">
                    {statusLabel || 'Cập nhật đơn hàng'}
                  </span>
                  {time && <span className="text-xs text-stone">{time}</span>}
                </div>
                <p className="mt-1.5 rounded-lg bg-ivory-50 px-3 py-2 text-sm leading-relaxed text-ink-soft">
                  {String(entry.ghiChu).trim()}
                </p>
                <p className="mt-1 text-[11px] text-stone">Thông báo từ ZestStore</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
