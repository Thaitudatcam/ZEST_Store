const styles = {
  1: 'bg-amber-100 text-amber-800 border-amber-200',
  2: 'bg-blue-100 text-blue-800 border-blue-200',
  3: 'bg-purple-100 text-purple-800 border-purple-200',
  4: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  5: 'bg-rose-100 text-rose-800 border-rose-200',
  6: 'bg-teal-100 text-teal-800 border-teal-200',
  7: 'bg-orange-100 text-orange-800 border-orange-200',
  8: 'bg-gray-200 text-gray-700 border-gray-300',
  9: 'bg-neutral-100 text-neutral-800 border-neutral-300',
}

const labels = {
  1: 'Chờ xác nhận',
  2: 'Đã xác nhận',
  3: 'Chờ lấy hàng',
  4: 'Chờ giao hàng',
  5: 'Đã hủy',
  6: 'Đã giao hàng',
  7: 'Yêu cầu trả hàng',
  8: 'Đã trả hàng',
  9: 'Không nhận hàng',
}

const posLabels = {
  1: 'Tạo đơn',
  6: 'Hoàn thành',
}

export default function StatusBadge({ status, loaiDonHang }) {
  const s = Number(status)
  const isPos = loaiDonHang === 2
  const label = isPos && posLabels[s] ? posLabels[s] : labels[s]
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${styles[s] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {label || status}
    </span>
  )
}

const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

export { VND, labels, styles }
