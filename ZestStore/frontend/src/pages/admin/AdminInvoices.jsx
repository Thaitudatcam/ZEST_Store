import { useState, useEffect } from 'react'
import { getInvoices, getInvoiceDetail } from '../../api/admin'
import { Search, Printer, X } from 'lucide-react'

const TABS = [
  { value: null, label: 'Tất cả' },
  { value: 1, label: 'Online' },
  { value: 2, label: 'Tại quầy' },
]

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [printData, setPrintData] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState(null)
  const [tuNgay, setTuNgay] = useState('')
  const [denNgay, setDenNgay] = useState('')
  const dateError = tuNgay && denNgay && tuNgay > denNgay ? 'Ngày kết thúc không được nhỏ hơn ngày bắt đầu' : ''

  const load = (p) => {
    getInvoices(p, 10, {
      loaiDonHang: tab,
      tuNgay: tuNgay || undefined,
      denNgay: denNgay || undefined,
    }).then(data => {
      setInvoices(data.content || [])
      setTotalPages(data.totalPages || 0)
      setPage(data.number || 0)
    }).catch(() => setError('Không thể tải hóa đơn'))
  }
  useEffect(() => { if (!dateError) load(0) }, [tab, tuNgay, denNgay, dateError])

  const handlePrint = async (id) => {
    try {
      const data = await getInvoiceDetail(id)
      setPrintData(data)
    } catch { setError('Không thể tải chi tiết hóa đơn') }
  }

  const filtered = invoices.filter((inv) =>
    !search || inv.maHoaDonCode?.toLowerCase().includes(search.toLowerCase()) || (inv.khachHang || '').toLowerCase().includes(search.toLowerCase()) || (inv.emailKhachHang || '').toLowerCase().includes(search.toLowerCase()) || String(inv.maDonHang).includes(search)
  )

  const closePrint = () => setPrintData(null)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý hóa đơn</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm hóa đơn..." className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-gold" />
        </div>
      </div>

      {error && <div className="bg-bordeaux/10 border border-bordeaux/20 text-bordeaux text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

      <div className="flex items-center gap-4 mb-4">
        <div className="flex gap-1 bg-ivory-100 rounded-lg p-1">
          {TABS.map((t) => (
            <button key={t.value ?? 'all'} onClick={() => setTab(t.value)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${tab === t.value ? 'bg-ivory text-gold shadow-sm' : 'text-stone hover:text-ink-soft'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <input type="date" value={tuNgay} onChange={e => setTuNgay(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
          <span className="text-stone">→</span>
          <input type="date" value={denNgay} onChange={e => setDenNgay(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
          {dateError && <p className="text-bordeaux text-xs">{dateError}</p>}
        </div>
      </div>

      <div className="bg-ivory rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ivory-100 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-stone">Mã hóa đơn</th>
                <th className="text-left px-4 py-3 font-semibold text-stone">Khách hàng</th>
                <th className="text-center px-4 py-3 font-semibold text-stone">Ngày tạo</th>
                <th className="text-right px-4 py-3 font-semibold text-stone">Tổng tiền</th>
                <th className="text-center px-4 py-3 font-semibold text-stone">Trạng thái</th>
                <th className="text-center px-4 py-3 font-semibold text-stone">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((inv) => (
                <tr key={inv.maHoaDon} className="hover:bg-ivory-100">
                  <td className="px-4 py-3 font-mono font-semibold text-gold">{inv.maHoaDonCode}</td>
                  <td className="px-4 py-3">{inv.khachHang}<br /><span className="text-xs text-stone">{inv.emailKhachHang}</span></td>
                  <td className="px-4 py-3 text-center">{inv.ngayTao ? new Date(inv.ngayTao).toLocaleDateString('vi-VN') : '-'}</td>
                  <td className="px-4 py-3 text-right font-semibold">{VND(inv.tongTien || 0)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${inv.trangThaiHoaDon === 'issued' ? 'bg-emerald-deep/20 text-emerald-800' : 'bg-ivory-100 text-stone'}`}>
                      {inv.trangThaiHoaDon === 'issued' ? 'Đã phát hành' : inv.trangThaiHoaDon}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handlePrint(inv.maHoaDon)} className="text-gold hover:bg-gold/10 p-1.5 rounded-lg" title="In hóa đơn">
                      <Printer className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center text-stone py-8">Chưa có hóa đơn nào</p>}
      </div>

      {totalPages > 0 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => load(0)} disabled={page === 0}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-ivory-100 disabled:opacity-30">Đầu</button>
          <button onClick={() => load(page - 1)} disabled={page === 0}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-ivory-100 disabled:opacity-30">Trước</button>
          {Array.from({ length: totalPages }, (_, i) => i).map(p => (
            <button key={p} onClick={() => load(p)}
              className={`px-3 py-1.5 text-sm border rounded-lg ${p === page ? 'bg-gold text-noir border-gold' : 'hover:bg-ivory-100'}`}>{p + 1}</button>
          ))}
          <button onClick={() => load(page + 1)} disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-ivory-100 disabled:opacity-30">Sau</button>
          <button onClick={() => load(totalPages - 1)} disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-ivory-100 disabled:opacity-30">Cuối</button>
        </div>
      )}

      {printData && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-ivory rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-ivory">
              <h2 className="font-bold text-lg">Hóa đơn {printData.maHoaDonCode}</h2>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="bg-gold text-noir px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gold-hover flex items-center gap-2">
                  <Printer className="h-4 w-4" /> In
                </button>
                <button onClick={closePrint} className="p-2 text-stone hover:text-stone"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div id="invoice-print" className="p-6 space-y-6">
              <div className="text-center border-b pb-4">
                <h3 className="text-2xl font-bold">ZEST STORE</h3>
                <p className="text-sm text-stone">HÓA ĐƠN BÁN HÀNG</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-semibold">Mã hóa đơn:</span> {printData.maHoaDonCode}</p>
                  <p><span className="font-semibold">Ngày tạo:</span> {printData.ngayTao ? new Date(printData.ngayTao).toLocaleDateString('vi-VN') : '-'}</p>
                  <p><span className="font-semibold">Email:</span> {printData.emailKhachHang}</p>
                </div>
                {printData.donHang && (
                  <div>
                    <p><span className="font-semibold">Khách hàng:</span> {printData.donHang.khachHang}</p>
                    <p><span className="font-semibold">Người nhận:</span> {printData.donHang.tenNguoiNhan}</p>
                    <p><span className="font-semibold">SĐT:</span> {printData.donHang.sdtNguoiNhan}</p>
                    <p><span className="font-semibold">Địa chỉ:</span> {printData.donHang.diaChiGiaoHang}</p>
                  </div>
                )}
              </div>

              <table className="w-full text-sm border-t">
                <thead>
                  <tr className="border-b bg-ivory-100">
                    <th className="text-left px-3 py-2 font-semibold">Sản phẩm</th>
                    <th className="text-center px-3 py-2 font-semibold">Phân loại</th>
                    <th className="text-right px-3 py-2 font-semibold">Đơn giá</th>
                    <th className="text-center px-3 py-2 font-semibold">SL</th>
                    <th className="text-right px-3 py-2 font-semibold">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(printData.chiTiet || []).map((item, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">{item.tenSanPham}</td>
                      <td className="px-3 py-2 text-center text-stone">{item.thongTinBienThe || '-'}</td>
                      <td className="px-3 py-2 text-right">{VND(item.donGia)}</td>
                      <td className="px-3 py-2 text-center">{item.soLuong}</td>
                      <td className="px-3 py-2 text-right font-semibold">{VND(item.thanhTien)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-64 space-y-1 text-sm">
                  {printData.donHang && (() => {
                    const t = printData.donHang.tongTien ?? printData.tongTien ?? 0
                    const g = printData.donHang.soTienGiam || 0
                    const p = printData.donHang.phiVanChuyen || 0
                    const isOnline = printData.donHang.loaiDonHang === 1
                    const tamTinh = isOnline ? t + g - p : t
                    const tongCong = isOnline ? t : t - g + p
                    return <>
                      <div className="flex justify-between"><span>Tạm tính:</span><span>{VND(tamTinh)}</span></div>
                      <div className="flex justify-between"><span>Giảm giá:</span><span className="text-bordeaux">-{VND(g)}</span></div>
                      <div className="flex justify-between"><span>Phí vận chuyển:</span><span>{VND(p)}</span></div>
                      <div className="flex justify-between font-bold text-base border-t pt-2"><span>Tổng cộng:</span><span className="text-gold">{VND(tongCong)}</span></div>
                    </>
                  })()}
                </div>
              </div>

              <div className="text-center text-xs text-stone border-t pt-4">
                <p>Cảm ơn quý khách đã mua hàng tại ZEST Store!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print, #invoice-print * { visibility: visible; }
          #invoice-print { position: fixed; top: 0; left: 0; width: 100%; }
        }
      `}</style>
    </div>
  )
}

function VND(n) { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }
