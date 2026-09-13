import { useState, useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'

const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }
const parseCurrency = (str) => { const nums = str.replace(/[^0-9]/g, ''); return nums ? parseInt(nums, 10) : 0 }
const formatCurrency = (n) => { if (!n && n !== 0) return ''; return new Intl.NumberFormat('vi-VN').format(n) + ' đ' }

const QUICK_AMOUNTS = [100000, 200000, 500000, 1000000, 2000000, 5000000]

export default function PaymentModal({ open, onClose, thanhTien, onCheckout, placing, bankInfo, onConfirmQR, onConfirmPaid, onTransferTabActive }) {
  const [activeTab, setActiveTab] = useState('cash')
  const [tienKhachDua, setTienKhachDua] = useState('')
  const inputRef = useRef(null)

  const paidAmount = parseCurrency(tienKhachDua)
  const tienThua = paidAmount - thanhTien
  const isValid = paidAmount >= thanhTien

  useEffect(() => {
    if (open) {
      setTienKhachDua('')
      setActiveTab('cash')
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [open])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'transfer' && onTransferTabActive) {
      onTransferTabActive()
    }
  }

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && isValid && activeTab === 'cash' && !placing) onCheckout()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose, isValid, activeTab, placing, onCheckout])

  const handleQuickAmount = (amount) => {
    if (amount === 'exact') {
      setTienKhachDua(formatCurrency(thanhTien))
    } else {
      setTienKhachDua(formatCurrency(amount))
    }
  }

  const handleInputChange = (e) => {
    const raw = parseCurrency(e.target.value)
    setTienKhachDua(raw ? formatCurrency(raw) : '')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose} role="dialog" aria-modal="true" aria-label="Thanh toán">
      <div className="bg-ivory rounded-2xl w-full max-w-[480px] mx-4 shadow-2xl animate-scale-in"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
          <h2 className="text-lg font-bold text-ink">Thanh toán</h2>
          <button onClick={onClose} className="p-2 text-stone hover:text-ink hover:bg-ivory-100 rounded-xl transition" aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div role="tablist" className="flex border-b border-stone/10">
          <button role="tab" aria-selected={activeTab === 'cash'}
            onClick={() => handleTabChange('cash')}
            className={`flex-1 py-3 text-sm font-semibold transition relative ${
              activeTab === 'cash' ? 'text-[var(--primary-color)]' : 'text-stone hover:text-ink'
            }`}>
            Tiền mặt
            {activeTab === 'cash' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-color)]" />}
          </button>
          <button role="tab" aria-selected={activeTab === 'transfer'}
            onClick={() => handleTabChange('transfer')}
            className={`flex-1 py-3 text-sm font-semibold transition relative ${
              activeTab === 'transfer' ? 'text-[var(--primary-color)]' : 'text-stone hover:text-ink'
            }`}>
            Chuyển khoản
            {activeTab === 'transfer' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-color)]" />}
          </button>
        </div>

        {activeTab === 'cash' ? (
          <div className="px-6 py-5 space-y-4">
            <div className="bg-ivory-100 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-stone">Cần thanh toán</span>
              <span className="text-lg font-bold text-[var(--primary-color)]">{VND(thanhTien)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {QUICK_AMOUNTS.map(amount => (
                <button key={amount} onClick={() => handleQuickAmount(amount)}
                  className="px-3 py-2.5 border-2 border-stone/20 rounded-xl text-sm font-semibold hover:border-[var(--primary-color)] hover:bg-[var(--primary-bg)] transition">
                  {formatCurrency(amount)}
                </button>
              ))}
              <button onClick={() => handleQuickAmount('exact')}
                className="px-3 py-2.5 border-2 border-stone/20 rounded-xl text-sm font-semibold hover:border-[var(--primary-color)] hover:bg-[var(--primary-bg)] transition">
                Trả đúng
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone">Tiền khách đưa</label>
              <input ref={inputRef} value={tienKhachDua} onChange={handleInputChange}
                inputMode="numeric" aria-label="Tiền khách đưa"
                placeholder="Nhập số tiền..."
                className="w-full border border-stone/20 rounded-xl px-4 py-3 text-lg font-bold bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
            </div>

            {tienKhachDua && (
              <div className={`flex justify-between items-center px-4 py-2.5 rounded-xl ${tienThua >= 0 ? 'bg-emerald-deep/10 text-emerald-deep' : 'bg-bordeaux/10 text-bordeaux'}`}>
                <span className="text-sm font-semibold">{tienThua >= 0 ? 'Tiền thừa' : 'Thiếu'}</span>
                <span className="text-lg font-bold">{VND(Math.abs(tienThua))}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            <div className="bg-ivory-100 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-stone">Cần thanh toán</span>
              <span className="text-lg font-bold text-[var(--primary-color)]">{VND(thanhTien)}</span>
            </div>
            {bankInfo ? (
              <div className="space-y-3">
                {bankInfo.qrUrl && <img src={bankInfo.qrUrl} alt="VietQR" className="mx-auto w-48 h-48 rounded-xl" />}
                <div className="bg-ivory-100 rounded-xl p-3 text-left space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-stone">Ngân hàng:</span><span className="font-semibold">{bankInfo.bankName}</span></div>
                  <div className="flex justify-between"><span className="text-stone">STK:</span><span className="font-semibold">{bankInfo.accountNumber}</span></div>
                  <div className="flex justify-between"><span className="text-stone">Chủ TK:</span><span className="font-semibold">{bankInfo.accountName}</span></div>
                  <div className="flex justify-between border-t border-stone/10 pt-2 mt-2"><span className="text-stone">Số tiền:</span><span className="font-bold text-[var(--primary-color)]">{VND(thanhTien)}</span></div>
                </div>
                <p className="text-xs text-stone text-center">Khách quét mã bằng ứng dụng ngân hàng</p>
              </div>
            ) : (
              <p className="text-sm text-stone text-center py-6">Chưa có mã QR. Vui lòng chọn chuyển khoản sau khi tạo đơn.</p>
            )}
          </div>
        )}

        <div className="px-6 py-4 border-t border-stone/10 flex gap-3">
          <button onClick={onClose}
            className="px-5 py-3 border border-stone/20 rounded-xl text-sm font-semibold text-stone hover:bg-ivory-100 transition">
            Hủy
          </button>
          {activeTab === 'cash' ? (
            <button onClick={() => { if (onConfirmPaid) onConfirmPaid(paidAmount); onCheckout() }} disabled={!isValid || placing}
              className="flex-1 py-3 bg-[var(--primary-color)] text-white font-bold rounded-xl hover:bg-[var(--primary-hover)] transition disabled:opacity-40 disabled:cursor-not-allowed text-sm tracking-wide">
              {placing ? 'Đang xử lý...' : 'XÁC NHẬN THANH TOÁN'}
            </button>
          ) : (
            <button onClick={onConfirmQR} disabled={!bankInfo || placing}
              className="flex-1 py-3 bg-[var(--primary-color)] text-white font-bold rounded-xl hover:bg-[var(--primary-hover)] transition disabled:opacity-40 disabled:cursor-not-allowed text-sm tracking-wide">
              {placing ? 'Đang xử lý...' : 'Đã nhận tiền'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
