import { useState, useEffect } from 'react'
import { getSoDu, getLichSuVi } from '../api/vi'
import { VND } from '../components/ProductCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { Wallet, ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react'

const LOAI_LABELS = { 1: 'Nạp tiền', 2: 'Thanh toán' }
const LOAI_COLORS = { 1: 'text-green-600 bg-green-50', 2: 'text-red-600 bg-red-50' }
const LOAI_ICONS = { 1: ArrowDownLeft, 2: ArrowUpRight }

export default function ViZeststore() {
  const [soDu, setSoDu] = useState(0)
  const [lichSu, setLichSu] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadSoDu = () => getSoDu().then(d => setSoDu(d.soDu || 0))

  const loadLichSu = (p) => {
    setLoading(true)
    getLichSuVi(p, 20)
      .then(data => {
        setLichSu(data.content || [])
        setTotalPages(data.totalPages || 0)
        setPage(data.number || 0)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadSoDu(); loadLichSu(0) }, [])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="h-5 w-5" />
          <span className="font-semibold">Ví ZestStore</span>
        </div>
        <div className="text-3xl font-bold mb-1">{VND(soDu)}</div>
        <div className="text-blue-200 text-sm">Số dư khả dụng</div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Lịch sử giao dịch</h2>
        <button onClick={() => { loadSoDu(); loadLichSu(0) }}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
          <RefreshCw className="h-3.5 w-3.5" /> Làm mới
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="space-y-2">
          {lichSu.length === 0 && <p className="text-center text-gray-500 py-8">Chưa có giao dịch</p>}
          {lichSu.map(gd => {
            const Icon = LOAI_ICONS[gd.loai] || ArrowDownLeft
            const colorCls = LOAI_COLORS[gd.loai] || 'text-gray-600 bg-gray-50'
            const amount = gd.loai === 1 ? `+${VND(gd.soTien)}` : `-${VND(gd.soTien)}`
            const amountColor = gd.loai === 1 ? 'text-green-600' : 'text-red-600'
            return (
              <div key={gd.maGiaoDich} className="bg-white border rounded-xl px-4 py-3 flex items-center gap-3">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center ${colorCls}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{gd.moTa || LOAI_LABELS[gd.loai] || 'Giao dịch'}</div>
                  <div className="text-xs text-gray-400">
                    {gd.thoiGian ? new Date(gd.thoiGian).toLocaleString('vi-VN') : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold text-sm ${amountColor}`}>{amount}</div>
                  <div className="text-xs text-gray-400">SD: {VND(gd.soDuSau)}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => loadLichSu(page - 1)} disabled={page === 0}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-30">Trước</button>
          <span className="text-sm text-gray-500">{page + 1} / {totalPages}</span>
          <button onClick={() => loadLichSu(page + 1)} disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-30">Sau</button>
        </div>
      )}
    </div>
  )
}
