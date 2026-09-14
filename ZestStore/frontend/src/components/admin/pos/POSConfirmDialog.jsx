import { Loader, X, AlertTriangle } from 'lucide-react'

const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

export default function POSConfirmDialog({
  open,
  loaiDon = 'TAI_QUAY',
  tienHang = 0,
  giamGia = 0,
  tongPhaiTra = 0,
  hinhThucThanhToan = 'Tiền mặt',
  khachThanhToan = 0,
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onCancel}>
      <div className="bg-ivory rounded-2xl max-w-sm w-full mx-4 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h3 className="font-bold text-lg text-ink">Xác nhận đặt hàng</h3>
          <button onClick={onCancel} className="p-1 text-stone hover:text-ink transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 pb-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-stone">Loại đơn</span>
            <span className="font-semibold text-ink">{loaiDon === 'GIAO_HANG' ? 'Giao hàng' : 'Tại quầy'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone">Tiền hàng</span>
            <span className="font-semibold text-ink">{VND(tienHang)}</span>
          </div>
          {giamGia > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-stone">Giảm giá</span>
              <span className="font-semibold text-bordeaux">-{VND(giamGia)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm pt-2 border-t border-stone/10">
            <span className="font-bold text-ink">Tổng phải trả</span>
            <span className="font-bold text-[var(--primary-color)] text-base">{VND(tongPhaiTra)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone">Hình thức thanh toán</span>
            <span className="font-semibold text-ink">{hinhThucThanhToan}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone">Khách thanh toán</span>
            <span className="font-semibold text-ink">{VND(khachThanhToan)}</span>
          </div>
        </div>

        <div className="mx-6 mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">Bạn có chắc muốn xác nhận? Sau khi xác nhận, hệ thống sẽ xử lý đơn và cấp phiếu nhập kho.</p>
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 border border-stone/20 rounded-xl text-sm font-medium text-stone hover:bg-ivory-100 transition">
            Hủy
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 bg-gold text-noir rounded-xl text-sm font-bold hover:bg-gold-hover transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader className="h-4 w-4 animate-spin" /> : 'XÁC NHẬN'}
          </button>
        </div>
      </div>
    </div>
  )
}
