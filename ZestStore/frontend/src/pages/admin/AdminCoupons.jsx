import { useState, useEffect, useRef } from 'react'
import { getCoupons, generateCouponCode, createCoupon, deleteCoupon, filterCoupons, toggleCouponStatus, searchCustomers, updateCoupon } from '../../api/admin'
import { getActiveCategories } from '../../api/categories'
import { getProducts } from '../../api/products'
import { grantVoucher } from '../../api/userVoucher'
import { Plus, Trash2, Filter, X, Tag, Package, Layers, Gift, PenSquare } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'

const PAGE_SIZE = 15

const STA_LABELS = { 0: 'Đã huỷ', 1: 'Chưa BĐ', 2: 'Đang HĐ', 3: 'Hết lượt', 4: 'Hết hạn', 5: 'Đã xoá' }
const STA_COLORS = { 0: 'bg-bordeaux/20 text-bordeaux', 1: 'bg-yellow-100 text-yellow-700', 2: 'bg-emerald-deep/20 text-emerald-deep', 3: 'bg-gold/20 text-gold-hover', 4: 'bg-ivory-100 text-stone', 5: 'bg-ivory-100 text-stone' }

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState({ ngayBatDau: '', ngayKetThuc: '', kieuGiamGia: '', giaTriGiam: '' })
  const [page, setPage] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [prodSearch, setProdSearch] = useState('')
  const [grantModal, setGrantModal] = useState(null)
  const [granting, setGranting] = useState(false)
  const [grantMsg, setGrantMsg] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [userResults, setUserResults] = useState([])
  const [searchingUser, setSearchingUser] = useState(false)
  const [catTab, setCatTab] = useState('categories')
  const [editing, setEditing] = useState(null)
  const [confirmToggle, setConfirmToggle] = useState(null)
  const [confirmSave, setConfirmSave] = useState(false)
  const [confirmEdit, setConfirmEdit] = useState(false)
  const [editPayload, setEditPayload] = useState(null)
  const [confirmGrant, setConfirmGrant] = useState(null)
  const [form, setForm] = useState({
    maCode: '', kieuGiamGia: 1, giaTriGiam: '', giaTriDonToiThieu: '',
    ngayBatDau: '', ngayKetThuc: '', soLuong: '', giaTriGiamToiDa: '',
    maDanhMucIds: [], maSanPhamIds: [], congKhai: true,
  })

  useEffect(() => { getActiveCategories().then(setCategories).catch(() => {}) }, [])
  useEffect(() => {
    getProducts({ page: 0, size: 100, search: prodSearch || undefined })
      .then(r => setProducts(r.content || r || []))
      .catch(() => {})
  }, [prodSearch])

  const load = (filterParams = {}) => {
    const hasFilter = Object.values(filterParams).some(v => v !== '')
    if (hasFilter) {
      const params = new URLSearchParams()
      if (filterParams.ngayBatDau) params.append('ngayBatDau', filterParams.ngayBatDau + 'T00:00:00')
      if (filterParams.ngayKetThuc) params.append('ngayKetThuc', filterParams.ngayKetThuc + 'T23:59:59')
      if (filterParams.kieuGiamGia) params.append('kieuGiamGia', filterParams.kieuGiamGia)
      if (filterParams.giaTriGiam) params.append('giaTriGiam', filterParams.giaTriGiam)
      filterCoupons(params.toString()).then(setCoupons).catch(() => {})
    } else {
      getCoupons().then(setCoupons).catch(() => {})
    }
  }

  useEffect(() => { load() }, [])

  const handleFilter = () => {
    if (filter.ngayBatDau && filter.ngayKetThuc && new Date(filter.ngayBatDau) > new Date(filter.ngayKetThuc)) {
      alert('Ngày bắt đầu phải nhỏ hơn ngày kết thúc!'); return
    }
    if (filter.giaTriGiam && Number(filter.giaTriGiam) < 0) { alert('Giá trị giảm không được âm!'); return }
    if (filter.giaTriGiam && Number(filter.giaTriGiam) > 100000000) { alert('Giá trị giảm quá lớn!'); return }
    if (filter.kieuGiamGia === '1' && filter.giaTriGiam && Number(filter.giaTriGiam) > 100) { alert('Phần trăm giảm không được vượt quá 100%!'); return }
    load(filter)
  }

  const handleResetFilter = () => {
    const reset = { ngayBatDau: '', ngayKetThuc: '', kieuGiamGia: '', giaTriGiam: '' }
    setFilter(reset)
    load({})
  }

  const hasFilter = Object.values(filter).some(v => v !== '')

  const validate = () => {
    // Mã code được tự gen nếu để trống — chỉ validate khi user nhập tay.
    if (form.maCode.trim() && !/^[A-Z0-9-]{3,50}$/i.test(form.maCode.trim())) { alert('Mã code chỉ gồm chữ, số, gạch ngang (3-50 ký tự)!'); return false }
    if (form.kieuGiamGia !== 3 && (!form.giaTriGiam || Number(form.giaTriGiam) <= 0)) { alert('Giá trị giảm phải lớn hơn 0!'); return false }
    if (form.kieuGiamGia === 1 && Number(form.giaTriGiam) > 100) { alert('Phần trăm giảm không được vượt quá 100%!'); return false }
    if (!form.ngayBatDau) { alert('Vui lòng chọn ngày bắt đầu!'); return false }
    if (!form.ngayKetThuc) { alert('Vui lòng chọn ngày kết thúc!'); return false }
    if (new Date(form.ngayBatDau) >= new Date(form.ngayKetThuc)) { alert('Ngày bắt đầu phải nhỏ hơn ngày kết thúc!'); return false }
    if (new Date(form.ngayBatDau) < new Date(new Date().toDateString())) { alert('Ngày bắt đầu không được là ngày quá khứ!'); return false }
    if (form.giaTriDonToiThieu && Number(form.giaTriDonToiThieu) < 0) { alert('Giá trị đơn tối thiểu không được âm!'); return false }
    if (form.soLuong && Number(form.soLuong) <= 0) { alert('Số lượng phải lớn hơn 0!'); return false }
    if (form.kieuGiamGia === 1 && form.giaTriGiamToiDa && Number(form.giaTriGiamToiDa) <= 0) { alert('Giá trị giảm tối đa phải lớn hơn 0!'); return false }
    return true
  }

  const toggleCategory = (id) => {
    setForm(f => ({
      ...f,
      maDanhMucIds: f.maDanhMucIds.includes(id)
        ? f.maDanhMucIds.filter(x => x !== id)
        : [...f.maDanhMucIds, id]
    }))
  }

  const toggleProduct = (id) => {
    setForm(f => ({
      ...f,
      maSanPhamIds: f.maSanPhamIds.includes(id)
        ? f.maSanPhamIds.filter(x => x !== id)
        : [...f.maSanPhamIds, id]
    }))
  }

  const handleSubmit = async () => {
    setConfirmSave(false)
    try {
      await createCoupon(payloadRef.current)
      setShowForm(false)
      setForm({ maCode: '', kieuGiamGia: 1, giaTriGiam: '', giaTriDonToiThieu: '', ngayBatDau: '', ngayKetThuc: '', soLuong: '', giaTriGiamToiDa: '', maDanhMucIds: [], maSanPhamIds: [], congKhai: true })
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi tạo coupon')
    }
  }

  const payloadRef = useRef(null)

  const requestCreate = (e) => {
    e.preventDefault()
    if (!validate()) return
    payloadRef.current = {
      maCode: form.maCode?.trim() ? form.maCode.trim().toUpperCase() : null,
      kieuGiamGia: form.kieuGiamGia,
      giaTriGiam: Number(form.giaTriGiam),
      giaTriDonToiThieu: form.giaTriDonToiThieu ? Number(form.giaTriDonToiThieu) : null,
      ngayBatDau: form.ngayBatDau + 'T' + new Date().toTimeString().slice(0, 8),
      ngayKetThuc: form.ngayKetThuc + 'T23:59:59',
      soLuong: form.soLuong ? Number(form.soLuong) : null,
      giaTriGiamToiDa: form.kieuGiamGia === 2 || form.kieuGiamGia === 3 ? null : (form.giaTriGiamToiDa ? Number(form.giaTriGiamToiDa) : null),
      maDanhMucIds: form.maDanhMucIds.length > 0 ? form.maDanhMucIds : null,
      maSanPhamIds: form.maSanPhamIds.length > 0 ? form.maSanPhamIds : null,
      congKhai: form.congKhai,
    }
    setConfirmSave(true)
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await deleteCoupon(confirmDelete)
      setConfirmDelete(null)
      load()
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Lỗi xóa coupon')
    }
  }

  const handleToggleStatus = async (id) => {
    setConfirmToggle(null)
    try {
      await toggleCouponStatus(id)
      load(filter)
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi thay đổi trạng thái')
    }
  }

  const doGrant = async (user) => {
    setConfirmGrant(null)
    setGranting(true); setGrantMsg('')
    try {
      const res = await grantVoucher(user.maNguoiDung, grantModal.maPhieuGiamGia)
      setGrantMsg({ type: 'success', text: res.message || 'Đã cấp thành công!' })
      setUserResults([]); setUserSearch('')
      load()
    } catch (err) {
      setGrantMsg({ type: 'error', text: err.response?.data?.message || 'Lỗi cấp voucher' })
    } finally { setGranting(false) }
  }

  const doEdit = async () => {
    setConfirmEdit(false)
    try {
      await updateCoupon(editing.maPhieuGiamGia, editPayload)
      setEditing(null)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi sửa coupon')
    }
  }

  useEffect(() => { setPage(0) }, [coupons.length])
  const totalPages = Math.ceil(coupons.length / PAGE_SIZE)
  const paged = coupons.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—')
  const fmtPGG = (id) => (id == null ? '—' : `PGG${String(id).padStart(2, '0')}`)
  const StaBadge = ({ c }) => {
    const st = c.trangThaiThucTe ?? c.trangThai
    const label = STA_LABELS[st] ?? 'Không xác định'
    const color = STA_COLORS[st] ?? 'bg-ivory-100 text-stone'
    return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${color}`}>{label}</span>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mã giảm giá</h1>
        <button onClick={() => { if (coupons.length >= 70) { alert('Đã đạt giới hạn 70 mã giảm giá'); return }; setShowForm(true) }}
          className="bg-gold text-noir px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gold-hover flex items-center gap-2">
          <Plus className="h-4 w-4" /> Thêm mã
        </button>
      </div>

      {/* Filter */}
      <div className="bg-ivory rounded-2xl shadow-sm border p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-stone" />
          <span className="font-semibold text-sm text-ink-soft">Bộ lọc</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-stone">Ngày bắt đầu</label>
            <input type="date" value={filter.ngayBatDau} onChange={e => setFilter({ ...filter, ngayBatDau: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
          </div>
          <div>
            <label className="text-xs text-stone">Ngày kết thúc</label>
            <input type="date" value={filter.ngayKetThuc} onChange={e => setFilter({ ...filter, ngayKetThuc: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
          </div>
          <div>
            <label className="text-xs text-stone">Kiểu giảm</label>
            <select value={filter.kieuGiamGia} onChange={e => setFilter({ ...filter, kieuGiamGia: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-gold">
              <option value="">Tất cả</option>
              <option value="1">Giảm theo %</option>
              <option value="2">Giảm tiền mặt</option>
              <option value="3">Freeship</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-stone">Giá trị giảm</label>
            <input type="number" value={filter.giaTriGiam} onChange={e => setFilter({ ...filter, giaTriGiam: e.target.value })}
              placeholder="Nhập giá trị..."
              className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={handleFilter} className="bg-gold text-noir px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gold-hover flex items-center gap-2">
            <Filter className="h-4 w-4" /> Lọc
          </button>
          {hasFilter && (
            <button onClick={handleResetFilter} className="border px-4 py-2 rounded-lg text-sm font-semibold hover:bg-ivory-100 flex items-center gap-2 text-stone">
              <X className="h-4 w-4" /> Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-ivory rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ivory-100 border-b">
              <tr>
                <th className="text-center px-3 py-3 font-semibold text-stone">STT</th>
                <th className="text-center px-3 py-3 font-semibold text-stone">Mã phiếu giảm giá</th>
                <th className="text-left px-3 py-3 font-semibold text-stone">Tên mã</th>
                <th className="text-center px-3 py-3 font-semibold text-stone">Giảm</th>
                <th className="text-center px-3 py-3 font-semibold text-stone">SL</th>
                <th className="text-center px-3 py-3 font-semibold text-stone">Giảm tối đa</th>
                <th className="text-center px-3 py-3 font-semibold text-stone">Áp dụng cho</th>
                <th className="text-center px-3 py-3 font-semibold text-stone">Ngày BĐ → KT</th>
                <th className="text-center px-3 py-3 font-semibold text-stone">Trạng thái</th>
                <th className="text-center px-3 py-3 font-semibold text-stone"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.map((c, idx) => (
                <tr key={c.maPhieuGiamGia}
                  className={`hover:bg-ivory-100 ${c.kieuGiamGia === 3 ? 'bg-emerald-deep/10/40' : [0, 4, 5].includes(c.trangThaiThucTe ?? c.trangThai) ? 'bg-bordeaux/10' : ''}`}>
                  <td className="px-3 py-3 text-center font-mono text-xs text-stone">
                    {page * PAGE_SIZE + idx + 1}
                  </td>
                  <td className="px-3 py-3 text-center font-mono text-xs font-semibold text-stone">
                    {fmtPGG(c.maPhieuGiamGia)}
                  </td>
                  <td className={`px-3 py-3 font-mono font-semibold ${c.kieuGiamGia === 3 ? 'text-emerald-deep' : 'text-gold'}`}>
                    {c.maCode}

                  </td>
                  <td className="px-3 py-3 text-center">
                    {c.kieuGiamGia === 1 ? `${c.giaTriGiam}%` : c.kieuGiamGia === 3 ? (c.giaTriGiam && Number(c.giaTriGiam) > 0 ? `Giảm tối đa ${VND(c.giaTriGiam)} tiền ship` : 'Miễn phí vận chuyển') : VND(c.giaTriGiam)}
                  </td>
                  <td className="px-3 py-3 text-center">{c.soLuong ?? '∞'}</td>
                  <td className="px-3 py-3 text-center">{c.kieuGiamGia === 2 || c.kieuGiamGia === 3 ? '—' : c.giaTriGiamToiDa ? VND(c.giaTriGiamToiDa) : '∞'}</td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex flex-wrap justify-center gap-1 max-w-[160px] mx-auto">
                      {c.danhMucApDung?.length > 0 && c.danhMucApDung.map(dm => (
                        <span key={dm.maDanhMuc} className="inline-flex items-center gap-0.5 text-[9px] bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded-full">
                          <Layers className="h-2.5 w-2.5" />{dm.tenDanhMuc}
                        </span>
                      ))}
                      {c.sanPhamApDung?.length > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] bg-gold/10 text-gold-hover px-1.5 py-0.5 rounded-full">
                          <Package className="h-2.5 w-2.5" />{c.sanPhamApDung.length} SP
                        </span>
                      )}
                      {(!c.danhMucApDung || c.danhMucApDung.length === 0) && (!c.sanPhamApDung || c.sanPhamApDung.length === 0) && (
                        <span className="text-[10px] text-stone">Tất cả</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-stone text-xs">{fmtDate(c.ngayBatDau)} → {fmtDate(c.ngayKetThuc)}</td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <StaBadge c={c} />
                      <button type="button" onClick={() => setConfirmToggle(c.maPhieuGiamGia)}
                        disabled={c.ngayKetThuc && new Date(c.ngayKetThuc) < new Date()}
                        className={`relative inline-flex h-4 w-8 items-center rounded-full transition ${c.trangThai === 1 ? 'bg-emerald-deep/100' : 'bg-ivory-100'} ${c.ngayKetThuc && new Date(c.ngayKetThuc) < new Date() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-ivory transition ${c.trangThai === 1 ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setEditing(c)} title="Sửa mã giảm giá"
                        className="p-1 text-gold hover:bg-gold/10 rounded">
                        <PenSquare className="h-4 w-4" />
                      </button>
                      <button onClick={() => setGrantModal(c)} title="Cấp voucher cho người dùng"
                        className="p-1 text-royal hover:bg-royal/10 rounded">
                        <Gift className="h-4 w-4" />
                      </button>
                      <button onClick={() => setConfirmDelete(c.maPhieuGiamGia)} className="p-1 text-bordeaux hover:bg-bordeaux/10 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {coupons.length === 0 && <p className="text-center text-stone py-8">Chưa có mã giảm giá</p>}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t">
            <button disabled={page === 0} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-ivory-100 disabled:opacity-40">Trước</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)} className={`px-3 py-1.5 text-xs rounded-lg border ${i === page ? 'bg-gold text-noir border-gold' : 'hover:bg-ivory-100'}`}>{i + 1}</button>
            ))}
            <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-ivory-100 disabled:opacity-40">Sau</button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-ivory rounded-2xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Thêm mã giảm giá</h2>
              <button onClick={() => setShowForm(false)} className="text-stone hover:text-stone">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={requestCreate} className="space-y-4">
              <div className="flex gap-2">
                <input value={form.maCode} onChange={e => setForm({ ...form, maCode: e.target.value.toUpperCase() })}
                  placeholder="Tên mã (vd: SALE50K, để trống = tự gen)"
                  className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold" />
                <button type="button" onClick={async () => {
                  try {
                    const r = await generateCouponCode()
                    setForm(f => ({ ...f, maCode: r.maCode || '' }))
                  } catch { alert('Không gen được mã, vui lòng nhập tay') }
                }}
                  className="shrink-0 border px-4 py-2 rounded-lg text-sm font-semibold hover:bg-ivory-100 text-gold border-gold/30">
                  Tự gen
                </button>
              </div>
              <p className="text-[11px] text-stone -mt-2">Mã phiếu giảm giá (vd: PGG01) tự tạo theo ID. Tên mã (vd: SALE50K) để trống sẽ tự sinh.</p>

              {/* Type selector */}
              <div className="flex gap-2">
                <button type="button" onClick={() => setForm({ ...form, kieuGiamGia: 1, giaTriGiam: '' })}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition ${form.kieuGiamGia !== 3 ? 'border-gold bg-gold/10 text-gold' : 'border-stone/20 text-stone hover:border-stone/30'}`}>
                  <span className="block text-base">Giảm sản phẩm</span>
                  <span className="block text-[10px] font-normal mt-0.5 opacity-70">Trừ vào tiền sản phẩm</span>
                </button>
                <button type="button" onClick={() => setForm({ ...form, kieuGiamGia: 3, giaTriGiam: '0' })}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition ${form.kieuGiamGia === 3 ? 'border-emerald-deep bg-emerald-deep/10 text-emerald-deep' : 'border-stone/20 text-stone hover:border-emerald-deep/30'}`}>
                  <span className="block text-base">Freeship</span>
                  <span className="block text-[10px] font-normal mt-0.5 opacity-70">Trừ vào phí vận chuyển</span>
                </button>
              </div>

              {/* Discount value */}
              {form.kieuGiamGia === 3 ? (
                <div>
                  <p className="text-xs text-emerald-deep bg-emerald-deep/10 rounded-lg px-3 py-2 mb-3">
                    Mã freeship sẽ giảm trực tiếp vào <strong>phí vận chuyển</strong>.
                  </p>
                  <label className="block text-sm font-medium text-ink-soft mb-1">Giảm tối đa cho phí vận chuyển</label>
                  <input type="number" value={form.giaTriGiam === '0' ? '' : form.giaTriGiam}
                    onChange={e => setForm({ ...form, giaTriGiam: e.target.value })}
                    placeholder="Nhập số tiền giảm tối đa (₫)"
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={form.giaTriGiam === '0'} />
                  <label className="flex items-center gap-2 text-sm text-stone mt-2">
                    <input type="checkbox" checked={form.giaTriGiam === '0'}
                      onChange={e => setForm({ ...form, giaTriGiam: e.target.checked ? '0' : '' })} className="h-4 w-4" />
                    Miễn phí vận chuyển hoàn toàn
                  </label>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2 mb-3">
                    <button type="button" onClick={() => setForm({ ...form, kieuGiamGia: 1, giaTriGiam: '' })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition ${form.kieuGiamGia === 1 ? 'border-gold bg-gold/10 text-gold' : 'border-stone/20 text-stone'}`}>
                      % Theo phần trăm
                    </button>
                    <button type="button" onClick={() => setForm({ ...form, kieuGiamGia: 2, giaTriGiam: '' })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition ${form.kieuGiamGia === 2 ? 'border-gold bg-gold/10 text-gold' : 'border-stone/20 text-stone'}`}>
                      ₫ Giảm tiền mặt
                    </button>
                  </div>
                  <input type="number" value={form.giaTriGiam}
                    onChange={e => setForm({ ...form, giaTriGiam: e.target.value })}
                    placeholder={form.kieuGiamGia === 1 ? 'Phần trăm giảm (vd: 10)' : 'Số tiền giảm'} required
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>
              )}

              <input type="number" value={form.giaTriDonToiThieu} onChange={e => setForm({ ...form, giaTriDonToiThieu: e.target.value })}
                placeholder="Giá trị đơn tối thiểu" className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold" />
              <input type="number" value={form.soLuong} onChange={e => setForm({ ...form, soLuong: e.target.value })}
                placeholder="Số lượng mã (để trống = không giới hạn)" className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold" />

              {form.kieuGiamGia === 1 && (
                <input type="number" value={form.giaTriGiamToiDa} onChange={e => setForm({ ...form, giaTriGiamToiDa: e.target.value })}
                  placeholder="Giá trị giảm tối đa (để trống = không giới hạn)" className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold" />
              )}

              {/* Category/Product selection */}
              <div>
                <label className="text-sm font-medium text-ink-soft mb-1 block">Giới hạn áp dụng (không chọn = áp dụng cho tất cả)</label>
                <div className="flex gap-1 mb-2">
                  <button type="button" onClick={() => setCatTab('categories')}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium border transition ${catTab === 'categories' ? 'bg-gold/10 border-stone/30 text-gold' : 'border-stone/20 text-stone'}`}>
                    <Layers className="h-3 w-3 inline mr-1" />Danh mục
                  </button>
                  <button type="button" onClick={() => setCatTab('products')}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium border transition ${catTab === 'products' ? 'bg-gold/10 border-stone/30 text-gold' : 'border-stone/20 text-stone'}`}>
                    <Package className="h-3 w-3 inline mr-1" />Sản phẩm
                  </button>
                </div>
                {catTab === 'categories' ? (
                  <div className="max-h-32 overflow-y-auto border rounded-lg p-2 space-y-1">
                    {categories.map(dm => (
                      <label key={dm.maDanhMuc} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-ivory-100 px-2 py-1 rounded">
                        <input type="checkbox" checked={form.maDanhMucIds.includes(dm.maDanhMuc)}
                          onChange={() => toggleCategory(dm.maDanhMuc)} className="h-4 w-4" />
                        {dm.tenDanhMuc}
                      </label>
                    ))}
                    {categories.length === 0 && <p className="text-xs text-stone text-center py-2">Không có danh mục</p>}
                  </div>
                ) : (
                  <div>
                    <input type="text" value={prodSearch} onChange={e => setProdSearch(e.target.value)}
                      placeholder="Tìm sản phẩm..." className="w-full border rounded-lg px-3 py-1.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-gold" />
                    <div className="max-h-32 overflow-y-auto border rounded-lg p-2 space-y-1">
                      {products.map(sp => (
                        <label key={sp.maSanPham} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-ivory-100 px-2 py-1 rounded">
                          <input type="checkbox" checked={form.maSanPhamIds.includes(sp.maSanPham)}
                            onChange={() => toggleProduct(sp.maSanPham)} className="h-4 w-4" />
                          <span className="truncate">{sp.tenSanPham}</span>
                        </label>
                      ))}
                      {products.length === 0 && <p className="text-xs text-stone text-center py-2">Không tìm thấy sản phẩm</p>}
                    </div>
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input type="checkbox" checked={form.congKhai}
                  onChange={e => setForm({ ...form, congKhai: e.target.checked })} className="h-4 w-4" />
                Công khai — hiển thị cho người dùng
              </label>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-stone">Ngày bắt đầu</label>
                  <input type="date" value={form.ngayBatDau} onChange={e => setForm({ ...form, ngayBatDau: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-stone">Ngày kết thúc</label>
                  <input type="date" value={form.ngayKetThuc} onChange={e => setForm({ ...form, ngayKetThuc: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 mt-1" />
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="bg-gold text-noir px-6 py-2 rounded-lg font-semibold hover:bg-gold-hover">Tạo</button>
                <button type="button" onClick={() => setShowForm(false)} className="border px-6 py-2 rounded-lg font-semibold hover:bg-ivory-100">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditing(null)}>
          <div className="bg-ivory rounded-2xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Sửa mã giảm giá</h2>
              <button onClick={() => setEditing(null)} className="text-stone hover:text-stone">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault()
              const t = e.target
              if (t.ngayBatDau.value && t.ngayKetThuc.value && new Date(t.ngayBatDau.value) >= new Date(t.ngayKetThuc.value)) {
                alert('Ngày bắt đầu phải nhỏ hơn ngày kết thúc!'); return
              }
              const payload = {}
              const v = (name) => t[name]?.value
              const n = (name) => v(name) !== '' ? Number(v(name)) : null
              if (v('giaTriGiam') !== '') payload.giaTriGiam = n('giaTriGiam')
              if (v('giaTriDonToiThieu') !== '') payload.giaTriDonToiThieu = n('giaTriDonToiThieu')
              if (v('ngayBatDau')) payload.ngayBatDau = v('ngayBatDau') + 'T00:00:00'
              if (v('ngayKetThuc')) payload.ngayKetThuc = v('ngayKetThuc') + 'T23:59:59'
              if (v('soLuong') !== '') payload.soLuong = n('soLuong')
              if (v('giaTriGiamToiDa') !== '') payload.giaTriGiamToiDa = n('giaTriGiamToiDa')
              payload.congKhai = t.congKhai.checked
              setEditPayload(payload)
              setConfirmEdit(true)
            }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-stone">Mã code</label>
                  <input value={editing.maCode} disabled
                    className="w-full border rounded-lg px-4 py-2 mt-1 bg-ivory-100 text-stone text-sm" />
                </div>
                <div>
                  <label className="text-xs text-stone">Kiểu giảm</label>
                  <input value={editing.kieuGiamGia === 1 ? '%' : editing.kieuGiamGia === 2 ? 'Tiền mặt' : 'Freeship'} disabled
                    className="w-full border rounded-lg px-4 py-2 mt-1 bg-ivory-100 text-stone text-sm" />
                </div>
                <div>
                  <label className="text-xs text-stone">Giá trị giảm</label>
                  <input type="number" name="giaTriGiam" defaultValue={editing.giaTriGiam}
                    className="w-full border rounded-lg px-4 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>
                <div>
                  <label className="text-xs text-stone">Đơn tối thiểu</label>
                  <input type="number" name="giaTriDonToiThieu" defaultValue={editing.giaTriDonToiThieu || ''}
                    className="w-full border rounded-lg px-4 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>
                <div>
                  <label className="text-xs text-stone">Ngày bắt đầu</label>
                  <input type="date" name="ngayBatDau" defaultValue={editing.ngayBatDau ? editing.ngayBatDau.slice(0, 10) : ''}
                    className="w-full border rounded-lg px-4 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>
                <div>
                  <label className="text-xs text-stone">Ngày kết thúc</label>
                  <input type="date" name="ngayKetThuc" defaultValue={editing.ngayKetThuc ? editing.ngayKetThuc.slice(0, 10) : ''}
                    className="w-full border rounded-lg px-4 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>
                <div>
                  <label className="text-xs text-stone">Số lượng</label>
                  <input type="number" name="soLuong" defaultValue={editing.soLuong ?? ''}
                    placeholder="Để trống = không giới hạn"
                    className="w-full border rounded-lg px-4 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>
                <div>
                  <label className="text-xs text-stone">Giảm tối đa</label>
                  <input type="number" name="giaTriGiamToiDa" defaultValue={editing.giaTriGiamToiDa || ''}
                    placeholder="Để trống = không giới hạn"
                    className="w-full border rounded-lg px-4 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-ink-soft mt-4">
                <input type="checkbox" name="congKhai" defaultChecked={editing.congKhai ?? true} className="h-4 w-4" />
                Công khai — hiển thị cho người dùng
              </label>

              <div className="flex gap-3 mt-6">
                <button type="submit" className="bg-gold text-noir px-6 py-2 rounded-lg font-semibold hover:bg-gold-hover">Lưu</button>
                <button type="button" onClick={() => setEditing(null)} className="border px-6 py-2 rounded-lg font-semibold hover:bg-ivory-100">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grant modal */}
      {grantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setGrantModal(null); setUserResults([]); setUserSearch(''); setGrantMsg('') }}>
          <div className="bg-ivory rounded-2xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Cấp voucher</h3>
              <button onClick={() => { setGrantModal(null); setUserResults([]); setUserSearch(''); setGrantMsg('') }} className="text-stone hover:text-stone">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-stone mb-3">Mã: <span className="font-mono font-semibold text-gold">{grantModal.maCode}</span></p>
            <input type="text" value={userSearch} onChange={async e => {
              const q = e.target.value; setUserSearch(q)
              if (q.trim().length < 2) { setUserResults([]); return }
              setSearchingUser(true)
              try {
                const res = await searchCustomers(q.trim())
                setUserResults(Array.isArray(res) ? res : [])
              } catch { setUserResults([]) } finally { setSearchingUser(false) }
            }} placeholder="Tìm người dùng (tên, email)..."
              className="w-full border rounded-lg px-4 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gold" />
            {searchingUser && <p className="text-xs text-stone mb-2">Đang tìm...</p>}
            {userResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto border rounded-lg mb-3 divide-y">
                {userResults.map(u => (
                  <div key={u.maNguoiDung} className="flex items-center justify-between px-3 py-2.5 hover:bg-ivory-100">
                    <div>
                      <p className="text-sm font-medium">{u.hoTen}</p>
                      <p className="text-xs text-stone">{u.email}</p>
                    </div>
                    <button disabled={granting} onClick={() => setConfirmGrant(u)} className="shrink-0 bg-royal text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-royal transition disabled:opacity-50">
                      Cấp
                    </button>
                  </div>
                ))}
              </div>
            )}
            {userResults.length === 0 && userSearch.trim().length >= 2 && !searchingUser && (
              <p className="text-xs text-stone mb-3">Không tìm thấy người dùng</p>
            )}
            {grantMsg && (
              <p className={`text-sm ${grantMsg.type === 'success' ? 'text-emerald-deep' : 'text-bordeaux'}`}>{grantMsg.text}</p>
            )}
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={confirmDelete !== null}
        title="Xác nhận"
        message="Xóa mã giảm giá này?"
        confirmText="Xóa"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
      <ConfirmDialog
        open={confirmToggle !== null}
        title="Đổi trạng thái mã giảm giá"
        message="Bạn có chắc muốn đổi trạng thái của mã giảm giá này?"
        confirmText="Xác nhận"
        variant="gold"
        onConfirm={() => handleToggleStatus(confirmToggle)}
        onCancel={() => setConfirmToggle(null)}
      />
      <ConfirmDialog
        open={confirmSave}
        title="Tạo mã giảm giá"
        message={`Bạn chắc chắn muốn tạo mã "${form.maCode?.trim() || '(tự gen)'}"?`}
        confirmText="Tạo"
        variant="gold"
        onConfirm={handleSubmit}
        onCancel={() => setConfirmSave(false)}
      />
      <ConfirmDialog
        open={confirmEdit}
        title="Cập nhật mã giảm giá"
        message={`Bạn chắc chắn muốn lưu thay đổi cho mã "${editing?.maCode}"?`}
        confirmText="Lưu"
        variant="gold"
        onConfirm={doEdit}
        onCancel={() => setConfirmEdit(false)}
      />
      <ConfirmDialog
        open={confirmGrant !== null}
        title="Cấp voucher"
        message={`Cấp voucher "${grantModal?.maCode}" cho ${confirmGrant?.hoTen || confirmGrant?.email}?`}
        confirmText="Cấp"
        variant="gold"
        onConfirm={() => doGrant(confirmGrant)}
        onCancel={() => setConfirmGrant(null)}
      />
    </div>
  )
}

function VND(n) {
  try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n }
}
