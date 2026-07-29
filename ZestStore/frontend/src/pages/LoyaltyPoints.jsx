import { useState, useEffect } from 'react'
import { getSoDuDiem, getLichSuDiem } from '../api/vi'
import LoadingSpinner from '../components/LoadingSpinner'
import { Coins, Plus, Minus, Clock, Info, AlertTriangle, History } from 'lucide-react'

const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

const LOAI = {
  TICH_LUY: { label: 'Tích lũy', icon: Plus, cls: 'text-emerald-deep bg-emerald-deep/10 border-emerald-deep/20' },
  SU_DUNG: { label: 'Đã dùng', icon: Minus, cls: 'text-gold bg-gold/10 border-gold/20' },
  HET_HAN: { label: 'Hết hạn', icon: AlertTriangle, cls: 'text-bordeaux bg-bordeaux/10 border-bordeaux/20' },
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

      <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl p-6 mb-6 border border-gold/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gold-hover font-medium">Số điểm hiện có</p>
            <p className="text-4xl font-bold text-gold-hover mt-1">
              {viDiem?.soDiem?.toLocaleString() ?? '...'}
            </p>
            <div className="flex gap-4 mt-2 text-xs text-gold">
              <span>Đã tích: {viDiem?.tongTichLuy?.toLocaleString() ?? 0}</span>
              <span>Đã dùng: {viDiem?.tongSuDung?.toLocaleString() ?? 0}</span>
            </div>
          </div>
          <Coins className="h-16 w-16 text-gold opacity-50" />
        </div>
      </div>

      <div className="bg-ivory rounded-xl border p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-gold mt-0.5 shrink-0" />
          <div className="text-sm text-stone space-y-1">
            <p>• Cứ <strong>10.000đ</strong> giá trị đơn hàng = <strong>1 điểm</strong></p>
            <p>• <strong>1 điểm</strong> = <strong>1.000đ</strong> giảm khi thanh toán</p>
            <p>• Điểm có hạn <strong>12 tháng</strong> kể từ ngày tích lũy</p>
            <p>• Có thể dùng cùng lúc với mã giảm giá (giảm sau voucher)</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <History className="h-5 w-5 text-stone" />
        <h2 className="text-lg font-semibold">Lịch sử giao dịch</h2>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : lichSu.length === 0 ? (
        <p className="text-center text-stone py-8">Chưa có giao dịch nào</p>
      ) : (
        <div className="space-y-2">
          {lichSu.map((gd) => {
            const loai = LOAI[gd.loaiGiaoDich] || {}
            const Icon = loai.icon || Info
            const isTich = gd.loaiGiaoDich === 'TICH_LUY'
            return (
              <div key={gd.maLichSu} className={`border rounded-lg px-4 py-3 ${loai.cls || ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium text-sm">{loai.label}</span>
                    {gd.donHang?.maDonHang && (
                      <span className="text-xs text-stone">#Đơn {gd.donHang.maDonHang}</span>
                    )}
                  </div>
                  <span className="font-semibold text-sm">
                    {isTich ? '+' : ''}{gd.soDiem?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between mt-1 text-xs text-stone">
                  <span>{new Date(gd.thoiGian).toLocaleString('vi-VN')}</span>
                  {gd.maKenh && <span>{gd.maKenh}</span>}
                </div>
                {gd.ngayHetHan && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-gold">
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
            className="px-3 py-1 border rounded-lg disabled:opacity-30 hover:bg-ivory-100 text-sm">Trước</button>
          <span className="px-3 py-1 text-sm">Trang {page + 1}/{totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => load(page + 1)}
            className="px-3 py-1 border rounded-lg disabled:opacity-30 hover:bg-ivory-100 text-sm">Sau</button>
        </div>
      )}
    </div>
  )
}
