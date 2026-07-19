import { useState, useEffect } from 'react'
import { getCampaigns, createCampaign, updateCampaign, deleteCampaign, toggleCampaignStatus, launchCampaign, getCoupons } from '../../api/admin'
import { Plus, X, Play, Gift, PenSquare, Trash2 } from 'lucide-react'

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [coupons, setCoupons] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [launching, setLaunching] = useState(null)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [form, setForm] = useState({
    tenChuongTrinh: '', loaiTrigger: 0, maPhieuGiamGia: '',
    soNgayKhongHoatDong: '', doiTuong: '', dieuKien: '', ngayBatDau: '', ngayKetThuc: '',
  })

  const load = () => {
    getCampaigns().then(setCampaigns).catch(() => {})
    getCoupons().then(setCoupons).catch(() => {})
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.tenChuongTrinh.trim() || !form.maPhieuGiamGia) { alert('Vui lòng nhập đủ thông tin'); return }
    if (form.loaiTrigger === 1 && !form.soNgayKhongHoatDong) { alert('Vui lòng nhập số ngày không hoạt động'); return }
    if (form.ngayBatDau && form.ngayKetThuc && new Date(form.ngayBatDau) >= new Date(form.ngayKetThuc)) { alert('Ngày bắt đầu phải nhỏ hơn ngày kết thúc!'); return }
    try {
      const payload = {
        tenChuongTrinh: form.tenChuongTrinh,
        loaiTrigger: Number(form.loaiTrigger),
        maPhieuGiamGia: Number(form.maPhieuGiamGia),
        soNgayKhongHoatDong: form.soNgayKhongHoatDong ? Number(form.soNgayKhongHoatDong) : null,
        doiTuong: form.doiTuong ? Number(form.doiTuong) : null,
        dieuKien: form.dieuKien ? Number(form.dieuKien) : null,
        ngayBatDau: form.ngayBatDau ? form.ngayBatDau + 'T00:00:00' : null,
        ngayKetThuc: form.ngayKetThuc ? form.ngayKetThuc + 'T23:59:59' : null,
      }
      await createCampaign(payload)
      setShowForm(false)
      setForm({ tenChuongTrinh: '', loaiTrigger: 0, maPhieuGiamGia: '', soNgayKhongHoatDong: '', doiTuong: '', dieuKien: '', ngayBatDau: '', ngayKetThuc: '' })
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi tạo campaign')
    }
  }

  const handleToggle = async (id) => {
    try {
      await toggleCampaignStatus(id)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi')
    }
  }

  const handleLaunch = async (id) => {
    setLaunching(id)
    try {
      await launchCampaign(id)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi phát động')
    } finally { setLaunching(null) }
  }

  const TRIGGER_LABELS = { 0: 'Đăng ký mới', 1: 'Quay lại', 2: 'Sự kiện' }
  const TRIGGER_COLORS = { 0: 'bg-blue-100 text-blue-700', 1: 'bg-amber-100 text-amber-700', 2: 'bg-purple-100 text-purple-700' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Chương trình quà tặng</h1>
        <button onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Thêm chương trình
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Tên chương trình</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Loại</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Mã giảm giá</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Ngày BĐ → KT</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {campaigns.map(c => (
                <tr key={c.maChuongTrinh} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.tenChuongTrinh}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TRIGGER_COLORS[c.loaiTrigger] || 'bg-gray-100 text-gray-600'}`}>
                      {TRIGGER_LABELS[c.loaiTrigger] || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-blue-700 font-semibold">{c.maCode}</td>
                  <td className="px-4 py-3 text-center text-gray-500 text-xs">
                    {c.ngayBatDau ? new Date(c.ngayBatDau).toLocaleDateString('vi-VN') : '—'} → {c.ngayKetThuc ? new Date(c.ngayKetThuc).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleToggle(c.maChuongTrinh)}
                      className={`relative inline-flex h-4 w-8 items-center rounded-full transition ${c.trangThai === 1 ? 'bg-emerald-500' : 'bg-gray-300'} cursor-pointer`}>
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${c.trangThai === 1 ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setEditing(c)} title="Sửa"
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                        <PenSquare className="h-4 w-4" />
                      </button>
                      {c.loaiTrigger === 2 && c.trangThai === 1 && !c.daChayXong && (
                        <button onClick={() => handleLaunch(c.maChuongTrinh)} disabled={launching === c.maChuongTrinh}
                          className="text-green-600 hover:bg-green-50 p-1 rounded disabled:opacity-40" title="Phát động ngay">
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      {c.loaiTrigger === 2 && c.daChayXong && (
                        <span className="text-[10px] text-gray-400 font-medium">Đã chạy</span>
                      )}
                      <button onClick={() => setConfirmDelete(c.maChuongTrinh)} title="Xóa"
                        className="p-1 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {campaigns.length === 0 && <p className="text-center text-gray-500 py-8">Chưa có chương trình quà tặng</p>}
      </div>

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Thêm chương trình quà tặng</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input value={form.tenChuongTrinh} onChange={e => setForm({ ...form, tenChuongTrinh: e.target.value })}
                placeholder="Tên chương trình" required
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Loại trigger</label>
                <div className="flex gap-2">
                  {[
                    { v: 0, l: 'Đăng ký mới' },
                    { v: 1, l: 'Quay lại' },
                    { v: 2, l: 'Sự kiện' },
                  ].map(t => (
                    <button key={t.v} type="button" onClick={() => setForm({ ...form, loaiTrigger: t.v })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition ${form.loaiTrigger === t.v ? 'border-blue-700 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-blue-300'}`}>
                      {t.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Mã giảm giá</label>
                <select value={form.maPhieuGiamGia} onChange={e => setForm({ ...form, maPhieuGiamGia: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Chọn mã giảm giá...</option>
                  {coupons.filter(c => c.trangThai === 1).map(c => (
                    <option key={c.maPhieuGiamGia} value={c.maPhieuGiamGia}>{c.maCode} — {c.moTa || ''}</option>
                  ))}
                </select>
              </div>

              {form.loaiTrigger === 1 && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Số ngày không hoạt động</label>
                  <input type="number" value={form.soNgayKhongHoatDong} onChange={e => setForm({ ...form, soNgayKhongHoatDong: e.target.value })}
                    placeholder="VD: 30" min="1"
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}

              {form.loaiTrigger === 2 && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Đối tượng</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setForm({ ...form, doiTuong: 0, dieuKien: '' })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition ${form.doiTuong === 0 ? 'border-blue-700 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
                      Tất cả KH
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Ngày bắt đầu</label>
                  <input type="date" value={form.ngayBatDau} onChange={e => setForm({ ...form, ngayBatDau: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Ngày kết thúc</label>
                  <input type="date" value={form.ngayKetThuc} onChange={e => setForm({ ...form, ngayKetThuc: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700">Tạo</button>
                <button type="button" onClick={() => setShowForm(false)} className="border px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-50">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Sửa chương trình</h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const t = e.target
              const payload = {}
              if (t.tenChuongTrinh.value !== editing.tenChuongTrinh) payload.tenChuongTrinh = t.tenChuongTrinh.value
              if (t.ngayBatDau.value) payload.ngayBatDau = t.ngayBatDau.value + 'T00:00:00'
              else payload.ngayBatDau = null
              if (t.ngayKetThuc.value) payload.ngayKetThuc = t.ngayKetThuc.value + 'T23:59:59'
              else payload.ngayKetThuc = null
              if (t.ngayBatDau.value && t.ngayKetThuc.value && new Date(t.ngayBatDau.value) >= new Date(t.ngayKetThuc.value)) {
                alert('Ngày bắt đầu phải nhỏ hơn ngày kết thúc!'); return
              }
              if (t.soNgayKhongHoatDong?.value) payload.soNgayKhongHoatDong = Number(t.soNgayKhongHoatDong.value)
              if (editing.loaiTrigger === 2 && t.doiTuong?.value) payload.doiTuong = Number(t.doiTuong.value)
              try {
                await updateCampaign(editing.maChuongTrinh, payload)
                setEditing(null)
                load()
              } catch (err) {
                alert(err.response?.data?.message || 'Lỗi sửa chương trình')
              }
            }}>
              <input name="tenChuongTrinh" defaultValue={editing.tenChuongTrinh}
                className="w-full border rounded-lg px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="text-xs text-gray-500">Ngày bắt đầu</label>
                  <input type="date" name="ngayBatDau" defaultValue={editing.ngayBatDau ? editing.ngayBatDau.slice(0, 10) : ''}
                    className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Ngày kết thúc</label>
                  <input type="date" name="ngayKetThuc" defaultValue={editing.ngayKetThuc ? editing.ngayKetThuc.slice(0, 10) : ''}
                    className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {editing.loaiTrigger === 1 && (
                <div className="mb-3">
                  <label className="text-xs text-gray-500">Số ngày không hoạt động</label>
                  <input type="number" name="soNgayKhongHoatDong" defaultValue={editing.soNgayKhongHoatDong || ''}
                    min="1" className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}

              {editing.loaiTrigger === 2 && (
                <div className="mb-3">
                  <label className="text-xs text-gray-500">Đối tượng</label>
                  <div className="flex gap-2 mt-1">
                    {[
                      { v: 0, l: 'Tất cả KH' },
                    ].map(opt => (
                      <button key={opt.v} type="button" name="doiTuong" value={opt.v}
                        onClick={e => { const btns = e.currentTarget.parentElement.querySelectorAll('button'); btns.forEach(b => b.className = 'flex-1 py-2 rounded-lg text-sm font-medium border-2 border-gray-200 text-gray-500'); e.currentTarget.className = 'flex-1 py-2 rounded-lg text-sm font-medium border-2 border-blue-700 bg-blue-50 text-blue-700' }}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition ${(editing.doiTuong ?? 0) === opt.v ? 'border-blue-700 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700">Lưu</button>
                <button type="button" onClick={() => setEditing(null)} className="border px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-50">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Xác nhận</h3>
            <p className="text-sm text-gray-600 mb-4">Xóa chương trình quà tặng này?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-gray-50">Hủy</button>
              <button onClick={async () => {
                try {
                  await deleteCampaign(confirmDelete)
                  setConfirmDelete(null)
                  load()
                } catch (err) {
                  alert(err.response?.data?.message || 'Lỗi xóa')
                }
              }} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
