import { useState, useEffect, useRef } from 'react'
import { getCouponBatches, createCouponBatch, getCouponBatchVouchers } from '../../api/admin'
import { VND } from '../../components/ProductCard'
import { Plus, Package, Eye, X, Printer, Download } from 'lucide-react'

const KIEU = { 1: '%', 2: 'VND' }

export default function AdminCouponBatches() {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [viewCodes, setViewCodes] = useState(null)
  const [form, setForm] = useState({
    tenDot: '',
    kieuGiamGia: 1,
    giaTriGiam: '',
    soLuong: '',
    ngayBatDau: '',
    ngayKetThuc: '',
    giaTriDonToiThieu: '',
    giaTriGiamToiDa: '',
  })
  const printRef = useRef()

  const load = () => {
    setLoading(true)
    getCouponBatches().then(data => setBatches(Array.isArray(data) ? data : [])).catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const payload = {
        tenDot: form.tenDot.trim(),
        kieuGiamGia: Number(form.kieuGiamGia),
        giaTriGiam: Number(form.giaTriGiam),
        soLuong: Number(form.soLuong),
        ngayBatDau: form.ngayBatDau ? new Date(form.ngayBatDau).toISOString() : undefined,
        ngayKetThuc: form.ngayKetThuc ? new Date(form.ngayKetThuc).toISOString() : undefined,
        giaTriDonToiThieu: form.giaTriDonToiThieu ? Number(form.giaTriDonToiThieu) : undefined,
        giaTriGiamToiDa: form.giaTriGiamToiDa ? Number(form.giaTriGiamToiDa) : undefined,
      }
      const res = await createCouponBatch(payload)
      setViewCodes(res)
      setShowCreate(false)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Tạo đợt thất bại')
    } finally { setCreating(false) }
  }

  const handleViewCodes = async (batch) => {
    try {
      const res = await getCouponBatchVouchers(batch.maDot)
      setViewCodes({ ...batch, listMaCode: res.listMaCode })
    } catch { alert('Không thể tải danh sách mã') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Voucher cầm tay</h1>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-xl text-sm font-medium hover:bg-blue-800 transition">
          <Plus className="h-4 w-4" /> Tạo đợt mới
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Đang tải...</div>
      ) : batches.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Chưa có đợt phát hành nào</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {batches.map(b => (
            <div key={b.maDot} className="bg-white rounded-xl border p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold">{b.tenDot}</h3>
                <button onClick={() => handleViewCodes(b)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Eye className="h-4 w-4" />
                </button>
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <p>Giảm {KIEU[b.kieuGiamGia] === '%' ? `${b.giaTriGiam}%` : VND(b.giaTriGiam)}</p>
                <p>Số lượng: {b.daTao}/{b.soLuong}</p>
                {b.ngayKetThuc && <p>HSD: {new Date(b.ngayKetThuc).toLocaleDateString('vi-VN')}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Tạo đợt voucher cầm tay</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Tên đợt *</label>
                <input required value={form.tenDot} onChange={e => setForm(f => ({ ...f, tenDot: e.target.value }))}
                  placeholder="VD: Voucher khai trương 8/2026" className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Kiểu giảm *</label>
                  <select value={form.kieuGiamGia} onChange={e => setForm(f => ({ ...f, kieuGiamGia: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value={1}>%</option>
                    <option value={2}>Tiền mặt</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Giá trị *</label>
                  <input required type="number" min={0} step="any" value={form.giaTriGiam}
                    onChange={e => setForm(f => ({ ...f, giaTriGiam: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Số lượng mã *</label>
                <input required type="number" min={1} max={500} value={form.soLuong}
                  onChange={e => setForm(f => ({ ...f, soLuong: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Ngày bắt đầu</label>
                  <input type="datetime-local" value={form.ngayBatDau}
                    onChange={e => setForm(f => ({ ...f, ngayBatDau: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Ngày kết thúc</label>
                  <input type="datetime-local" value={form.ngayKetThuc}
                    onChange={e => setForm(f => ({ ...f, ngayKetThuc: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Đơn tối thiểu</label>
                  <input type="number" min={0} step="any" value={form.giaTriDonToiThieu}
                    onChange={e => setForm(f => ({ ...f, giaTriDonToiThieu: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Giảm tối đa</label>
                  <input type="number" min={0} step="any" value={form.giaTriGiamToiDa}
                    onChange={e => setForm(f => ({ ...f, giaTriGiamToiDa: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <button type="submit" disabled={creating}
                className="w-full py-2.5 bg-blue-700 text-white rounded-xl font-medium hover:bg-blue-800 transition disabled:opacity-50">
                {creating ? 'Đang tạo...' : 'Tạo đợt & sinh mã'}
              </button>
            </form>
          </div>
        </div>
      )}

      {viewCodes && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setViewCodes(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Mã voucher: {viewCodes.tenDot || `Đợt #${viewCodes.maDot}`}</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="In">
                  <Printer className="h-4 w-4" />
                </button>
                <button onClick={() => setViewCodes(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto" ref={printRef}>
              {viewCodes.listMaCode ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 print:grid-cols-4">
                  {viewCodes.listMaCode.map((code, i) => (
                    <div key={i} className="border border-dashed border-gray-300 rounded-lg p-3 text-center print:border-black">
                      <p className="font-mono font-bold text-sm tracking-wider">{code}</p>
                      <p className="text-[10px] text-gray-400 mt-1">ZestStore</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400">Đang tải...</p>
              )}
            </div>
            <p className="text-xs text-gray-400 text-center mt-4">Tổng số: {viewCodes.listMaCode?.length || 0} mã</p>
          </div>
        </div>
      )}
    </div>
  )
}
