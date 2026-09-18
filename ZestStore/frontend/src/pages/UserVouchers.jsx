import { useToast } from '../context/ToastContext'
import { useState, useEffect } from 'react'
import { getUserVouchers, claimVoucher, acceptVoucher } from '../api/userVoucher'
import { getAvailableCoupons } from '../api/coupons'
import { useVoucher } from '../context/VoucherContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { Ticket, Gift, Clock, CheckCircle, XCircle, Tag, AlertCircle } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'

const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }
const fmtPGG = (id) => (id == null ? '—' : `PGG${String(id).padStart(2, '0')}`)

const STATUS = {
  0: { label: 'Chờ nhận', cls: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  1: { label: 'Khả dụng', cls: 'text-emerald-deep bg-emerald-deep/10 border-emerald-deep/20' },
  2: { label: 'Đã dùng', cls: 'text-stone bg-ivory-100 border-stone/20', hidden: true },
  3: { label: 'Đã thu hồi', cls: 'text-bordeaux bg-bordeaux/10 border-bordeaux/20', hidden: true },
}

export default function UserVouchers() {
  const toast = useToast()
  const { refreshVoucherCount } = useVoucher()
  const [personal, setPersonal] = useState([])
  const [publicVouchers, setPublicVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [claimCode, setClaimCode] = useState('')
  const [claimMsg, setClaimMsg] = useState('')
  const [claiming, setClaiming] = useState(false)
  const [confirmClaim, setConfirmClaim] = useState(false)
  const [confirmAccept, setConfirmAccept] = useState(null)
  const [confirmPublic, setConfirmPublic] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [pv, pub] = await Promise.all([
        getUserVouchers(),
        getAvailableCoupons(0).catch(() => []),
      ])
      setPersonal(Array.isArray(pv) ? pv : [])
      setPublicVouchers(Array.isArray(pub) ? pub : [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleClaim = async () => {
    setConfirmClaim(false)
    if (!claimCode.trim()) return
    setClaiming(true)
    setClaimMsg('')
    try {
      await claimVoucher(claimCode.trim())
      setClaimMsg({ type: 'success', text: 'Nhận voucher thành công!' })
      setClaimCode('')
      load()
      refreshVoucherCount()
    } catch (err) {
      setClaimMsg({ type: 'error', text: err.response?.data?.message || 'Mã không hợp lệ' })
    } finally { setClaiming(false) }
  }

  const requestClaim = (e) => {
    e.preventDefault()
    if (!claimCode.trim()) return
    setConfirmClaim(true)
  }

  const handleAccept = async (v) => {
    setConfirmAccept(null)
    try {
      await acceptVoucher(v.maVoucherNguoiDung)
      load()
      refreshVoucherCount()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi nhận voucher')
    }
  }

  const handlePublic = async (v) => {
    setConfirmPublic(null)
    try {
      await claimVoucher(v.maCode)
      refreshVoucherCount()
      load()
    } catch {}
  }

  if (loading) return <LoadingSpinner className="py-20" />

  const publicCodes = new Set(personal.map((v) => v.maCode))
  const filteredPublic = publicVouchers.filter((v) => !publicCodes.has(v.maCode))

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Ticket className="h-7 w-7 text-gold" />
        <h1 className="text-2xl font-bold">Kho Voucher của tôi</h1>
      </div>

      <form onSubmit={requestClaim} className="bg-ivory rounded-xl border p-4 mb-6">
        <label className="block text-sm font-medium mb-2">Nhập mã voucher để nhận</label>
        <div className="flex gap-2">
          <input value={claimCode} onChange={e => setClaimCode(e.target.value)} placeholder="Nhập mã voucher..."
            className="flex-1 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
          <button type="submit" disabled={claiming || !claimCode.trim()}
            className="bg-gold text-noir px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gold-hover transition disabled:opacity-50 flex items-center gap-1.5">
            <Gift className="h-4 w-4" />
            Nhận
          </button>
        </div>
        {claimMsg && (
          <p className={`text-sm mt-2 ${claimMsg.type === 'success' ? 'text-emerald-deep' : 'text-bordeaux'}`}>
            {claimMsg.text}
          </p>
        )}
      </form>

      {personal.length > 0 && (
        <>
          <h2 className="font-semibold text-ink-soft mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-deep" /> Voucher của tôi ({personal.length})
          </h2>
          <div className="space-y-3 mb-6">
            {personal.map((v) => {
              const s = STATUS[v.trangThai] || STATUS[1]
              return (
                <div key={v.maVoucherNguoiDung} className={`border rounded-xl p-4 ${s.cls}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-block bg-ivory-100 text-stone text-[10px] font-mono font-semibold px-2 py-0.5 rounded">
                          {fmtPGG(v.maPhieuGiamGia)}
                        </span>
                        <span className="inline-block bg-gold/20 text-gold text-xs font-semibold px-2 py-0.5 rounded">
                          {v.maCode}
                        </span>
                        {v.trangThai === 0 && (
                          <span className="text-[10px] bg-yellow-100 text-yellow-700 font-semibold px-1.5 py-0.5 rounded">Chờ nhận</span>
                        )}
                        {v.trangThai === 1 && (
                          <span className="text-[10px] bg-emerald-deep/20 text-emerald-deep font-semibold px-1.5 py-0.5 rounded">Đã nhận</span>
                        )}
                      </div>
                      <p className="font-medium text-sm">
                        {v.kieuGiamGia === 1 ? `Giảm ${v.giaTriGiam}%` : v.kieuGiamGia === 3 ? (v.giaTriGiam > 0 ? `Giảm tối đa ${VND(v.giaTriGiam)} tiền ship` : 'Miễn phí vận chuyển') : `Giảm ${VND(v.giaTriGiam)}`}
                        {v.kieuGiamGia === 1 && v.giaTriGiamToiDa ? ` (tối đa ${VND(v.giaTriGiamToiDa)})` : ''}
                      </p>
                      {v.giaTriDonToiThieu > 0 && <p className="text-xs opacity-70 mt-0.5">Đơn tối thiểu {VND(v.giaTriDonToiThieu)}</p>}
                      <p className="text-xs opacity-70 mt-0.5">
                        {v.soLuongConLai == null ? 'Không giới hạn lượt · dùng nhiều lần' : `Còn ${v.soLuongConLai} lượt · dùng nhiều lần tới khi hết`}
                      </p>
                      <p className="text-xs opacity-60 mt-0.5">
                        <Clock className="h-3 w-3 inline mr-0.5" />
                        Nhận: {new Date(v.ngayNhan).toLocaleDateString('vi-VN')}
                        {v.ngaySuDung ? ` · Dùng: ${new Date(v.ngaySuDung).toLocaleDateString('vi-VN')}` : ''}
                        {v.ngayHetHan && v.trangThai === 0 ? ` · HSD: ${new Date(v.ngayHetHan).toLocaleDateString('vi-VN')}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1 text-xs font-medium whitespace-nowrap">
                        {v.trangThai === 0 ? <AlertCircle className="h-4 w-4 text-yellow-600" /> : v.trangThai === 1 ? <CheckCircle className="h-4 w-4 text-emerald-deep" /> : <XCircle className="h-4 w-4 text-bordeaux" />}
                        {s.label}
                      </div>
                      {v.trangThai === 0 && (
                        <button onClick={() => setConfirmAccept(v)}
                          className="bg-yellow-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-yellow-600 transition">
                          Nhận
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {filteredPublic.length > 0 && (
        <>
          <h2 className="font-semibold text-ink-soft mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-gold" /> Voucher công khai ({filteredPublic.length})
          </h2>
          <div className="space-y-3">
            {filteredPublic.map((v) => (
              <div key={v.maCode} className="border rounded-xl p-4 border-gold/10 bg-gold/10/30">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-block bg-gold/20 text-gold text-xs font-semibold px-2 py-0.5 rounded">
                        {v.maCode}
                      </span>
                      {v.maPhieuGiamGia != null && (
                        <span className="inline-block bg-ivory-100 text-stone text-[10px] font-mono font-semibold px-2 py-0.5 rounded">
                          {fmtPGG(v.maPhieuGiamGia)}
                        </span>
                      )}
                      <span className="text-[10px] bg-ivory-100 text-stone font-semibold px-1.5 py-0.5 rounded">Công khai</span>
                    </div>
                    <p className="font-medium text-sm">
                      {v.kieuGiamGia === 1 ? `Giảm ${v.giaTriGiam}%` : v.kieuGiamGia === 3 ? (v.giaTriGiam > 0 ? `Giảm tối đa ${VND(v.giaTriGiam)} tiền ship` : 'Miễn phí vận chuyển') : `Giảm ${VND(v.giaTriGiam)}`}
                      {v.kieuGiamGia === 1 && v.giaTriGiamToiDa ? ` (tối đa ${VND(v.giaTriGiamToiDa)})` : ''}
                    </p>
                    {v.giaTriDonToiThieu > 0 && <p className="text-xs opacity-70 mt-0.5">Đơn tối thiểu {VND(v.giaTriDonToiThieu)}</p>}
                    {v.ngayKetThuc && <p className="text-xs opacity-60 mt-0.5">HSD: {new Date(v.ngayKetThuc).toLocaleDateString('vi-VN')}</p>}
                  </div>
                  <button onClick={() => setConfirmPublic(v)} className="shrink-0 bg-gold text-noir text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-gold-hover transition">
                    Nhận
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {personal.length === 0 && filteredPublic.length === 0 && (
        <div className="text-center py-20 text-stone">
          <Ticket className="h-16 w-16 mx-auto mb-4 text-stone" />
          <p>Chưa có voucher nào</p>
          <p className="text-sm mt-1">Nhập mã voucher ở trên để nhận ưu đãi</p>
        </div>
      )}

      <ConfirmDialog
        open={confirmClaim}
        title="Nhận voucher"
        message={`Bạn chắc chắn muốn nhận voucher với mã "${claimCode}"?`}
        confirmText="Nhận"
        variant="gold"
        loading={claiming}
        onConfirm={handleClaim}
        onCancel={() => setConfirmClaim(false)}
      />
      <ConfirmDialog
        open={confirmAccept !== null}
        title="Nhận voucher"
        message={`Bạn chắc chắn muốn nhận voucher "${confirmAccept?.maCode || ''}" vào tài khoản?`}
        confirmText="Nhận"
        variant="gold"
        onConfirm={() => handleAccept(confirmAccept)}
        onCancel={() => setConfirmAccept(null)}
      />
      <ConfirmDialog
        open={confirmPublic !== null}
        title="Nhận voucher"
        message={`Bạn chắc chắn muốn nhận voucher "${confirmPublic?.maCode || ''}"?`}
        confirmText="Nhận"
        variant="gold"
        onConfirm={() => handlePublic(confirmPublic)}
        onCancel={() => setConfirmPublic(null)}
      />
    </div>
  )
}
