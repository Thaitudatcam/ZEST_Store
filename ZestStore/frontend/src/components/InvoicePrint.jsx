import { Printer } from 'lucide-react'

const PAYMENT_LABELS = { 1: 'COD', 2: 'VNPay', 3: 'Momo', 4: 'ZaloPay', 5: 'Tiền mặt', 6: 'VietQR' }

function VND(n) { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

export default function InvoicePrint({ data }) {
  if (!data) return null
  const donHang = data.donHang || {}
  const items = data.chiTiet || []
  const tamTinh = Number(data.tamTinh ?? items.reduce((s, i) => s + Number(i.thanhTien || 0), 0))
  const giamGia = Number(donHang.soTienGiam || 0)
  const phiVanChuyen = Number(donHang.phiVanChuyen || 0)
  const tongTien = Number(donHang.tongTien ?? data.tongTien ?? tamTinh - giamGia + phiVanChuyen)
  const isPos = donHang.loaiDonHang === 2
  const payments = data.thanhToans || []
  const daThanhToan = payments.filter(p => p.trangThaiThanhToan === 2)

  return (
    <div>
      <div id="invoice-print" className="p-6 space-y-5 text-[13px]">
        <div className="text-center border-b border-dashed pb-4">
          <h3 className="text-2xl font-bold tracking-wide">ZEST STORE</h3>
          <p className="text-sm text-stone mt-0.5">{isPos ? 'HÓA ĐƠN BÁN HÀNG TẠI QUẦY' : 'HÓA ĐƠN BÁN HÀNG'}</p>
          <p className="text-stone mt-0.5">{data.maHoaDonCode}</p>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          <div>
            <p><span className="text-stone">Mã đơn:</span> <span className="font-semibold">{donHang.maDonHangCode || data.maHoaDonCode}</span></p>
            <p><span className="text-stone">Ngày tạo:</span> {data.ngayTao ? new Date(data.ngayTao).toLocaleString('vi-VN') : '-'}</p>
            <p><span className="text-stone">Loại đơn:</span> {isPos ? 'Tại quầy' : 'Online'}</p>
          </div>
          <div>
            <p><span className="text-stone">Khách hàng:</span> <span className="font-semibold">{donHang.khachHang || donHang.tenNguoiNhan || 'Khách lẻ'}</span></p>
            <p><span className="text-stone">SĐT:</span> {donHang.sdtNguoiNhan || '-'}</p>
            {data.emailKhachHang && <p><span className="text-stone">Email:</span> {data.emailKhachHang}</p>}
          </div>
        </div>

        {donHang.diaChiGiaoHang && !isPos && (
          <p><span className="text-stone">Địa chỉ giao hàng:</span> {donHang.diaChiGiaoHang}</p>
        )}

        <table className="w-full border-t">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Sản phẩm</th>
              <th className="text-center py-2">SL</th>
              <th className="text-right py-2">Đơn giá</th>
              <th className="text-right py-2">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={4} className="py-3 text-center text-stone">Không có sản phẩm</td></tr>
            )}
            {items.map((item, i) => (
              <tr key={i} className="border-b">
                <td className="py-2">
                  <p className="font-medium">{item.tenSanPham}</p>
                  {item.maSanPhamCode && <p className="text-xs text-stone">Mã SP: {item.maSanPhamCode || item.sku}</p>}
                  {item.thongTinBienThe && <p className="text-xs text-stone">{item.thongTinBienThe}</p>}
                </td>
                <td className="text-center py-2">{item.soLuong}</td>
                <td className="text-right py-2">{VND(item.donGia)}</td>
                <td className="text-right py-2 font-semibold">{VND(item.thanhTien)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="space-y-1 w-64">
            <div className="flex justify-between"><span className="text-stone">Tạm tính</span><span>{VND(tamTinh)}</span></div>
            {giamGia > 0 && <div className="flex justify-between text-emerald-deep"><span>Giảm giá</span><span>-{VND(giamGia)}</span></div>}
            {phiVanChuyen > 0 && <div className="flex justify-between"><span>Phí vận chuyển</span><span>{VND(phiVanChuyen)}</span></div>}
            <div className="flex justify-between border-t pt-1 font-bold text-base"><span>Tổng cộng</span><span>{VND(tongTien)}</span></div>
            {daThanhToan.length > 0 && (
              <div className="flex justify-between text-emerald-deep font-semibold">
                <span>Đã thanh toán</span><span>{VND(daThanhToan.reduce((s, p) => s + Number(p.soTien || 0), 0))}</span>
              </div>
            )}
          </div>
        </div>

        {payments.length > 0 && (
          <div className="border-t border-dashed pt-3">
            <p className="font-semibold mb-1">Thanh toán:</p>
            <div className="space-y-0.5">
              {payments.map((p, i) => (
                <div key={i} className="flex justify-between">
                  <span>{PAYMENT_LABELS[p.phuongThuc] || p.nhaCungCap || 'Thanh toán'} {p.trangThaiThanhToan === 2 ? '· Đã thanh toán' : p.trangThaiThanhToan === 1 ? '· Chờ thanh toán' : '· Thất bại'}</span>
                  <span>{VND(p.soTien)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {donHang.ghiChu && (
          <p><span className="text-stone">Ghi chú:</span> {donHang.ghiChu}</p>
        )}

        <div className="text-center text-stone text-xs pt-2">
          Cảm ơn quý khách đã mua sắm tại ZEST STORE!
        </div>
      </div>
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
