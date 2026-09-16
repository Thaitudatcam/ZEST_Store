import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllOrders } from '../../api/admin'
import StatusBadge from '../../components/StatusBadge'
import { Search, Filter, Eye, Calendar, ChevronDown, Download, AlertTriangle, ClipboardList } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useToast } from '../../context/ToastContext'
import { SkeletonTable } from '../../components/Skeleton'
import AdminWorkspaceHeader from '../../components/admin/AdminWorkspaceHeader'

const PAYMENT_LABELS = { 1: 'COD', 2: 'VNPay', 3: 'MoMo', 4: 'ZaloPay', 5: 'Tiền mặt', 6: 'VietQR' }
const PAYMENT_STATUS_LABELS = { 1: 'Chờ TT', 2: 'Đã TT', 3: 'Thất bại' }

function PaymentInfo({ payments }) {
  if (!payments || payments.length === 0) return <span className="text-xs text-stone">—</span>
  const p = payments[0]
  const method = PAYMENT_LABELS[p.phuongThuc] || '?'
  const status = PAYMENT_STATUS_LABELS[p.trangThaiThanhToan] || '?'
  const color = p.trangThaiThanhToan === 2 ? 'text-emerald-deep' : p.trangThaiThanhToan === 3 ? 'text-bordeaux' : 'text-gold'
  return (
    <div className="text-xs">
      <span>{method}</span>
      <br />
      <span className={`font-semibold ${color}`}>{status}</span>
    </div>
  )
}

const ONLINE_STATUS_LIST = [
  { value: 0, label: 'Tất cả' },
  { value: 1, label: 'Chờ xác nhận' },
  { value: 2, label: 'Đã xác nhận' },
  { value: 3, label: 'Chờ lấy hàng' },
  { value: 4, label: 'Chờ giao hàng' },
  { value: 5, label: 'Đã hủy' },
  { value: 6, label: 'Đã giao hàng' },
  { value: 7, label: 'Yêu cầu trả hàng' },
  { value: 8, label: 'Đã trả hàng' },
]

const POS_STATUS_LIST = [
  { value: 0, label: 'Tất cả' },
  { value: 1, label: 'Chờ thanh toán' },
  { value: 6, label: 'Hoàn thành' },
  { value: 5, label: 'Đã hủy' },
]

const ALL_STATUS_LIST = [
  { value: 0, label: 'Tất cả trạng thái' },
  { value: 1, label: 'Chờ xử lý' },
  { value: 2, label: 'Đã xác nhận' },
  { value: 3, label: 'Chờ lấy hàng' },
  { value: 4, label: 'Chờ giao hàng' },
  { value: 5, label: 'Đã hủy' },
  { value: 6, label: 'Hoàn thành / đã giao' },
  { value: 7, label: 'Yêu cầu trả hàng' },
  { value: 8, label: 'Đã trả hàng' },
]

function getPaginationItems(currentPage, pageCount) {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index)
  const visible = [...new Set([0, pageCount - 1, currentPage - 1, currentPage, currentPage + 1]
    .filter(index => index >= 0 && index < pageCount))].sort((a, b) => a - b)
  const items = []
  visible.forEach((value, index) => {
    if (index > 0 && value - visible[index - 1] > 1) items.push(`ellipsis-${value}`)
    items.push(value)
  })
  return items
}

export default function AdminOrders() {
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [orderTypeFilter, setOrderTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const todayStr = new Date().toISOString().split('T')[0]
  // Mặc định không giới hạn từ ngày để đơn cũ (vd đơn quầy tháng trước) vẫn hiện;
  // người dùng thu hẹp lại khi cần
  const [tuNgay, setTuNgay] = useState('')
  const [denNgay, setDenNgay] = useState(todayStr)
  const [datePreset, setDatePreset] = useState('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const dateError = tuNgay && denNgay && tuNgay > denNgay ? 'Ngày kết thúc không được nhỏ hơn ngày bắt đầu' : ''
  const hasActiveFilter = Boolean(orderTypeFilter) || statusFilter > 0 || datePreset !== 'all'
  const loadOrders = (p, loai, q) => {
    if (dateError) { setLoading(false); return }
    setLoading(true)
    const l = loai ?? (orderTypeFilter ? Number(orderTypeFilter) : undefined)
    const keyword = (q || '').trim().replace(/\s+/g, ' ')
    getAllOrders(p, 10, l, keyword || undefined, statusFilter > 0 ? statusFilter : undefined,
      tuNgay || undefined, denNgay || undefined)
      .then(data => {
      setOrders(data.content || [])
      setTotalPages(data.totalPages || 0)
      setPage(data.number || 0)
    }).catch(() => setError('Không thể tải đơn hàng'))
    .finally(() => setLoading(false))
  }

  useEffect(() => { if (!dateError) loadOrders(0, undefined, search) }, [search, orderTypeFilter, statusFilter, tuNgay, denNgay, dateError])
  const exportExcel = () => {
    const rows = orders.map(o => ({ 'Mã đơn': o.maDonHangCode || `DH${String(o.maDonHang).padStart(4, '0')}`, 'Khách hàng': o.nguoiDung?.hoTen || 'Khách lẻ', 'Ngày đặt': o.ngayDat ? new Date(o.ngayDat).toLocaleString('vi-VN') : '', 'Tổng tiền': Number(o.tongTien || 0), 'Thanh toán': PAYMENT_LABELS[o.thanhToans?.[0]?.phuongThuc] || '', 'Trạng thái': o.trangThaiDon }))
    const sheet = XLSX.utils.json_to_sheet(rows); const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, 'Don hang'); XLSX.writeFile(book, 'danh-sach-don-hang.xlsx')
  }
  const applyDatePreset = (preset) => {
    setDatePreset(preset)
    const today = new Date()
    const yyyyMmDd = (date) => date.toISOString().split('T')[0]
    if (preset === 'all') { setTuNgay(''); setDenNgay(''); return }
    if (preset === 'month') { setTuNgay(yyyyMmDd(new Date(today.getFullYear(), today.getMonth(), 1))); setDenNgay(yyyyMmDd(today)); return }
    const days = preset === 'today' ? 0 : preset === '7d' ? 6 : 29
    const from = new Date(today); from.setDate(today.getDate() - days)
    setTuNgay(yyyyMmDd(from)); setDenNgay(yyyyMmDd(today))
  }

  return (
    <div className="max-w-[1440px] mx-auto pb-8">
      <AdminWorkspaceHeader icon={ClipboardList} eyebrow="Vận hành bán hàng" title="Quản lý đơn hàng" description="Theo dõi tập trung đơn Online và đơn tại quầy POS.">
        <button onClick={exportExcel} disabled={orders.length === 0} className="flex items-center gap-2 rounded-xl bg-gold px-3.5 py-2.5 text-xs font-bold text-noir shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-50"><Download className="h-3.5 w-3.5" /> Xuất Excel</button>
      </AdminWorkspaceHeader>

      <div className="mb-5 rounded-2xl border border-stone/15 bg-ivory p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1 sm:max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã đơn, khách hàng..." className="w-full rounded-xl border border-stone/20 bg-white py-2.5 pl-9 pr-4 text-sm text-noir outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/50" /></div>
          <select value={orderTypeFilter} onChange={e => { setOrderTypeFilter(e.target.value); setStatusFilter(0); setPage(0) }} className="rounded-xl border border-stone/20 bg-white px-3 py-2.5 text-sm font-medium text-noir outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/50">
            <option value="">Tất cả đơn</option><option value="1">Đơn Online</option><option value="2">Đơn tại quầy</option>
          </select>
        <button onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`relative flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition ${isFilterOpen ? 'bg-noir text-ivory shadow-md' : 'text-stone hover:bg-gold/10 hover:text-noir'}`}>
          <Filter className={`h-4 w-4 ${isFilterOpen ? 'text-gold' : ''}`} />
          <span>Bộ lọc đơn hàng</span>
          <ChevronDown className={`h-3.5 w-3.5 text-stone transition-all duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
          {hasActiveFilter && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gold rounded-full" />
          )}
        </button></div>
        <div className={`transition-all duration-200 ${isFilterOpen ? 'max-h-96 overflow-visible opacity-100 mt-2 px-3 pb-3' : 'max-h-0 overflow-hidden opacity-0'}`}>
          <div className="rounded-xl bg-ivory-100/80 border border-stone/10 p-3 flex items-end gap-3 flex-wrap">
            <div className="relative">{(() => { const statusOptions = orderTypeFilter === '2' ? POS_STATUS_LIST : orderTypeFilter === '1' ? ONLINE_STATUS_LIST : ALL_STATUS_LIST; return <><label className="block text-xs font-medium text-stone mb-1">Trạng thái</label><button type="button" onClick={() => setIsStatusOpen(value => !value)} className="min-w-52 flex items-center justify-between gap-5 bg-white border border-stone/20 rounded-xl px-3 py-2 text-sm font-medium hover:border-gold focus:outline-none focus:ring-2 focus:ring-gold/50">{statusOptions.find(item => item.value === statusFilter)?.label}<ChevronDown className={`h-4 w-4 text-stone transition ${isStatusOpen ? 'rotate-180' : ''}`} /></button>{isStatusOpen && <div className="absolute left-0 top-full mt-1 z-30 min-w-56 overflow-hidden rounded-xl bg-white border border-stone/15 shadow-xl p-1.5">{statusOptions.map(item => <button key={item.value} type="button" onClick={() => { setStatusFilter(item.value); setIsStatusOpen(false) }} className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg text-left transition ${statusFilter === item.value ? 'bg-gold/15 text-noir font-semibold' : 'hover:bg-ivory-100 text-stone'}`}><span>{item.label}</span>{statusFilter === item.value && <span className="text-gold font-bold">✓</span>}</button>)}</div>}</> })()}</div>
            {datePreset === 'custom' && <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-stone" />
              <input type="date" value={tuNgay} onChange={e => { setTuNgay(e.target.value); setDatePreset('custom') }}
                className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-gold" />
              <span className="text-sm text-stone">→</span>
              <input type="date" value={denNgay} onChange={e => { setDenNgay(e.target.value); setDatePreset('custom') }}
                className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-gold" />
            </div>}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-stone/15">
            {[['today', 'Hôm nay'], ['7d', '7 ngày'], ['30d', '30 ngày'], ['month', 'Tháng này'], ['all', 'Tất cả thời gian']].map(([value, label]) => <button key={value} onClick={() => applyDatePreset(value)} className={`px-3 py-1.5 text-xs rounded-lg border transition ${datePreset === value ? 'bg-gold text-noir border-gold font-semibold' : 'border-stone/20 text-stone hover:bg-gold/10'}`}>{label}</button>)}
            <button onClick={() => setDatePreset('custom')} className={`px-3 py-1.5 text-xs rounded-lg border transition ${datePreset === 'custom' ? 'bg-gold text-noir border-gold font-semibold' : 'border-stone/20 text-stone hover:bg-gold/10'}`}>Tùy chọn</button>
          </div>
          {dateError && <p className="text-bordeaux text-xs mt-2">{dateError}</p>}
        </div>
      </div>

      {error && <div className="bg-bordeaux/10 border border-bordeaux/20 text-bordeaux text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

      <div className="bg-ivory rounded-2xl shadow-lg border border-stone/15 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6"><SkeletonTable rows={8} cols={6} /></div>
          ) : orders.length === 0 ? (
            <div className="py-10 text-center text-sm text-stone">Không có đơn hàng phù hợp.</div>
          ) : (
          <table className="w-full text-sm">
            <thead className="bg-noir text-ivory">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-ivory/70">#</th>
                <th className="text-center px-4 py-3 font-semibold text-ivory/70">Nguồn đơn</th>
                <th className="text-left px-4 py-3 font-semibold text-ivory/70">Khách hàng</th>
                <th className="text-left px-4 py-3 font-semibold text-ivory/70">Ngày</th>
                <th className="text-right px-4 py-3 font-semibold text-ivory/70">Tổng tiền</th>
                <th className="text-center px-4 py-3 font-semibold text-ivory/70">Thanh toán</th>
                <th className="text-center px-4 py-3 font-semibold text-ivory/70">Trạng thái</th>
                <th className="text-center px-4 py-3 font-semibold text-ivory/70">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((o) => {
                return (
                  <tr key={o.maDonHang} className={`hover:bg-ivory-100 transition ${o.trangThaiDon === 1 && o.ngayDat && Date.now() - new Date(o.ngayDat).getTime() > 24 * 60 * 60 * 1000 ? 'bg-gold/5' : ''}`}>
                    <td className="px-4 py-3 font-bold text-noir">{o.maDonHangCode || `DH${String(o.maDonHang).padStart(4, '0')}`}</td>
                    <td className="px-4 py-3 text-center"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${o.loaiDonHang === 2 ? 'bg-noir/10 text-noir' : 'bg-gold/15 text-noir'}`}>{o.loaiDonHang === 2 ? 'Tại quầy' : 'Online'}</span></td>
                    <td className="px-4 py-3"><div className="font-semibold">{o.nguoiDung?.hoTen || 'Khách lẻ'}</div><span className="text-xs text-stone">{o.nguoiDung?.email || ''}</span></td>
                    <td className="px-4 py-3">{o.ngayDat ? new Date(o.ngayDat).toLocaleDateString('vi-VN') : '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold">{VND(o.tongTien || 0)}</td>
                    <td className="px-4 py-3 text-center"><PaymentInfo payments={o.thanhToans} />{o.thanhToans?.some(p => p.phuongThuc > 1 && p.trangThaiThanhToan !== 2) && <span title="Thanh toán online chưa hoàn tất" className="inline-flex mt-1 text-gold"><AlertTriangle className="h-3.5 w-3.5" /></span>}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={o.trangThaiDon} loaiDonHang={o.loaiDonHang} /></td>
                    <td className="px-4 py-3 text-center">
                      <Link to={`/admin/orders/${o.maDonHang}`} className="text-gold hover:text-gold-hover hover:bg-gold/10 p-1.5 rounded-lg inline-block" title="Xem chi tiết">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          )}
        </div>
        {orders.length === 0 && !loading && (
          <p className="text-center text-stone py-8">
            Không có đơn hàng
            {(tuNgay || statusFilter > 0 || search) && (
              <span className="block text-xs mt-1">Thử nới rộng Từ ngày hoặc xóa bộ lọc/trạng thái tìm kiếm</span>
            )}
          </p>
        )}
      </div>

      {totalPages > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
          <button onClick={() => loadOrders(page - 1, null, search)} disabled={page === 0}
            className="rounded-xl border border-stone/20 bg-ivory px-3.5 py-2 text-sm font-medium transition hover:border-gold hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-35">Trước</button>
          {getPaginationItems(page, totalPages).map(item => typeof item === 'string'
            ? <span key={item} className="flex h-9 min-w-7 items-center justify-center text-stone">…</span>
            : <button key={item} onClick={() => loadOrders(item, null, search)} aria-current={item === page ? 'page' : undefined}
                className={`h-9 min-w-9 rounded-xl border px-2.5 text-sm font-semibold transition ${item === page ? 'border-gold bg-gold text-noir shadow-sm' : 'border-stone/20 bg-ivory text-stone hover:border-gold hover:bg-gold/10 hover:text-noir'}`}>{item + 1}</button>
          )}
          <button onClick={() => loadOrders(page + 1, null, search)} disabled={page >= totalPages - 1}
            className="rounded-xl border border-stone/20 bg-ivory px-3.5 py-2 text-sm font-medium transition hover:border-gold hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-35">Sau</button>
        </div>
      )}


    </div>
  )
}

function VND(n) { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }
