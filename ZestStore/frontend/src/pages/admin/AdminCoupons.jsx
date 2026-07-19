import { useState, useEffect } from 'react'
import { getCoupons, createCoupon, deleteCoupon, filterCoupons, toggleCouponStatus, searchCustomers } from '../../api/admin'
import { getCategories } from '../../api/categories'
import { getProducts } from '../../api/products'
import { grantVoucher } from '../../api/userVoucher'
import { Plus, Trash2, Filter, X, Tag, Package, Layers, Gift } from 'lucide-react'

const PAGE_SIZE = 15

const STA_LABELS = { 0: 'Đã huỷ', 1: 'Chưa BĐ', 2: 'Đang HĐ', 3: 'Hết lượt', 4: 'Hết hạn', 5: 'Đã xoá' }
const STA_COLORS = { 0: 'bg-red-100 text-red-700', 1: 'bg-yellow-100 text-yellow-700', 2: 'bg-emerald-100 text-emerald-700', 3: 'bg-orange-100 text-orange-700', 4: 'bg-gray-100 text-gray-500', 5: 'bg-gray-100 text-gray-400' }

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
  const [form, setForm] = useState({
    maCode: '', kieuGiamGia: 1, giaTriGiam: '', giaTriDonToiThieu: '',
    ngayBatDau: '', ngayKetThuc: '', soLuong: '', giaTriGiamToiDa: '',
    maDanhMucIds: [], maSanPhamIds: [], congKhai: true,
  })

  useEffect(() => { getCategories().then(setCategories).catch(() => {}) }, [])
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
    if (!form.maCode.trim()) { alert('Vui lòng nhập mã code!'); return false }
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const payload = {
      maCode: form.maCode,
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
    try {
      await createCoupon(payload)
      setShowForm(false)
      setForm({ maCode: '', kieuGiamGia: 1, giaTriGiam: '', giaTriDonToiThieu: '', ngayBatDau: '', ngayKetThuc: '', soLuong: '', giaTriGiamToiDa: '', maDanhMucIds: [], maSanPhamIds: [], congKhai: true })
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi tạo coupon')
    }
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
    try {
      await toggleCouponStatus(id)
      load(filter)
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi thay đổi trạng thái')
    }
  }

  useEffect(() => { setPage(0) }, [coupons.length])
  const totalPages = Math.ceil(coupons.length / PAGE_SIZE)
  const paged = coupons.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—')

  const StaBadge = ({ c }) => {
    const st = c.trangThaiThucTe ?? c.trangThai
    const label = STA_LABELS[st] ?? 'Không xác định'
    const color = STA_COLORS[st] ?? 'bg-gray-100 text-gray-500'
    return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${color}`}>{label}</span>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mã giảm giá</h1>
        <button onClick={() => { if (coupons.length >= 70) { alert('Đã đạt giới hạn 70 mã giảm giá'); return }; setShowForm(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Thêm mã
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl shadow-sm border p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="font-semibold text-sm text-gray-700">Bộ lọc</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-gray-500">Ngày bắt đầu</label>
            <input type="date" value={filter.ngayBatDau} onChange={e => setFilter({ ...filter, ngayBatDau: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Ngày kết thúc</label>
            <input type="date" value={filter.ngayKetThuc} onChange={e => setFilter({ ...filter, ngayKetThuc: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Kiểu giảm</label>
            <select value={filter.kieuGiamGia} onChange={e => setFilter({ ...filter, kieuGiamGia: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tất cả</option>
              <option value="1">Giảm theo %</option>
              <option value="2">Giảm tiền mặt</option>
              <option value="3">Freeship</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Giá trị giảm</label>
            <input type="number" value={filter.giaTriGiam} onChange={e => setFilter({ ...filter, giaTriGiam: e.target.value })}
              placeholder="Nhập giá trị..."
              className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={handleFilter} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
            <Filter className="h-4 w-4" /> Lọc
          </button>
          {hasFilter && (
            <button onClick={handleResetFilter} className="border px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 flex items-center gap-2 text-gray-600">
              <X className="h-4 w-4" /> Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-3 py-3 font-semibold text-gray-600">Mã</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600">Giảm</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600">SL</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600">Giảm tối đa</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600">Áp dụng cho</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600">Ngày BĐ</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600">Ngày KT</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600">Trạng thái</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.map((c) => (
                <tr key={c.maPhieuGiamGia}
                  className={`hover:bg-gray-50 ${c.kieuGiamGia === 3 ? 'bg-green-50/40' : [0, 4, 5].includes(c.trangThaiThucTe ?? c.trangThai) ? 'bg-red-50' : ''}`}>
                  <td className={`px-3 py-3 font-mono font-semibold ${c.kieuGiamGia === 3 ? 'text-green-700' : 'text-blue-700'}`}>
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
                        <span className="inline-flex items-center gap-0.5 text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full">
                          <Package className="h-2.5 w-2.5" />{c.sanPhamApDung.length} SP
                        </span>
                      )}
                      {(!c.danhMucApDung || c.danhMucApDung.length === 0) && (!c.sanPhamApDung || c.sanPhamApDung.length === 0) && (
                        <span className="text-[10px] text-gray-400">Tất cả</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-gray-500 text-xs">{fmtDate(c.ngayBatDau)}</td>
                  <td className="px-3 py-3 text-center text-gray-500 text-xs">{fmtDate(c.ngayKetThuc)}</td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <StaBadge c={c} />
                      <button type="button" onClick={() => handleToggleStatus(c.maPhieuGiamGia)}
                        disabled={c.ngayKetThuc && new Date(c.ngayKetThuc) < new Date()}
                        className={`relative inline-flex h-4 w-8 items-center rounded-full transition ${c.trangThai === 1 ? 'bg-emerald-500' : 'bg-gray-300'} ${c.ngayKetThuc && new Date(c.ngayKetThuc) < new Date() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${c.trangThai === 1 ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setGrantModal(c)} title="Cấp voucher cho người dùng"
                        className="p-1 text-purple-600 hover:bg-purple-50 rounded">
                        <Gift className="h-4 w-4" />
                      </button>
                      <button onClick={() => setConfirmDelete(c.maPhieuGiamGia)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {coupons.length === 0 && <p className="text-center text-gray-500 py-8">Chưa có mã giảm giá</p>}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t">
            <button disabled={page === 0} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-100 disabled:opacity-40">Trước</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)} className={`px-3 py-1.5 text-xs rounded-lg border ${i === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'}`}>{i + 1}</button>
            ))}
            <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-100 disabled:opacity-40">Sau</button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Thêm mã giảm giá</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input value={form.maCode} onChange={e => setForm({ ...form, maCode: e.target.value.toUpperCase() })}
                placeholder="Mã code" required
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />

              {/* Type selector */}
              <div className="flex gap-2">
                <button type="button" onClick={() => setForm({ ...form, kieuGiamGia: 1, giaTriGiam: '' })}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition ${form.kieuGiamGia !== 3 ? 'border-blue-700 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-blue-300'}`}>
                  <span className="block text-base">Giảm sản phẩm</span>
                  <span className="block text-[10px] font-normal mt-0.5 opacity-70">Trừ vào tiền sản phẩm</span>
                </button>
                <button type="button" onClick={() => setForm({ ...form, kieuGiamGia: 3, giaTriGiam: '0' })}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition ${form.kieuGiamGia === 3 ? 'border-green-700 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-green-300'}`}>
                  <span className="block text-base">Freeship</span>
                  <span className="block text-[10px] font-normal mt-0.5 opacity-70">Trừ vào phí vận chuyển</span>
                </button>
              </div>

              {/* Discount value */}
              {form.kieuGiamGia === 3 ? (
                <div>
                  <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2 mb-3">
                    Mã freeship sẽ giảm trực tiếp vào <strong>phí vận chuyển</strong>.
                  </p>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giảm tối đa cho phí vận chuyển</label>
                  <input type="number" value={form.giaTriGiam === '0' ? '' : form.giaTriGiam}
                    onChange={e => setForm({ ...form, giaTriGiam: e.target.value })}
                    placeholder="Nhập số tiền giảm tối đa (₫)"
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={form.giaTriGiam === '0'} />
                  <label className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                    <input type="checkbox" checked={form.giaTriGiam === '0'}
                      onChange={e => setForm({ ...form, giaTriGiam: e.target.checked ? '0' : '' })} className="h-4 w-4" />
                    Miễn phí vận chuyển hoàn toàn
                  </label>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2 mb-3">
                    <button type="button" onClick={() => setForm({ ...form, kieuGiamGia: 1, giaTriGiam: '' })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition ${form.kieuGiamGia === 1 ? 'border-blue-700 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
                      % Theo phần trăm
                    </button>
                    <button type="button" onClick={() => setForm({ ...form, kieuGiamGia: 2, giaTriGiam: '' })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition ${form.kieuGiamGia === 2 ? 'border-blue-700 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
                      ₫ Giảm tiền mặt
                    </button>
                  </div>
                  <input type="number" value={form.giaTriGiam}
                    onChange={e => setForm({ ...form, giaTriGiam: e.target.value })}
                    placeholder={form.kieuGiamGia === 1 ? 'Phần trăm giảm (vd: 10)' : 'Số tiền giảm'} required
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}

              <input type="number" value={form.giaTriDonToiThieu} onChange={e => setForm({ ...form, giaTriDonToiThieu: e.target.value })}
                placeholder="Giá trị đơn tối thiểu" className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="number" value={form.soLuong} onChange={e => setForm({ ...form, soLuong: e.target.value })}
                placeholder="Số lượng mã (để trống = không giới hạn)" className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />

              {form.kieuGiamGia === 1 && (
                <input type="number" value={form.giaTriGiamToiDa} onChange={e => setForm({ ...form, giaTriGiamToiDa: e.target.value })}
                  placeholder="Giá trị giảm tối đa (để trống = không giới hạn)" className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              )}

              {/* Category/Product selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Giới hạn áp dụng (không chọn = áp dụng cho tất cả)</label>
                <div className="flex gap-1 mb-2">
                  <button type="button" onClick={() => setCatTab('categories')}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium border transition ${catTab === 'categories' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
                    <Layers className="h-3 w-3 inline mr-1" />Danh mục
                  </button>
                  <button type="button" onClick={() => setCatTab('products')}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium border transition ${catTab === 'products' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
                    <Package className="h-3 w-3 inline mr-1" />Sản phẩm
                  </button>
                </div>
                {catTab === 'categories' ? (
                  <div className="max-h-32 overflow-y-auto border rounded-lg p-2 space-y-1">
                    {categories.map(dm => (
                      <label key={dm.maDanhMuc} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                        <input type="checkbox" checked={form.maDanhMucIds.includes(dm.maDanhMuc)}
                          onChange={() => toggleCategory(dm.maDanhMuc)} className="h-4 w-4" />
                        {dm.tenDanhMuc}
                      </label>
                    ))}
                    {categories.length === 0 && <p className="text-xs text-gray-400 text-center py-2">Không có danh mục</p>}
                  </div>
                ) : (
                  <div>
                    <input type="text" value={prodSearch} onChange={e => setProdSearch(e.target.value)}
                      placeholder="Tìm sản phẩm..." className="w-full border rounded-lg px-3 py-1.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <div className="max-h-32 overflow-y-auto border rounded-lg p-2 space-y-1">
                      {products.map(sp => (
                        <label key={sp.maSanPham} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                          <input type="checkbox" checked={form.maSanPhamIds.includes(sp.maSanPham)}
                            onChange={() => toggleProduct(sp.maSanPham)} className="h-4 w-4" />
                          <span className="truncate">{sp.tenSanPham}</span>
                        </label>
                      ))}
                      {products.length === 0 && <p className="text-xs text-gray-400 text-center py-2">Không tìm thấy sản phẩm</p>}
                    </div>
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.congKhai}
                  onChange={e => setForm({ ...form, congKhai: e.target.checked })} className="h-4 w-4" />
                Công khai — hiển thị cho người dùng
              </label>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Ngày bắt đầu</label>
                  <input type="date" value={form.ngayBatDau} onChange={e => setForm({ ...form, ngayBatDau: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Ngày kết thúc</label>
                  <input type="date" value={form.ngayKetThuc} onChange={e => setForm({ ...form, ngayKetThuc: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 mt-1" />
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">Tạo</button>
                <button type="button" onClick={() => setShowForm(false)} className="border px-6 py-2 rounded-lg font-semibold hover:bg-gray-50">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grant modal */}
      {grantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setGrantModal(null); setUserResults([]); setUserSearch(''); setGrantMsg('') }}>
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Cấp voucher</h3>
              <button onClick={() => { setGrantModal(null); setUserResults([]); setUserSearch(''); setGrantMsg('') }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">Mã: <span className="font-mono font-semibold text-blue-700">{grantModal.maCode}</span></p>
            <input type="text" value={userSearch} onChange={async e => {
              const q = e.target.value; setUserSearch(q)
              if (q.trim().length < 2) { setUserResults([]); return }
              setSearchingUser(true)
              try {
                const res = await searchCustomers(q.trim())
                setUserResults(Array.isArray(res) ? res : [])
              } catch { setUserResults([]) } finally { setSearchingUser(false) }
            }} placeholder="Tìm người dùng (tên, email)..."
              className="w-full border rounded-lg px-4 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {searchingUser && <p className="text-xs text-gray-400 mb-2">Đang tìm...</p>}
            {userResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto border rounded-lg mb-3 divide-y">
                {userResults.map(u => (
                  <div key={u.maNguoiDung} className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium">{u.hoTen}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                    <button disabled={granting} onClick={async () => {
                      setGranting(true); setGrantMsg('')
                      try {
                        const res = await grantVoucher(u.maNguoiDung, grantModal.maPhieuGiamGia)
                        setGrantMsg({ type: 'success', text: res.message || 'Đã cấp thành công!' })
                        setUserResults([]); setUserSearch('')
                        load()
                      } catch (err) {
                        setGrantMsg({ type: 'error', text: err.response?.data?.message || 'Lỗi cấp voucher' })
                      } finally { setGranting(false) }
                    }} className="shrink-0 bg-purple-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-purple-700 transition disabled:opacity-50">
                      Cấp
                    </button>
                  </div>
                ))}
              </div>
            )}
            {userResults.length === 0 && userSearch.trim().length >= 2 && !searchingUser && (
              <p className="text-xs text-gray-400 mb-3">Không tìm thấy người dùng</p>
            )}
            {grantMsg && (
              <p className={`text-sm ${grantMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{grantMsg.text}</p>
            )}
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Xác nhận</h3>
            <p className="text-sm text-gray-600 mb-4">Xóa mã giảm giá này?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-gray-50">Hủy</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function VND(n) {
  try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n }
}
