const styles = {
  cho_xac_nhan: 'bg-amber-100 text-amber-800 border-amber-200',
  da_xac_nhan: 'bg-blue-100 text-blue-800 border-blue-200',
  dang_giao: 'bg-purple-100 text-purple-800 border-purple-200',
  da_giao: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  da_huy: 'bg-rose-100 text-rose-800 border-rose-200',
}

const labels = {
  cho_xac_nhan: 'Chờ xác nhận',
  da_xac_nhan: 'Đã xác nhận',
  dang_giao: 'Đang giao',
  da_giao: 'Đã giao',
  da_huy: 'Đã hủy',
}

export default function StatusBadge({ status }) {
  const s = (status || '').toLowerCase()
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${styles[s] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {labels[s] || status}
    </span>
  )
}

const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

export { VND, labels, styles }
