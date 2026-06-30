import { useState, useEffect } from 'react'
import { getUserVouchers, claimVoucher } from '../api/userVoucher'
import { useVoucher } from '../context/VoucherContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { Ticket, Gift, Clock, CheckCircle, XCircle } from 'lucide-react'

const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

const STATUS = { 1: { label: 'Khả dụng', cls: 'text-green-600 bg-green-50 border-green-200' }, 2: { label: 'Đã dùng', cls: 'text-gray-500 bg-gray-50 border-gray-200' }, 3: { label: 'Hết hạn', cls: 'text-red-500 bg-red-50 border-red-200' } }

export default function UserVouchers() {
  const { refreshVoucherCount } = useVoucher()
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [claimCode, setClaimCode] = useState('')
  const [claimMsg, setClaimMsg] = useState('')
  const [claiming, setClaiming] = useState(false)

  const load = async () => {
    setLoading(true)
    try { setVouchers(await getUserVouchers()) } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleClaim = async (e) => {
    e.preventDefault()
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

  if (loading) return <LoadingSpinner className="py-20" />

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Ticket className="h-7 w-7 text-blue-700" />
        <h1 className="text-2xl font-bold">Kho Voucher của tôi</h1>
      </div>

      <form onSubmit={handleClaim} className="bg-white rounded-xl border p-4 mb-6">
        <label className="block text-sm font-medium mb-2">Nhập mã voucher để nhận</label>
        <div className="flex gap-2">
          <input value={claimCode} onChange={e => setClaimCode(e.target.value)} placeholder="Nhập mã voucher..."
            className="flex-1 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="submit" disabled={claiming || !claimCode.trim()}
            className="bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition disabled:opacity-50 flex items-center gap-1.5">
            <Gift className="h-4 w-4" />
            Nhận
          </button>
        </div>
        {claimMsg && (
          <p className={`text-sm mt-2 ${claimMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {claimMsg.text}
          </p>
        )}
      </form>

      {vouchers.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Ticket className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p>Chưa có voucher nào</p>
          <p className="text-sm mt-1">Nhập mã voucher ở trên để nhận ưu đãi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vouchers.map((v) => {
            const s = STATUS[v.trangThai] || STATUS[1]
            return (
              <div key={v.maVoucherNguoiDung} className={`border rounded-xl p-4 ${s.cls}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded mb-1">
                      {v.maCode}
                    </span>
                    <p className="font-medium text-sm">
                      {v.kieuGiamGia === 1 ? `Giảm ${v.giaTriGiam}%` : v.kieuGiamGia === 3 ? 'Free ship' : `Giảm ${VND(v.giaTriGiam)}`}
                      {v.kieuGiamGia === 1 && v.giaTriGiamToiDa ? ` (tối đa ${VND(v.giaTriGiamToiDa)})` : ''}
                    </p>
                    {v.giaTriDonToiThieu > 0 && <p className="text-xs opacity-70 mt-0.5">Đơn tối thiểu {VND(v.giaTriDonToiThieu)}</p>}
                    <p className="text-xs opacity-60 mt-0.5">
                      <Clock className="h-3 w-3 inline mr-0.5" />
                      Nhận: {new Date(v.ngayNhan).toLocaleDateString('vi-VN')}
                      {v.ngaySuDung ? ` · Dùng: ${new Date(v.ngaySuDung).toLocaleDateString('vi-VN')}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium whitespace-nowrap">
                    {v.trangThai === 1 ? <CheckCircle className="h-4 w-4 text-green-600" /> : v.trangThai === 2 ? <CheckCircle className="h-4 w-4 text-gray-400" /> : <XCircle className="h-4 w-4 text-red-500" />}
                    {s.label}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
