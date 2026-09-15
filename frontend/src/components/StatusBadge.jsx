const styles = {
  1: 'bg-gold/10 text-gold border-gold/20',
  2: 'bg-emerald-deep/10 text-emerald-deep border-emerald-deep/20',
  3: 'bg-royal/10 text-royal border-royal/20',
  4: 'bg-emerald-deep/10 text-emerald-deep border-emerald-deep/20',
  5: 'bg-bordeaux/10 text-bordeaux border-bordeaux/20',
  6: 'bg-emerald-deep/10 text-emerald-deep border-emerald-deep/20',
  9: 'bg-stone/10 text-stone border-stone/20',
}

const labels = {
  1: 'Chờ xác nhận',
  2: 'Đã xác nhận',
  3: 'Chờ lấy hàng',
  4: 'Chờ giao hàng',
  5: 'Đã hủy',
  6: 'Giao hàng thành công',
  9: 'Giao hàng không thành công',
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
    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${styles[s] || 'bg-stone/10 text-stone border-stone/20'}`}>
      {label || status}
    </span>
  )
}

const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

export { VND, labels, styles }
