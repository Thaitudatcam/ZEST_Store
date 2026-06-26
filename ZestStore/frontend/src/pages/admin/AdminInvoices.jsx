import { useState, useEffect } from 'react'
import { getInvoices, getInvoiceDetail, generateInvoice } from '../../api/admin'
import { Search, Printer, FileText, X } from 'lucide-react'

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [printData, setPrintData] = useState(null)
  const [error, setError] = useState('')

  const load = (p) => {
    getInvoices(p, 10).then(data => {
      setInvoices(data.content || [])
      setTotalPages(data.totalPages || 0)
      setPage(data.number || 0)
    }).catch(() => setError('Không thể tải hóa đơn'))
  }
  useEffect(() => { load(0) }, [])

  const filtered = invoices.filter((inv) =>
    !search || inv.maHoaDonCode?.toLowerCase().includes(search.toLowerCase()) || (inv.khachHang || '').toLowerCase().includes(search.toLowerCase()) || (inv.emailKhachHang || '').toLowerCase().includes(search.toLowerCase()) || String(inv.maDonHang).includes(search)
  )

  const handlePrint = async (id) => {
    try {
      const data = await getInvoiceDetail(id)
      setPrintData(data)
    } catch { setError('Không thể tải chi tiết hóa đơn') }
  }

  const handleGenerate = async (orderId) => {
    try {
      await generateInvoice(orderId)
      setError('')
      load(page)
    } catch (err) {
      setError(err.response?.data?.message || 'Tạo hóa đơn thất bại')
    }
  }

  const closePrint = () => setPrintData(null)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý hóa đơn</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm hóa đơn..." className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Mã hóa đơn</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Khách hàng</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Ngày tạo</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Tổng tiền</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((inv) => (
                <tr key={inv.maHoaDon} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-semibold text-blue-700">{inv.maHoaDonCode}</td>
                  <td className="px-4 py-3">{inv.khachHang}<br /><span className="text-xs text-gray-400">{inv.emailKhachHang}</span></td>
                  <td className="px-4 py-3 text-center">{inv.ngayTao ? new Date(inv.ngayTao).toLocaleDateString('vi-VN') : '-'}</td>
                  <td className="px-4 py-3 text-right font-semibold">{VND(inv.tongTien || 0)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${inv.trangThaiHoaDon === 'issued' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                      {inv.trangThaiHoaDon === 'issued' ? 'Đã phát hành' : inv.trangThaiHoaDon}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handlePrint(inv.maHoaDon)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg" title="In hóa đơn">
                      <Printer className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center text-gray-500 py-8">Chưa có hóa đơn nào</p>}
      </div>

      {totalPages > 0 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => load(0)} disabled={page === 0}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-30">Đầu</button>
          <button onClick={() => load(page - 1)} disabled={page === 0}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-30">Trước</button>
          {Array.from({ length: totalPages }, (_, i) => i).map(p => (
            <button key={p} onClick={() => load(p)}
              className={`px-3 py-1.5 text-sm border rounded-lg ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'}`}>{p + 1}</button>
          ))}
          <button onClick={() => load(page + 1)} disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-30">Sau</button>
          <button onClick={() => load(totalPages - 1)} disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-30">Cuối</button>
        </div>
      )}

      <div className="mt-4 bg-white rounded-2xl shadow-sm border p-4">
        <h2 className="font-semibold mb-2">Tạo hóa đơn từ đơn hàng</h2>
        <p className="text-xs text-gray-500 mb-3">Nhập mã đơn hàng để tạo hóa đơn</p>
        <div className="flex gap-2">
          <input id="orderIdInput" type="number" placeholder="Mã đơn hàng..." className="border rounded-lg px-4 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={() => {
            const val = document.getElementById('orderIdInput').value
            if (val) handleGenerate(Number(val))
          }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
            <FileText className="h-4 w-4" /> Tạo hóa đơn
          </button>
        </div>
      </div>

      {printData && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold text-lg">Hóa đơn {printData.maHoaDonCode}</h2>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
                  <Printer className="h-4 w-4" /> In
                </button>
                <button onClick={closePrint} className="p-2 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div id="invoice-print" className="p-6 space-y-6">
              <div className="text-center border-b pb-4">
                <h3 className="text-2xl font-bold">ZEST STORE</h3>
                <p className="text-sm text-gray-500">HÓA ĐƠN BÁN HÀNG</p>
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
                  <tr className="border-b bg-gray-50">
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
                      <td className="px-3 py-2 text-center text-gray-500">{item.thongTinBienThe || '-'}</td>
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
                      <div className="flex justify-between"><span>Giảm giá:</span><span className="text-red-500">-{VND(g)}</span></div>
                      <div className="flex justify-between"><span>Phí vận chuyển:</span><span>{VND(p)}</span></div>
                      <div className="flex justify-between font-bold text-base border-t pt-2"><span>Tổng cộng:</span><span className="text-blue-700">{VND(tongCong)}</span></div>
                    </>
                  })()}
                </div>
              </div>

              <div className="text-center text-xs text-gray-400 border-t pt-4">
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
