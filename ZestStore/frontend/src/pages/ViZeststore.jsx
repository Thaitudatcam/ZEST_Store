import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getSoDu, getLichSuVi, napTien, getPaymentById } from '../api/vi'
import { confirmVietQrPayment } from '../api/payment'
import { VND } from '../components/ProductCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { Wallet, ArrowDownLeft, ArrowUpRight, RefreshCw, Plus, X, Banknote, QrCode, Clock } from 'lucide-react'

const LOAI_LABELS = { 1: 'Nạp tiền', 2: 'Thanh toán' }
const LOAI_COLORS = { 1: 'text-emerald-deep bg-emerald-deep/10', 2: 'text-bordeaux bg-bordeaux/10' }
const LOAI_ICONS = { 1: ArrowDownLeft, 2: ArrowUpRight }

const PRESET_AMOUNTS = [20000, 50000, 100000, 200000, 500000, 1000000]

export default function ViZeststore() {
  const [soDu, setSoDu] = useState(0)
  const [lichSu, setLichSu] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [amount, setAmount] = useState('')
  const [selectedChip, setSelectedChip] = useState(null)
  const [napLoading, setNapLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [vietQrData, setVietQrData] = useState(null)
  const [confirmingQr, setConfirmingQr] = useState(false)
  const qrTimerRef = useRef(null)
  const qrPollRef = useRef(null)
  const [qrCountdown, setQrCountdown] = useState(900)
  const [searchParams] = useSearchParams()

  const loadSoDu = useCallback(() => getSoDu().then(d => setSoDu(d.soDu || 0)), [])

  const loadLichSu = useCallback((p) => {
    setLoading(true)
    getLichSuVi(p, 10)
      .then(data => {
        setLichSu(data.content || [])
        setTotalPages(data.totalPages || 0)
        setPage(data.number || 0)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadSoDu(); loadLichSu(0) }, [loadSoDu, loadLichSu])

  useEffect(() => {
    if (!vietQrData) return
    setQrCountdown(900)
    qrTimerRef.current = setInterval(() => {
      setQrCountdown(prev => { if (prev <= 1) { clearInterval(qrTimerRef.current); return 0 }; return prev - 1 })
    }, 1000)
    qrPollRef.current = setInterval(async () => {
      try {
        const res = await getPaymentById(vietQrData.paymentId)
        if (res.trangThaiThanhToan === 2) {
          clearInterval(qrTimerRef.current)
          clearInterval(qrPollRef.current)
          setVietQrData(null)
          setShowModal(false)
          setStatusMsg('Nạp tiền thành công!')
          loadSoDu()
          loadLichSu(0)
          setTimeout(() => setStatusMsg(''), 3000)
        }
      } catch (_) {}
    }, 5000)
    return () => {
      clearInterval(qrTimerRef.current)
      clearInterval(qrPollRef.current)
    }
  }, [vietQrData, loadSoDu, loadLichSu])

  useEffect(() => {
    const status = searchParams.get('status')
    if (status === 'pending') {
      setStatusMsg('Đang xử lý nạp tiền...')
      let retries = 0
      const poll = () => {
        if (retries >= 3) { setStatusMsg(''); return }
        retries++
        setTimeout(() => {
          loadSoDu().then(() => {
            setStatusMsg('Nạp tiền thành công!')
            setTimeout(() => setStatusMsg(''), 3000)
          }).catch(() => { poll() })
        }, 2000)
      }
      poll()
      window.history.replaceState({}, '', '/vi-zeststore')
    }
  }, [searchParams, loadSoDu])

  const handleChipClick = (val) => {
    setAmount(String(val))
    setSelectedChip(val)
  }

  const handleAmountChange = (e) => {
    setAmount(e.target.value)
    setSelectedChip(null)
  }

  const handleNap = async (phuongThuc) => {
    const soTien = parseInt(amount)
    if (!soTien || soTien <= 0) return
    setNapLoading(true)
    try {
      const result = await napTien(soTien, phuongThuc)
      if (result.qrUrl) {
        setVietQrData(result)
      } else if (result.paymentUrl) {
        window.location.href = result.paymentUrl
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Lỗi khi tạo yêu cầu nạp tiền')
    } finally {
      setNapLoading(false)
    }
  }

  const handleConfirmQr = async () => {
    if (!vietQrData) return
    setConfirmingQr(true)
    try {
      await confirmVietQrPayment(vietQrData.paymentId)
      clearInterval(qrTimerRef.current)
      clearInterval(qrPollRef.current)
      setVietQrData(null)
      setShowModal(false)
      setStatusMsg('Nạp tiền thành công!')
      loadSoDu()
      loadLichSu(0)
      setTimeout(() => setStatusMsg(''), 3000)
    } catch (err) {
      alert(err?.response?.data?.message || 'Lỗi xác nhận thanh toán')
    } finally {
      setConfirmingQr(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {statusMsg && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-gold/10 border border-gold/20 text-gold text-sm text-center">
          {statusMsg}
        </div>
      )}

      <div className="bg-gradient-to-r from-noir to-noir-800 rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="h-5 w-5" />
          <span className="font-semibold">Ví ZestStore</span>
        </div>
        <div className="text-3xl font-bold mb-1">{VND(soDu)}</div>
        <div className="text-ivory/60 text-sm mb-4">Số dư khả dụng</div>
        <button onClick={() => setShowModal(true)}
          className="bg-ivory text-gold px-4 py-2 rounded-lg text-sm font-medium hover:bg-gold/10 transition-colors flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Nạp tiền
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Lịch sử giao dịch</h2>
        <button onClick={() => { loadSoDu(); loadLichSu(0) }}
          className="text-sm text-gold hover:text-gold-hover flex items-center gap-1">
          <RefreshCw className="h-3.5 w-3.5" /> Làm mới
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="space-y-2">
          {lichSu.length === 0 && <p className="text-center text-stone py-8">Chưa có giao dịch</p>}
          {lichSu.map(gd => {
            const Icon = LOAI_ICONS[gd.loai] || ArrowDownLeft
            const colorCls = LOAI_COLORS[gd.loai] || 'text-stone bg-ivory-100'
            const amount = gd.loai === 1 ? `+${VND(gd.soTien)}` : `-${VND(gd.soTien)}`
            const amountColor = gd.loai === 1 ? 'text-emerald-deep' : 'text-bordeaux'
            return (
              <div key={gd.maGiaoDich} className="bg-ivory border border-stone/20 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center ${colorCls}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{gd.moTa || LOAI_LABELS[gd.loai] || 'Giao dịch'}</div>
                  <div className="text-xs text-stone">
                    {gd.thoiGian ? new Date(gd.thoiGian).toLocaleString('vi-VN') : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold text-sm ${amountColor}`}>{amount}</div>
                  <div className="text-xs text-stone">SD: {VND(gd.soDuSau)}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => loadLichSu(page - 1)} disabled={page === 0}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-ivory-100 disabled:opacity-30">Trước</button>
          <span className="text-sm text-stone">{page + 1} / {totalPages}</span>
          <button onClick={() => loadLichSu(page + 1)} disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-ivory-100 disabled:opacity-30">Sau</button>
        </div>
      )}

      {showModal && !vietQrData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="bg-ivory rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nạp tiền vào ví</h3>
              <button onClick={() => setShowModal(false)} className="text-stone hover:text-stone">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="text-sm text-stone mb-1.5 block">Số tiền nạp</label>
              <div className="relative">
                <input type="number" value={amount} onChange={handleAmountChange}
                  placeholder="Nhập số tiền"
                  className="w-full border rounded-xl px-4 py-3 text-lg font-semibold outline-none focus:ring-2 focus:ring-gold" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone text-sm">₫</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {PRESET_AMOUNTS.map(val => (
                <button key={val} onClick={() => handleChipClick(val)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${selectedChip === val ? 'bg-gold text-noir border-gold' : 'bg-ivory text-stone border-stone/20 hover:border-gold'}`}>
                  {VND(val)}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-sm text-stone mb-2">Chọn phương thức thanh toán</p>
              <button onClick={() => handleNap(4)} disabled={napLoading || !amount}
                className="w-full flex items-center gap-3 border rounded-xl px-4 py-3 hover:bg-ivory-100 disabled:opacity-40 transition-colors">
                <div className="h-8 w-12 bg-ivory-100 rounded flex items-center justify-center text-xs font-bold text-stone">VNPay</div>
                <span className="font-medium">VNPay</span>
              </button>
              <button onClick={() => handleNap(5)} disabled={napLoading || !amount}
                className="w-full flex items-center gap-3 border rounded-xl px-4 py-3 hover:bg-ivory-100 disabled:opacity-40 transition-colors">
                <div className="h-8 w-12 bg-ivory-100 rounded flex items-center justify-center text-xs font-bold text-pink-500">MoMo</div>
                <span className="font-medium">Ví MoMo</span>
              </button>
              <button onClick={() => handleNap(6)} disabled={napLoading || !amount}
                className="w-full flex items-center gap-3 border rounded-xl px-4 py-3 hover:bg-ivory-100 disabled:opacity-40 transition-colors">
                <div className="h-8 w-12 bg-ivory-100 rounded flex items-center justify-center text-xs font-bold text-gold">Zalo</div>
                <span className="font-medium">ZaloPay</span>
              </button>
              <button onClick={() => handleNap(8)} disabled={napLoading || !amount}
                className="w-full flex items-center gap-3 border rounded-xl px-4 py-3 hover:bg-ivory-100 disabled:opacity-40 transition-colors">
                <div className="h-8 w-12 bg-ivory-100 rounded flex items-center justify-center text-xs font-bold text-emerald-deep">
                  <QrCode className="h-5 w-5" />
                </div>
                <span className="font-medium">VietQR</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {vietQrData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { clearInterval(qrTimerRef.current); clearInterval(qrPollRef.current); setVietQrData(null) } }}>
          <div className="bg-ivory rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Quét mã QR để nạp tiền</h3>
              <button onClick={() => { clearInterval(qrTimerRef.current); clearInterval(qrPollRef.current); setVietQrData(null) }}
                className="text-stone hover:text-stone">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col items-center mb-4">
              <img src={vietQrData.qrUrl} alt="VietQR"
                className="w-64 h-64 border rounded-xl mb-3" />
              <div className="flex items-center gap-1.5 text-sm text-stone">
                <Clock className="h-4 w-4" />
                <span>{Math.floor(qrCountdown / 60)}:{(qrCountdown % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>

            <div className="bg-ivory-100 rounded-xl p-4 space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-stone">Ngân hàng</span>
                <span className="font-medium">{vietQrData.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone">Số tài khoản</span>
                <span className="font-medium">{vietQrData.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone">Chủ tài khoản</span>
                <span className="font-medium">{vietQrData.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone">Số tiền</span>
                <span className="font-semibold text-lg">{VND(vietQrData.amount)}</span>
              </div>
            </div>

            <button onClick={handleConfirmQr} disabled={confirmingQr}
              className="w-full bg-gold text-noir rounded-xl py-3 font-medium hover:bg-gold disabled:opacity-40 transition-colors">
              {confirmingQr ? 'Đang xử lý...' : 'Tôi đã thanh toán'}
            </button>
            <p className="text-xs text-stone text-center mt-2">Sau khi chuyển khoản, nhấn "Tôi đã thanh toán" để cộng tiền vào ví</p>
          </div>
        </div>
      )}
    </div>
  )
}