import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getReturnRequests, approveReturn, rejectReturn } from '../../api/orders'
import { Loader, Search, CheckCircle, XCircle, RefreshCw, Clock, Image, ExternalLink } from 'lucide-react'
import { VND } from '../../components/ProductCard'

const FILTER_TABS = [
  { label: 'Tất cả', value: null },
  { label: 'Chờ duyệt', value: 1 },
  { label: 'Đã duyệt', value: 2 },
  { label: 'Từ chối', value: 3 },
]

const STATUS_MAP = { 1: { label: 'Chờ duyệt', color: 'bg-orange-100 text-orange-700' }, 2: { label: 'Đã chấp nhận', color: 'bg-green-100 text-green-700' }, 3: { label: 'Từ chối', color: 'bg-red-100 text-red-700' } }

export default function AdminReturns() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(null)
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectLyDo, setRejectLyDo] = useState('')
  const [imageModal, setImageModal] = useState(null)

  const load = () => {
    setLoading(true)
    getReturnRequests(filter).then(setRequests).catch(() => { }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [filter])

  useEffect(() => {
    if (filter !== 1) return
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [filter])

  const handleApprove = async (id) => {
    setActionLoading(id)
    try {
      await approveReturn(id)
      load()
    } catch { }
    finally { setActionLoading(null) }
  }

  const handleReject = async () => {
    if (!rejectModal) return
    setActionLoading(rejectModal)
    try {
      await rejectReturn(rejectModal, rejectLyDo.trim() || undefined)
      setRejectModal(null)
      setRejectLyDo('')
      load()
    } catch { }
    finally { setActionLoading(null) }
  }

  const filtered = requests.filter((r) =>
    !search || r.donHang?.maDonHang?.toString().includes(search) || (r.lyDo || '').toLowerCase().includes(search.toLowerCase()) || (r.nguoiDung?.hoTen || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý trả hàng</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm..."
              className="pl-9 pr-3 py-2 border rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={load} className="p-2 border rounded-xl hover:bg-gray-50 transition">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {FILTER_TABS.map((t) => (
          <button key={t.label} onClick={() => setFilter(t.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${filter === t.value ? 'bg-blue-700 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
            {t.label}
            {t.value !== null && <span className="ml-1.5 text-xs opacity-70">({requests.filter(r => r.trangThai === t.value).length})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader className="h-8 w-8 animate-spin text-blue-700" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <RefreshCw className="h-12 w-12 mx-auto mb-3" />
          <p>Không có yêu cầu trả hàng</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const stt = STATUS_MAP[r.trangThai] || { label: 'Không xác định', color: 'bg-gray-100 text-gray-600' }
            const order = r.donHang || {}
            const user = r.nguoiDung || {}
            const images = r.hinhAnh ? r.hinhAnh.split(',') : []
            return (
              <div key={r.maYeuCau} className="bg-white rounded-xl border p-5 hover:shadow-sm transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <RefreshCw className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/orders/${order.maDonHang}`} className="font-semibold text-blue-700 hover:underline flex items-center gap-1">
                          Đơn hàng #{order.maDonHang} <ExternalLink className="h-3 w-3" />
                        </Link>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stt.color}`}>{stt.label}</span>
                      </div>
                      <p className="text-xs text-gray-400">{new Date(r.ngayTao).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>
                  {r.trangThai === 1 && (
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(r.maYeuCau)} disabled={actionLoading === r.maYeuCau}
                        className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 transition disabled:opacity-50">
                        {actionLoading === r.maYeuCau ? <Loader className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                        Duyệt
                      </button>
                      <button onClick={() => setRejectModal(r.maYeuCau)}
                        className="flex items-center gap-1 bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-200 transition">
                        <XCircle className="h-3 w-3" /> Từ chối
                      </button>
                    </div>
                  )}
                </div>

                <div className="ml-13 space-y-2 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Lý do trả hàng</p>
                    <p className="text-gray-700">{r.lyDo}</p>
                  </div>
                  {r.lyDoTuChoi && (
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-500 mb-1">Lý do từ chối</p>
                      <p className="text-gray-700">{r.lyDoTuChoi}</p>
                    </div>
                  )}
                  {r.soTienHoan > 0 && (
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-600 mb-1">Số tiền hoàn</p>
                      <p className="text-green-700 font-semibold">{VND(r.soTienHoan)}</p>
                    </div>
                  )}
                  {r.hinhAnh && (
                    <div className="flex gap-2">
                      {images.map((img, i) => (
                        <button key={i} onClick={() => setImageModal(img)}
                          className="w-16 h-16 rounded-lg overflow-hidden border hover:opacity-80 transition">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    <p>Người yêu cầu: {user.hoTen || `#${user.maNguoiDung}`}</p>
                    <p>Email: {user.email || '—'}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4"
          onClick={() => { setRejectModal(null); setRejectLyDo('') }}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Từ chối yêu cầu trả hàng</h3>
            <p className="text-sm text-gray-500 mb-4">Nhập lý do từ chối (không bắt buộc)</p>
            <textarea value={rejectLyDo} onChange={(e) => setRejectLyDo(e.target.value)}
              placeholder="Lý do từ chối..."
              className="w-full border rounded-lg p-3 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-red-500" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setRejectModal(null); setRejectLyDo('') }}
                className="flex-1 border-2 border-gray-200 rounded-xl py-3 text-sm font-semibold hover:bg-gray-50 transition">Hủy</button>
              <button onClick={handleReject} disabled={actionLoading === rejectModal}
                className="flex-1 bg-red-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {actionLoading === rejectModal ? <Loader className="h-4 w-4 animate-spin" /> : null}
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {imageModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4"
          onClick={() => setImageModal(null)}>
          <div className="max-w-lg w-full animate-scale-in" onClick={e => e.stopPropagation()}>
            <img src={imageModal} alt="" className="w-full rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  )
}
