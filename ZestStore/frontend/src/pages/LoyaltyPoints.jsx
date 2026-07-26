import { useState, useEffect } from 'react'
import { getSoDuDiem, getLichSuDiem } from '../api/vi'
import LoadingSpinner from '../components/LoadingSpinner'
import { Coins, Plus, Minus, Clock, Info, AlertTriangle, History } from 'lucide-react'

const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

const LOAI = {
  1: { label: 'Tích lũy', icon: Plus, cls: 'text-green-600 bg-green-50 border-green-200' },
  2: { label: 'Đã dùng', icon: Minus, cls: 'text-blue-600 bg-blue-50 border-blue-200' },
  3: { label: 'Hết hạn', icon: AlertTriangle, cls: 'text-red-500 bg-red-50 border-red-200' },
}

export default function LoyaltyPoints() {
  const [viDiem, setViDiem] = useState(null)
  const [lichSu, setLichSu] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = async (p = 0) => {
    setLoading(true)
    try {
      const [sd, ls] = await Promise.all([getSoDuDiem(), getLichSuDiem(p)])
      setViDiem(sd)
      setLichSu(Array.isArray(ls.content) ? ls.content : [])
      setTotalPages(ls.totalPages || 0)
      setPage(ls.number || 0)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Điểm tích lũy</h1>

      <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl p-6 mb-6 border border-amber-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-amber-700 font-medium">Số điểm hiện có</p>
            <p className="text-4xl font-bold text-amber-900 mt-1">
              {viDiem?.soDiem?.toLocaleString() ?? '...'}
            </p>
            <div className="flex gap-4 mt-2 text-xs text-amber-600">
              <span>Đã tích: {viDiem?.tongTichLuy?.toLocaleString() ?? 0}</span>
              <span>Đã dùng: {viDiem?.tongSuDung?.toLocaleString() ?? 0}</span>
            </div>
          </div>
          <Coins className="h-16 w-16 text-amber-400 opacity-50" />
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Cứ <strong>10.000đ</strong> giá trị đơn hàng = <strong>1 điểm</strong></p>
            <p>• <strong>1 điểm</strong> = <strong>1.000đ</strong> giảm khi thanh toán</p>
            <p>• Điểm có hạn <strong>12 tháng</strong> kể từ ngày tích lũy</p>
            <p>• Có thể dùng cùng lúc với mã giảm giá (giảm sau voucher)</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <History className="h-5 w-5 text-gray-500" />
        <h2 className="text-lg font-semibold">Lịch sử giao dịch</h2>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : lichSu.length === 0 ? (
        <p className="text-center text-gray-400 py-8">Chưa có giao dịch nào</p>
      ) : (
        <div className="space-y-2">
          {lichSu.map((gd) => {
            const loai = LOAI[gd.loaiGiaoDich] || {}
            const Icon = loai.icon || Info
            return (
              <div key={gd.maGiaoDich} className={`border rounded-lg px-4 py-3 ${loai.cls || ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium text-sm">{loai.label}</span>
                    {gd.donHang?.maDonHang && (
                      <span className="text-xs text-gray-500">#Đơn {gd.donHang.maDonHang}</span>
                    )}
                  </div>
                  <span className="font-semibold text-sm">{gd.loaiGiaoDich === 1 ? '+' : '-'}{gd.soDiem?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>{new Date(gd.thoiGian).toLocaleString('vi-VN')}</span>
                  <span>Số dư sau: {gd.soDuSau?.toLocaleString()}</span>
                </div>
                {gd.ngayHetHan && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                    <Clock className="h-3 w-3" />
                    <span>Hết hạn: {new Date(gd.ngayHetHan).toLocaleDateString('vi-VN')}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button disabled={page === 0} onClick={() => load(page - 1)}
            className="px-3 py-1 border rounded-lg disabled:opacity-30 hover:bg-gray-50 text-sm">Trước</button>
          <span className="px-3 py-1 text-sm">Trang {page + 1}/{totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => load(page + 1)}
            className="px-3 py-1 border rounded-lg disabled:opacity-30 hover:bg-gray-50 text-sm">Sau</button>
        </div>
      )}
    </div>
  )
}
