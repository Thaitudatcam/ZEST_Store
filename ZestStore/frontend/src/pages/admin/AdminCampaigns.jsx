import { useState, useEffect } from 'react'
import { getCampaigns, createCampaign, updateCampaign, deleteCampaign, toggleCampaignStatus, launchCampaign, getCoupons } from '../../api/admin'
import { Plus, X, Play, Gift, PenSquare, Trash2 } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [coupons, setCoupons] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [launching, setLaunching] = useState(null)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmToggle, setConfirmToggle] = useState(null)
  const [confirmLaunch, setConfirmLaunch] = useState(null)
  const [confirmSave, setConfirmSave] = useState(false)
  const [confirmEdit, setConfirmEdit] = useState(false)
  const [editPayload, setEditPayload] = useState(null)
  const [payloadRef, setPayloadRef] = useState(null)
  const [form, setForm] = useState({
    tenChuongTrinh: '', loaiTrigger: 0, maPhieuGiamGia: '',
    soNgayKhongHoatDong: '', doiTuong: '', dieuKien: '', ngayBatDau: '', ngayKetThuc: '',
  })

  const load = () => {
    getCampaigns().then(setCampaigns).catch(() => {})
    getCoupons().then(setCoupons).catch(() => {})
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async () => {
    setConfirmSave(false)
    try {
      await createCampaign(payloadRef)
      setShowForm(false)
      setForm({ tenChuongTrinh: '', loaiTrigger: 0, maPhieuGiamGia: '', soNgayKhongHoatDong: '', doiTuong: '', dieuKien: '', ngayBatDau: '', ngayKetThuc: '' })
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi tạo campaign')
    }
  }

  const requestCreate = (e) => {
    e.preventDefault()
    if (!form.tenChuongTrinh.trim() || !form.maPhieuGiamGia) { alert('Vui lòng nhập đủ thông tin'); return }
    if (form.loaiTrigger === 1 && !form.soNgayKhongHoatDong) { alert('Vui lòng nhập số ngày không hoạt động'); return }
    if (form.ngayBatDau && form.ngayKetThuc && new Date(form.ngayBatDau) >= new Date(form.ngayKetThuc)) { alert('Ngày bắt đầu phải nhỏ hơn ngày kết thúc!'); return }
    setPayloadRef({
      tenChuongTrinh: form.tenChuongTrinh,
      loaiTrigger: Number(form.loaiTrigger),
      maPhieuGiamGia: Number(form.maPhieuGiamGia),
      soNgayKhongHoatDong: form.soNgayKhongHoatDong ? Number(form.soNgayKhongHoatDong) : null,
      doiTuong: form.doiTuong ? Number(form.doiTuong) : null,
      dieuKien: form.dieuKien ? Number(form.dieuKien) : null,
      ngayBatDau: form.ngayBatDau ? form.ngayBatDau + 'T00:00:00' : null,
      ngayKetThuc: form.ngayKetThuc ? form.ngayKetThuc + 'T23:59:59' : null,
    })
    setConfirmSave(true)
  }

  const handleToggle = async (id) => {
    setConfirmToggle(null)
    try {
      await toggleCampaignStatus(id)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi')
    }
  }

  const handleLaunch = async (id) => {
    setConfirmLaunch(null)
    setLaunching(id)
    try {
      await launchCampaign(id)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi phát động')
    } finally { setLaunching(null) }
  }

  const doEdit = async () => {
    setConfirmEdit(false)
    try {
      await updateCampaign(editing.maChuongTrinh, editPayload)
      setEditing(null)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi sửa chương trình')
    }
  }

  const TRIGGER_LABELS = { 0: 'Đăng ký mới', 1: 'Quay lại', 2: 'Sự kiện' }
  const TRIGGER_COLORS = { 0: 'bg-gold/20 text-gold', 1: 'bg-amber-100 text-amber-700', 2: 'bg-royal/20 text-royal' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Chương trình quà tặng</h1>
        <button onClick={() => setShowForm(true)}
          className="bg-gold text-noir px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gold flex items-center gap-2">
          <Plus className="h-4 w-4" /> Thêm chương trình
        </button>
      </div>

      <div className="bg-ivory rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ivory-100 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-stone">Tên chương trình</th>
                <th className="text-center px-4 py-3 font-semibold text-stone">Loại</th>
                <th className="text-center px-4 py-3 font-semibold text-stone">Mã giảm giá</th>
                <th className="text-center px-4 py-3 font-semibold text-stone">Ngày BĐ → KT</th>
                <th className="text-center px-4 py-3 font-semibold text-stone">Trạng thái</th>
                <th className="text-center px-4 py-3 font-semibold text-stone"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {campaigns.map(c => (
                <tr key={c.maChuongTrinh} className="hover:bg-ivory-100">
                  <td className="px-4 py-3 font-medium">{c.tenChuongTrinh}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TRIGGER_COLORS[c.loaiTrigger] || 'bg-ivory-100 text-stone'}`}>
                      {TRIGGER_LABELS[c.loaiTrigger] || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-gold font-semibold">{c.maCode}</td>
                  <td className="px-4 py-3 text-center text-stone text-xs">
                    {c.ngayBatDau ? new Date(c.ngayBatDau).toLocaleDateString('vi-VN') : '—'} → {c.ngayKetThuc ? new Date(c.ngayKetThuc).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => setConfirmToggle(c.maChuongTrinh)}
                      className={`relative inline-flex h-4 w-8 items-center rounded-full transition ${c.trangThai === 1 ? 'bg-emerald-deep/100' : 'bg-ivory-100'} cursor-pointer`}>
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-ivory transition ${c.trangThai === 1 ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setEditing(c)} title="Sửa"
                        className="p-1 text-gold hover:bg-gold/10 rounded">
                        <PenSquare className="h-4 w-4" />
                      </button>
                      {c.loaiTrigger === 2 && c.trangThai === 1 && !c.daChayXong && (
                        <button onClick={() => setConfirmLaunch(c.maChuongTrinh)} disabled={launching === c.maChuongTrinh}
                          className="text-emerald-deep hover:bg-emerald-deep/10 p-1 rounded disabled:opacity-40" title="Phát động ngay">
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      {c.loaiTrigger === 2 && c.daChayXong && (
                        <span className="text-[10px] text-stone font-medium">Đã chạy</span>
                      )}
                      <button onClick={() => setConfirmDelete(c.maChuongTrinh)} title="Xóa"
                        className="p-1 text-bordeaux hover:bg-bordeaux/10 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {campaigns.length === 0 && <p className="text-center text-stone py-8">Chưa có chương trình quà tặng</p>}
      </div>

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-ivory rounded-2xl max-w-lg w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Thêm chương trình quà tặng</h2>
              <button onClick={() => setShowForm(false)} className="text-stone hover:text-stone"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={requestCreate} className="space-y-4">
              <input value={form.tenChuongTrinh} onChange={e => setForm({ ...form, tenChuongTrinh: e.target.value })}
                placeholder="Tên chương trình" required
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold" />

              <div>
                <label className="text-xs text-stone mb-1 block">Loại trigger</label>
                <div className="flex gap-2">
                  {[
                    { v: 0, l: 'Đăng ký mới' },
                    { v: 1, l: 'Quay lại' },
                    { v: 2, l: 'Sự kiện' },
                  ].map(t => (
                    <button key={t.v} type="button" onClick={() => setForm({ ...form, loaiTrigger: t.v })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition ${form.loaiTrigger === t.v ? 'border-blue-700 bg-gold/10 text-gold' : 'border-stone/20 text-stone hover:border-blue-300'}`}>
                      {t.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-stone mb-1 block">Mã giảm giá</label>
                <select value={form.maPhieuGiamGia} onChange={e => setForm({ ...form, maPhieuGiamGia: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold">
                  <option value="">Chọn mã giảm giá...</option>
                  {coupons.filter(c => c.trangThai === 1).map(c => (
                    <option key={c.maPhieuGiamGia} value={c.maPhieuGiamGia}>{c.maCode} — {c.moTa || ''}</option>
                  ))}
                </select>
              </div>

              {form.loaiTrigger === 1 && (
                <div>
                  <label className="text-xs text-stone mb-1 block">Số ngày không hoạt động</label>
                  <input type="number" value={form.soNgayKhongHoatDong} onChange={e => setForm({ ...form, soNgayKhongHoatDong: e.target.value })}
                    placeholder="VD: 30" min="1"
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>
              )}

              {form.loaiTrigger === 2 && (
                <div>
                  <label className="text-xs text-stone mb-1 block">Đối tượng</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setForm({ ...form, doiTuong: 0, dieuKien: '' })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition ${form.doiTuong === 0 ? 'border-blue-700 bg-gold/10 text-gold' : 'border-stone/20 text-stone'}`}>
                      Tất cả KH
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-stone mb-1 block">Ngày bắt đầu</label>
                  <input type="date" value={form.ngayBatDau} onChange={e => setForm({ ...form, ngayBatDau: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>
                <div>
                  <label className="text-xs text-stone mb-1 block">Ngày kết thúc</label>
                  <input type="date" value={form.ngayKetThuc} onChange={e => setForm({ ...form, ngayKetThuc: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="bg-gold text-noir px-6 py-2.5 rounded-lg font-semibold hover:bg-gold">Tạo</button>
                <button type="button" onClick={() => setShowForm(false)} className="border px-6 py-2.5 rounded-lg font-semibold hover:bg-ivory-100">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditing(null)}>
          <div className="bg-ivory rounded-2xl max-w-lg w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Sửa chương trình</h2>
              <button onClick={() => setEditing(null)} className="text-stone hover:text-stone"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={(e) => {
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
              setEditPayload(payload)
              setConfirmEdit(true)
            }}>
              <input name="tenChuongTrinh" defaultValue={editing.tenChuongTrinh}
                className="w-full border rounded-lg px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-gold" />

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="text-xs text-stone">Ngày bắt đầu</label>
                  <input type="date" name="ngayBatDau" defaultValue={editing.ngayBatDau ? editing.ngayBatDau.slice(0, 10) : ''}
                    className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>
                <div>
                  <label className="text-xs text-stone">Ngày kết thúc</label>
                  <input type="date" name="ngayKetThuc" defaultValue={editing.ngayKetThuc ? editing.ngayKetThuc.slice(0, 10) : ''}
                    className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>
              </div>

              {editing.loaiTrigger === 1 && (
                <div className="mb-3">
                  <label className="text-xs text-stone">Số ngày không hoạt động</label>
                  <input type="number" name="soNgayKhongHoatDong" defaultValue={editing.soNgayKhongHoatDong || ''}
                    min="1" className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>
              )}

              {editing.loaiTrigger === 2 && (
                <div className="mb-3">
                  <label className="text-xs text-stone">Đối tượng</label>
                  <div className="flex gap-2 mt-1">
                    {[
                      { v: 0, l: 'Tất cả KH' },
                    ].map(opt => (
                      <button key={opt.v} type="button" name="doiTuong" value={opt.v}
                        onClick={e => { const btns = e.currentTarget.parentElement.querySelectorAll('button'); btns.forEach(b => b.className = 'flex-1 py-2 rounded-lg text-sm font-medium border-2 border-stone/20 text-stone'); e.currentTarget.className = 'flex-1 py-2 rounded-lg text-sm font-medium border-2 border-blue-700 bg-gold/10 text-gold' }}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition ${(editing.doiTuong ?? 0) === opt.v ? 'border-blue-700 bg-gold/10 text-gold' : 'border-stone/20 text-stone'}`}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" className="bg-gold text-noir px-6 py-2.5 rounded-lg font-semibold hover:bg-gold">Lưu</button>
                <button type="button" onClick={() => setEditing(null)} className="border px-6 py-2.5 rounded-lg font-semibold hover:bg-ivory-100">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={confirmDelete !== null}
        title="Xác nhận"
        message="Xóa chương trình quà tặng này?"
        confirmText="Xóa"
        onConfirm={async () => {
          try {
            await deleteCampaign(confirmDelete)
            setConfirmDelete(null)
            load()
          } catch (err) {
            alert(err.response?.data?.message || 'Lỗi xóa')
          }
        }}
        onCancel={() => setConfirmDelete(null)}
      />
      <ConfirmDialog
        open={confirmToggle !== null}
        title="Đổi trạng thái chương trình"
        message="Bạn có chắc muốn đổi trạng thái của chương trình quà tặng này?"
        confirmText="Xác nhận"
        variant="gold"
        onConfirm={() => handleToggle(confirmToggle)}
        onCancel={() => setConfirmToggle(null)}
      />
      <ConfirmDialog
        open={confirmLaunch !== null}
        title="Phát động chương trình"
        message="Bạn có chắc muốn phát động chương trình quà tặng này ngay bây giờ?"
        confirmText="Phát động"
        variant="gold"
        onConfirm={() => handleLaunch(confirmLaunch)}
        onCancel={() => setConfirmLaunch(null)}
      />
      <ConfirmDialog
        open={confirmSave}
        title="Tạo chương trình quà tặng"
        message={`Bạn chắc chắn muốn tạo chương trình "${form.tenChuongTrinh}"?`}
        confirmText="Tạo"
        variant="gold"
        onConfirm={handleSubmit}
        onCancel={() => setConfirmSave(false)}
      />
      <ConfirmDialog
        open={confirmEdit}
        title="Cập nhật chương trình"
        message="Bạn chắc chắn muốn lưu các thay đổi cho chương trình này?"
        confirmText="Lưu"
        variant="gold"
        onConfirm={doEdit}
        onCancel={() => setConfirmEdit(false)}
      />
    </div>
  )
}
