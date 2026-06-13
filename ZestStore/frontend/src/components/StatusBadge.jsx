const styles = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  shipping: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
}

const labels = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
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
