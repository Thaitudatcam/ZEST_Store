import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllOrders } from '../../api/admin'
import StatusBadge from '../../components/StatusBadge'
import { Search, Eye, Calendar, Download, RefreshCw, Filter, Receipt } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useToast } from '../../context/ToastContext'
import { SkeletonTable } from '../../components/Skeleton'

const INVOICE_STATUS_LIST = [
  { value: 0, label: 'Tất cả' },
  { value: 6, label: 'Đã hoàn thành' },
  { value: 5, label: 'Đã hủy' },
  { value: 9, label: 'Giao không thành công' },
]

const LOAI_DON_BADGES = {
  1: { label: 'Online', className: 'bg-royal/10 text-royal' },
  2: { label: 'Tại quầy', className: 'bg-violet-100 text-violet-600' },
  3: { label: 'Giao hàng', className: 'bg-amber-100 text-amber-600' },
}

export default function AdminInvoices() {
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(0)
  const [loaiDon, setLoaiDon] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [tuNgay, setTuNgay] = useState('')
  const [denNgay, setDenNgay] = useState('')

  const loadOrders = (p = 0) => {
    setLoading(true)
    setError('')
    const keyword = search.trim().replace(/\s+/g, ' ')
    const loaiParam = loaiDon > 0 ? loaiDon : undefined
    getAllOrders(p, 20, loaiParam, keyword || undefined, statusFilter > 0 ? statusFilter : undefined,
      tuNgay || undefined, denNgay || undefined)
      .then(data => {
        setOrders(data.content || [])
        setTotalPages(data.totalPages || 0)
        setPage(data.number || 0)
      }).catch(() => setError('Không thể tải danh sách hóa đơn'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadOrders(0) }, [search, statusFilter, tuNgay, denNgay, loaiDon])

  const exportExcel = () => {
    if (orders.length === 0) return
    const rows = orders.map((o, i) => ({
      'STT': i + 1,
      'Mã HĐ': o.maDonHangCode || `#${o.maDonHang}`,
      'Nhân viên tạo': o.nhanVienTao || 'Website',
      'Khách hàng': o.nguoiDung?.hoTen || o.tenNguoiNhan || 'Khách lẻ',
      'SĐT': o.sdtNguoiNhan || o.nguoiDung?.soDienThoai || '—',
      'Ngày tạo': o.ngayDat ? new Date(o.ngayDat).toLocaleString('vi-VN') : '',
      'Tổng tiền': Number(o.tongTien || 0),
      'Loại đơn': LOAI_DON_BADGES[o.loaiDonHang]?.label || (o.loaiDonHang === 2 ? 'Tại quầy' : 'Online'),
      'Trạng thái': INVOICE_STATUS_LIST.find(s => s.value === o.trangThaiDon)?.label || o.trangThaiDon,
    }))
    const sheet = XLSX.utils.json_to_sheet(rows)
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, 'Hoa don')
    XLSX.writeFile(book, 'danh-sach-hoa-don.xlsx')
    toast.success('Đã xuất file Excel')
  }

  const handleReset = () => {
    setSearch('')
    setStatusFilter(0)
    setLoaiDon(0)
    setTuNgay('')
    setDenNgay('')
  }

  return (
    <div className="max-w-[1440px] mx-auto pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-noir via-noir-800 to-noir p-5 sm:p-6 mb-5 shadow-xl">
        <div className="absolute -right-10 -top-14 h-44 w-44 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative">
          <p className="text-gold text-xs font-bold uppercase tracking-[0.18em] mb-1">Vận hành bán hàng</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-ivory">QUẢN LÝ HÓA ĐƠN</h1>
          <p className="text-sm text-ivory/60 mt-1">Xem và quản lý tất cả hóa đơn (online & tại quầy).</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-2xl border border-stone/10 shadow-sm p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-gold" />
          <h2 className="text-sm font-bold text-ink uppercase tracking-wide">Bộ lọc</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-stone mb-1.5">Mã hoặc thông tin hóa đơn</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Mã HĐ, tên, SĐT khách..."
                className="w-full pl-9 pr-3 py-2.5 border border-stone/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone mb-1.5">Từ ngày</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
              <input type="date" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-stone/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone mb-1.5">Đến ngày</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
              <input type="date" value={denNgay} onChange={(e) => setDenNgay(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-stone/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone mb-1.5">Loại đơn</label>
            <select value={loaiDon} onChange={(e) => setLoaiDon(Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-stone/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 bg-white">
              <option value={0}>Tất cả</option>
              <option value={1}>Online</option>
              <option value={2}>Tại quầy</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportExcel} disabled={orders.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-white border border-stone/20 text-ink rounded-xl hover:bg-ivory disabled:opacity-50 transition">
            <Download className="h-3.5 w-3.5" /> Xuất Excel
          </button>
          <button onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-gold text-noir rounded-xl hover:bg-gold-hover transition">
            <RefreshCw className="h-3.5 w-3.5" /> Đặt lại bộ lọc
          </button>
        </div>
      </div>

      {error && <div className="bg-bordeaux/10 border border-bordeaux/20 text-bordeaux text-sm rounded-xl px-4 py-2 mb-4">{error}</div>}

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-stone/10 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-stone/10">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wide">Danh sách hóa đơn</h2>
          <p className="text-xs text-stone mt-0.5">Tất cả hóa đơn online và tại quầy</p>
        </div>

        {/* Status Tabs */}
        <div className="px-5 py-3 border-b border-stone/10 flex items-center gap-2 overflow-x-auto">
          {INVOICE_STATUS_LIST.map((tab) => (
            <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 border
                ${statusFilter === tab.value
                  ? 'bg-gold text-noir border-gold shadow-sm'
                  : 'bg-white text-stone border-stone/15 hover:border-gold/40 hover:text-ink'
                }`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6"><SkeletonTable rows={8} cols={9} /></div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-sm text-stone">
              <Receipt className="h-12 w-12 mx-auto mb-3 text-stone/30" />
              <p>Không có hóa đơn phù hợp.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-ivory/50 border-b border-stone/10">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-xs text-stone uppercase tracking-wide">STT</th>
                  <th className="text-left px-5 py-3 font-semibold text-xs text-stone uppercase tracking-wide">Mã HĐ</th>
                  <th className="text-left px-5 py-3 font-semibold text-xs text-stone uppercase tracking-wide">Nhân viên tạo</th>
                  <th className="text-left px-5 py-3 font-semibold text-xs text-stone uppercase tracking-wide">Khách hàng</th>
                  <th className="text-left px-5 py-3 font-semibold text-xs text-stone uppercase tracking-wide">SĐT</th>
                  <th className="text-left px-5 py-3 font-semibold text-xs text-stone uppercase tracking-wide">Ngày tạo</th>
                  <th className="text-right px-5 py-3 font-semibold text-xs text-stone uppercase tracking-wide">Tổng tiền</th>
                  <th className="text-center px-5 py-3 font-semibold text-xs text-stone uppercase tracking-wide">Loại đơn</th>
                  <th className="text-center px-5 py-3 font-semibold text-xs text-stone uppercase tracking-wide">Trạng thái</th>
                  <th className="text-center px-5 py-3 font-semibold text-xs text-stone uppercase tracking-wide">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone/10">
                {orders.map((o, idx) => {
                  const loaiBadge = LOAI_DON_BADGES[o.loaiDonHang] || LOAI_DON_BADGES[1]
                  return (
                    <tr key={o.maDonHang} className="hover:bg-ivory/50 transition-colors">
                      <td className="px-5 py-3.5 text-stone">{page * 20 + idx + 1}</td>
                      <td className="px-5 py-3.5 font-bold text-ink">{o.maDonHangCode || `#${o.maDonHang}`}</td>
                      <td className="px-5 py-3.5 text-ink text-xs">{o.nhanVienTao || 'Website'}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-ink">{o.nguoiDung?.hoTen || o.tenNguoiNhan || 'Khách lẻ'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-stone text-xs">{o.sdtNguoiNhan || o.nguoiDung?.soDienThoai || '—'}</td>
                      <td className="px-5 py-3.5 text-stone text-xs">
                        {o.ngayDat ? new Date(o.ngayDat).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-gold">{VND(o.tongTien || 0)}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex min-w-[78px] shrink-0 items-center justify-center whitespace-nowrap leading-none text-[10px] font-bold uppercase px-2 py-1.5 rounded-full ${loaiBadge.className}`}>
                          {loaiBadge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <StatusBadge status={o.trangThaiDon} loaiDonHang={o.loaiDonHang} />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <Link to={`/admin/orders/${o.maDonHang}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gold/10 text-gold hover:bg-gold hover:text-noir transition" title="Xem chi tiết">
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

        <div className="px-5 py-3 border-t border-stone/10 text-xs text-stone">
          Hiển thị {orders.length} hóa đơn
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <button onClick={() => loadOrders(0)} disabled={page === 0}
            className="px-3 py-1.5 text-sm border border-stone/20 rounded-lg hover:bg-ivory disabled:opacity-30 transition">Đầu</button>
          <button onClick={() => loadOrders(page - 1)} disabled={page === 0}
            className="px-3 py-1.5 text-sm border border-stone/20 rounded-lg hover:bg-ivory disabled:opacity-30 transition">Trước</button>
          {Array.from({ length: totalPages }, (_, i) => i).map(p => (
            <button key={p} onClick={() => loadOrders(p)}
              className={`px-3 py-1.5 text-sm border rounded-lg transition ${p === page ? 'bg-gold text-noir border-gold font-semibold' : 'border-stone/20 hover:bg-ivory'}`}>{p + 1}</button>
          ))}
          <button onClick={() => loadOrders(page + 1)} disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm border border-stone/20 rounded-lg hover:bg-ivory disabled:opacity-30 transition">Sau</button>
          <button onClick={() => loadOrders(totalPages - 1)} disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm border border-stone/20 rounded-lg hover:bg-ivory disabled:opacity-30 transition">Cuối</button>
        </div>
      )}
    </div>
  )
}

function VND(n) { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }
