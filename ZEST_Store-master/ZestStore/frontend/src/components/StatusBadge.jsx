const styles = {
  1: 'bg-amber-100 text-amber-800 border-amber-200',
  2: 'bg-blue-100 text-blue-800 border-blue-200',
  3: 'bg-purple-100 text-purple-800 border-purple-200',
  4: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  5: 'bg-rose-100 text-rose-800 border-rose-200',
}

const labels = {
  1: 'Chờ xác nhận',
  2: 'Đã xác nhận',
  3: 'Đang giao',
  4: 'Đã giao',
  5: 'Đã hủy',
}

export default function StatusBadge({ status }) {
  const s = Number(status)
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${styles[s] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {labels[s] || status}
    </span>
  )
}

const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

export { VND, labels, styles }