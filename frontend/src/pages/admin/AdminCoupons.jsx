import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCoupons, createCoupon, deleteCoupon, filterCoupons, toggleCouponStatus, searchCustomers, updateCoupon, getCouponUsers, revokeCouponUser } from '../../api/admin'
import { grantVoucher } from '../../api/userVoucher'
import { Plus, RefreshCw, X, PenSquare, Search } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'

const PAGE_SIZE = 15
const STA_LABELS = { 0: 'Đã huỷ', 1: 'Chưa bắt đầu', 2: 'Đang diễn ra', 3: 'Hết lượt', 4: 'Đã hết hạn', 5: 'Đã xoá' }
const STA_COLORS = { 0: 'bg-red-50 text-red-600 border-red-200', 1: 'bg-yellow-50 text-yellow-600 border-yellow-200', 2: 'bg-green-50 text-green-600 border-green-200', 3: 'bg-orange-50 text-orange-600 border-orange-200', 4: 'bg-gray-50 text-gray-500 border-gray-200', 5: 'bg-gray-50 text-gray-500 border-gray-200' }

export default function AdminCoupons() {
  const navigate = useNavigate()
  const [coupons, setCoupons] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState({ kieuApDung: '', loaiGiam: '', ngayBatDau: '', ngayKetThuc: '', trangThai: '' })
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmToggle, setConfirmToggle] = useState(null)
  const [confirmSave, setConfirmSave] = useState(false)
  const [confirmEdit, setConfirmEdit] = useState(false)
  const [editPayload, setEditPayload] = useState(null)
  const [grantModal, setGrantModal] = useState(null)
  const [confirmGrant, setConfirmGrant] = useState(null)
  const [granting, setGranting] = useState(false)
  const [grantMsg, setGrantMsg] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [userResults, setUserResults] = useState([])
  const [searchingUser, setSearchingUser] = useState(false)
  const [showEditName, setShowEditName] = useState(false)
  const [editName, setEditName] = useState('')

  // Edit modal states
  const [editUsers, setEditUsers] = useState([])
  const [editUserSearch, setEditUserSearch] = useState('')
  const [editUserResults, setEditUserResults] = useState([])
  const [searchingEditUser, setSearchingEditUser] = useState(false)
  const [confirmRevokeUser, setConfirmRevokeUser] = useState(null)

  const load = (filterParams = {}) => {
    const hasFilter = Object.values(filterParams).some(v => v !== '')
    if (hasFilter) {
      const params = new URLSearchParams()
      if (filterParams.ngayBatDau) params.append('ngayBatDau', filterParams.ngayBatDau + 'T00:00:00')
      if (filterParams.ngayKetThuc) params.append('ngayKetThuc', filterParams.ngayKetThuc + 'T23:59:59')
      if (filterParams.loaiGiam) params.append('kieuGiamGia', filterParams.loaiGiam)
      filterCoupons(params.toString()).then(setCoupons).catch(() => {})
    } else {
      getCoupons().then(setCoupons).catch(() => {})
    }
  }

  useEffect(() => { load() }, [])

  const filteredCoupons = coupons.filter(c => {
    if (search) {
      const q = search.toLowerCase()
      if (!c.maCode?.toLowerCase().includes(q) && !(`PGG${String(c.maPhieuGiamGia).padStart(2, '0')}`).toLowerCase().includes(q)) return false
    }
    if (filter.kieuApDung === 'ca-nhan' && c.congKhai !== false) return false
    if (filter.kieuApDung === 'toan-cua-hang' && c.congKhai !== true) return false
    if (filter.loaiGiam && String(c.kieuGiamGia) !== filter.loaiGiam) return false
    if (filter.trangThai) {
      const st = String(c.trangThaiThucTe ?? c.trangThai)
      if (st !== filter.trangThai) return false
    }
    return true
  })

  useEffect(() => { setPage(0) }, [search, filter])
  const totalPages = Math.ceil(filteredCoupons.length / PAGE_SIZE)
  const paged = filteredCoupons.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—'
  const fmtPGG = (id) => `PGG${String(id).padStart(2, '0')}`

  const handleDelete = async () => {
    if (!confirmDelete) return
    try { await deleteCoupon(confirmDelete); setConfirmDelete(null); load() }
    catch (err) { alert(err.response?.data?.message || 'Lỗi xóa') }
  }

  const handleToggleStatus = async (id) => {
    setConfirmToggle(null)
    try { await toggleCouponStatus(id); load(filter) }
    catch (err) { alert(err.response?.data?.message || 'Lỗi') }
  }

  const doGrant = async (user) => {
    setConfirmGrant(null)
    setGranting(true); setGrantMsg('')
    try {
      const res = await grantVoucher(user.maNguoiDung, grantModal.maPhieuGiamGia)
      setGrantMsg({ type: 'success', text: res.message || 'Đã cấp thành công!' })
      setUserResults([]); setUserSearch(''); load()
    } catch (err) {
      setGrantMsg({ type: 'error', text: err.response?.data?.message || 'Lỗi cấp voucher' })
    } finally { setGranting(false) }
  }

  const doEdit = async () => {
    setConfirmEdit(false)
    try { await updateCoupon(editing.maPhieuGiamGia, editPayload); setEditing(null); load() }
    catch (err) { alert(err.response?.data?.message || 'Lỗi sửa') }
  }

  const loadEditUsers = useCallback(async (couponId) => {
    try {
      const users = await getCouponUsers(couponId)
      setEditUsers(Array.isArray(users) ? users : [])
    } catch { setEditUsers([]) }
  }, [])

  const doRevokeUser = async () => {
    if (!confirmRevokeUser) return
    try {
      await revokeCouponUser(editing.maPhieuGiamGia, confirmRevokeUser.maNguoiDung)
      setConfirmRevokeUser(null)
      loadEditUsers(editing.maPhieuGiamGia)
    } catch (err) { alert(err.response?.data?.message || 'Lỗi thu hồi') }
  }

  const handleEditUserSearch = useCallback(async (q) => {
    if (q.trim().length < 2) { setEditUserResults([]); return }
    setSearchingEditUser(true)
    try {
      const res = await searchCustomers(q.trim())
      setEditUserResults(Array.isArray(res) ? res : [])
    } catch { setEditUserResults([]) }
    finally { setSearchingEditUser(false) }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => handleEditUserSearch(editUserSearch), 300)
    return () => clearTimeout(timer)
  }, [editUserSearch, handleEditUserSearch])

  const handleGrantToEdit = async (user) => {
    try {
      await grantVoucher(user.maNguoiDung, editing.maPhieuGiamGia)
      loadEditUsers(editing.maPhieuGiamGia)
      setEditUserSearch(''); setEditUserResults([])
    } catch (err) { alert(err.response?.data?.message || 'Lỗi cấp voucher') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-ink">QUẢN LÝ PHIẾU GIẢM GIÁ</h1>
        <button onClick={() => navigate('/admin/coupons/create')}
          className="bg-[var(--primary-color)] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Thêm phiếu giảm giá
        </button>
      </div>

      <div className="bg-white rounded-xl border border-stone/10 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo mã hoặc tên PGG"
              className="w-full pl-9 pr-4 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
          </div>
          <button onClick={() => { load(); setSearch(''); setFilter({ kieuApDung: '', loaiGiam: '', ngayBatDau: '', ngayKetThuc: '', trangThai: '' }) }}
            className="p-2 border border-stone/20 rounded-lg hover:bg-gray-50 text-stone" title="Làm mới">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={filter.kieuApDung} onChange={e => setFilter({ ...filter, kieuApDung: e.target.value })}
            className="border border-stone/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]">
            <option value="">Kiểu áp dụng</option>
            <option value="toan-cua-hang">Toàn cửa hàng</option>
            <option value="ca-nhan">Cá nhân</option>
          </select>
          <select value={filter.loaiGiam} onChange={e => setFilter({ ...filter, loaiGiam: e.target.value })}
            className="border border-stone/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]">
            <option value="">Loại giảm</option>
            <option value="1">Giảm %</option>
            <option value="2">Giảm tiền</option>
          </select>
          <input type="date" value={filter.ngayBatDau} onChange={e => setFilter({ ...filter, ngayBatDau: e.target.value })}
            className="border border-stone/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
          <input type="date" value={filter.ngayKetThuc} onChange={e => setFilter({ ...filter, ngayKetThuc: e.target.value })}
            className="border border-stone/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
          <select value={filter.trangThai} onChange={e => setFilter({ ...filter, trangThai: e.target.value })}
            className="border border-stone/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]">
            <option value="">Trạng thái</option>
            <option value="1">Chưa bắt đầu</option>
            <option value="2">Đang diễn ra</option>
            <option value="3">Hết lượt</option>
            <option value="4">Đã hết hạn</option>
            <option value="0">Đã huỷ</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-stone/10">
              <tr>
                <th className="px-3 py-3 text-center text-xs font-semibold text-stone w-12">STT</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-stone w-20">MÃ</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-stone">TÊN</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-stone w-32">KIỂU ÁP DỤNG</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-stone">CHI TIẾT ƯU ĐÃI</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-stone w-36">THỜI GIAN ÁP DỤNG</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-stone w-20">SỐ LƯỢNG</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-stone w-32">TRẠNG THÁI</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-stone w-16">HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone/10">
              {paged.map((c, idx) => {
                const st = c.trangThaiThucTe ?? c.trangThai
                return (
                  <tr key={c.maPhieuGiamGia} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-center text-xs text-stone">{page * PAGE_SIZE + idx + 1}</td>
                    <td className="px-3 py-3 text-center text-xs font-semibold text-stone">{fmtPGG(c.maPhieuGiamGia)}</td>
                    <td className="px-3 py-3 text-xs font-medium text-ink max-w-[200px] truncate">{c.maCode}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold border ${c.congKhai ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                        {c.congKhai ? 'Toàn cửa hàng' : 'Cá nhân'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="text-xs">
                        <p className="font-semibold text-ink">{c.kieuGiamGia === 1 ? `Giảm ${c.giaTriGiam}%` : c.kieuGiamGia === 3 ? 'Freeship' : `Giảm ${VND(c.giaTriGiam)}`}</p>
                        {c.giaTriDonToiThieu > 0 && <p className="text-stone mt-0.5">Từ {VND(c.giaTriDonToiThieu)}</p>}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-xs text-stone">
                      <div>Từ: {fmtDate(c.ngayBatDau)}</div>
                      <div>Đến: {fmtDate(c.ngayKetThuc)}</div>
                    </td>
                    <td className="px-3 py-3 text-center text-xs text-stone">{c.soLuong ?? '∞'}</td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STA_COLORS[st] || STA_COLORS[5]}`}>
                          {STA_LABELS[st] || 'N/A'}
                        </span>
                        <button type="button" onClick={() => setConfirmToggle(c.maPhieuGiamGia)}
                          disabled={[0, 4, 5].includes(st)}
                          className={`relative inline-flex h-4 w-8 items-center rounded-full transition ${c.trangThai === 1 ? 'bg-[var(--primary-color)]' : 'bg-gray-300'} ${[0, 4, 5].includes(st) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition ${c.trangThai === 1 ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button onClick={() => { setEditing(c); if (c.congKhai === false) loadEditUsers(c.maPhieuGiamGia) }} title="Sửa mã giảm giá"
                        className="p-1.5 text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 rounded-lg transition">
                        <PenSquare className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filteredCoupons.length === 0 && <p className="text-center text-stone py-12 text-sm">Không có phiếu giảm giá nào</p>}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 p-4 border-t border-stone/10">
            <button disabled={page === 0} onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 text-xs border border-stone/20 rounded-lg hover:bg-gray-50 disabled:opacity-40">Trước</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)}
                className={`px-3 py-1.5 text-xs rounded-lg border ${i === page ? 'bg-[var(--primary-color)] text-white border-[var(--primary-color)]' : 'border-stone/20 hover:bg-gray-50'}`}>{i + 1}</button>
            ))}
            <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 text-xs border border-stone/20 rounded-lg hover:bg-gray-50 disabled:opacity-40">Sau</button>
          </div>
        )}
      </div>

      {editing && (() => {
        const isCaNhan = editing.congKhai === false
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setEditing(null); setEditUsers([]); setEditUserSearch(''); setEditUserResults([]) }}>
          <div className="bg-ivory rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-ivory z-10 flex items-center justify-between p-6 pb-0">
              <h2 className="text-lg font-bold text-ink">Sửa mã giảm giá</h2>
              <button onClick={() => { setEditing(null); setEditUsers([]); setEditUserSearch(''); setEditUserResults([]) }} className="text-stone hover:text-ink p-1"><X className="h-5 w-5" /></button>
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
              if (v('kieuGiamGia')) payload.kieuGiamGia = n('kieuGiamGia')
              payload.congKhai = editing.congKhai
              setEditPayload(payload); setConfirmEdit(true)
            }}>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Mã code</label>
                  <input value={editing.maCode} disabled
                    className="w-full border border-stone/20 rounded-lg px-4 py-2.5 bg-gray-50 text-stone text-sm cursor-not-allowed" />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Kiểu áp dụng</label>
                    <input value={editing.congKhai ? 'Tất cả' : 'Cá nhân'} disabled
                      className="w-full border border-stone/20 rounded-lg px-4 py-2.5 bg-gray-50 text-stone text-sm cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Loại ưu đãi</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="kieuGiamGia" value={1} defaultChecked={editing.kieuGiamGia === 1} className="h-4 w-4 text-[var(--primary-color)]" />
                        <span className="text-sm text-ink">Giảm %</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="kieuGiamGia" value={2} defaultChecked={editing.kieuGiamGia === 2} className="h-4 w-4 text-[var(--primary-color)]" />
                        <span className="text-sm text-ink">Giảm tiền</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Giá trị giảm {editing.kieuGiamGia === 1 ? '(%)' : '(đ)'}</label>
                    <input type="number" name="giaTriGiam" defaultValue={editing.giaTriGiam}
                      className="w-full border border-stone/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Đơn tối thiểu (đ)</label>
                    <input type="number" name="giaTriDonToiThieu" defaultValue={editing.giaTriDonToiThieu || ''} placeholder="Để trống = không giới hạn"
                      className="w-full border border-stone/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Ngày bắt đầu</label>
                    <input type="date" name="ngayBatDau" defaultValue={editing.ngayBatDau ? editing.ngayBatDau.slice(0, 10) : ''}
                      className="w-full border border-stone/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Ngày kết thúc</label>
                    <input type="date" name="ngayKetThuc" defaultValue={editing.ngayKetThuc ? editing.ngayKetThuc.slice(0, 10) : ''}
                      className="w-full border border-stone/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Số lượng</label>
                    <input type="number" name="soLuong" defaultValue={editing.soLuong ?? ''} placeholder="Để trống = không giới hạn"
                      className="w-full border border-stone/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Giảm tối đa (đ)</label>
                    <input type="number" name="giaTriGiamToiDa" defaultValue={editing.giaTriGiamToiDa || ''} placeholder="Để trống = không giới hạn"
                      className="w-full border border-stone/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
                  </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border border-stone/10">
                  <input type="checkbox" checked={editing.congKhai ?? true} disabled className="h-4 w-4 text-[var(--primary-color)] cursor-not-allowed" />
                  <span className="text-sm text-stone">{editing.congKhai ? 'Công khai — hiển thị cho tất cả người dùng' : 'Cá nhân — chỉ hiển thị cho khách hàng được chỉ định'}</span>
                </div>
              </div>

              {isCaNhan && (
                <div className="px-6 pb-6">
                  <div className="border-t border-stone/10 pt-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-ink uppercase tracking-wide">DANH SÁCH KHÁCH HÀNG</h3>
                      {editUsers.length > 0 && (
                        <span className="bg-[var(--primary-color)] text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                          {editUsers.length} khách hàng
                        </span>
                      )}
                    </div>

                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
                      <input value={editUserSearch} onChange={e => setEditUserSearch(e.target.value)}
                        placeholder="Nhập tên hoặc email khách hàng để thêm"
                        className="w-full pl-9 pr-4 py-2.5 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
                    </div>

                    {searchingEditUser && <p className="text-xs text-stone mb-2">Đang tìm...</p>}

                    {editUserResults.length > 0 && (
                      <div className="border border-stone/10 rounded-lg overflow-hidden mb-4 max-h-48 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b border-stone/10 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-stone">TÊN</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-stone">EMAIL</th>
                              <th className="px-3 py-2 text-center text-xs font-semibold text-stone w-20"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone/10">
                            {editUserResults.map(u => {
                              const isAssigned = editUsers.some(eu => eu.maNguoiDung === u.maNguoiDung)
                              return (
                                <tr key={u.maNguoiDung} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 text-xs font-medium text-ink">{u.hoTen || '—'}</td>
                                  <td className="px-3 py-2 text-xs text-stone">{u.email || '—'}</td>
                                  <td className="px-3 py-2 text-center">
                                    {isAssigned ? (
                                      <span className="text-xs text-green-600 font-medium">Đã thêm</span>
                                    ) : (
                                      <button type="button" onClick={() => handleGrantToEdit(u)}
                                        className="bg-[var(--primary-color)] text-white text-xs font-semibold px-3 py-1 rounded-full hover:opacity-90">Thêm</button>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {editUserResults.length === 0 && editUserSearch.trim().length >= 2 && !searchingEditUser && (
                      <p className="text-xs text-stone text-center py-3 mb-4">Không tìm thấy khách hàng</p>
                    )}

                    {editUsers.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {editUsers.map(u => (
                          <span key={u.maNguoiDung} className="inline-flex items-center gap-1.5 bg-[var(--primary-color)]/10 text-[var(--primary-color)] text-xs font-medium px-2.5 py-1 rounded-full">
                            {u.hoTen || u.email}
                            <button type="button" onClick={() => setConfirmRevokeUser(u)}
                              className="hover:text-red-500"><X className="h-3 w-3" /></button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-stone text-center py-3">Chưa có khách hàng nào được cấp voucher này</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 p-6 pt-0">
                <button type="submit"
                  className="bg-[var(--primary-color)] text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition">Lưu</button>
                <button type="button" onClick={() => { setEditing(null); setEditUsers([]); setEditUserSearch(''); setEditUserResults([]) }}
                  className="border border-stone/20 px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-50 transition">Hủy</button>
              </div>
            </form>
          </div>
        </div>
        )
      })()}

      {grantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setGrantModal(null); setUserResults([]); setUserSearch(''); setGrantMsg('') }}>
          <div className="bg-ivory rounded-2xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Cấp voucher</h3>
              <button onClick={() => { setGrantModal(null); setUserResults([]); setUserSearch(''); setGrantMsg('') }} className="text-stone hover:text-ink"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-stone mb-3">Mã: <span className="font-mono font-semibold text-[var(--primary-color)]">{grantModal.maCode}</span></p>
            <input type="text" value={userSearch} onChange={async e => {
              const q = e.target.value; setUserSearch(q)
              if (q.trim().length < 2) { setUserResults([]); return }
              setSearchingUser(true)
              try { const res = await searchCustomers(q.trim()); setUserResults(Array.isArray(res) ? res : []) }
              catch { setUserResults([]) } finally { setSearchingUser(false) }
            }} placeholder="Tìm người dùng (tên, email)..."
              className="w-full border border-stone/20 rounded-lg px-4 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
            {searchingUser && <p className="text-xs text-stone mb-2">Đang tìm...</p>}
            {userResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto border border-stone/10 rounded-lg mb-3 divide-y divide-stone/10">
                {userResults.map(u => (
                  <div key={u.maNguoiDung} className="flex items-center justify-between px-3 py-2.5 hover:bg-ivory-100">
                    <div>
                      <p className="text-sm font-medium">{u.hoTen}</p>
                      <p className="text-xs text-stone">{u.email}</p>
                    </div>
                    <button disabled={granting} onClick={() => setConfirmGrant(u)}
                      className="shrink-0 bg-[var(--primary-color)] text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:opacity-90 disabled:opacity-50">Cấp</button>
                  </div>
                ))}
              </div>
            )}
            {userResults.length === 0 && userSearch.trim().length >= 2 && !searchingUser && <p className="text-xs text-stone mb-3">Không tìm thấy người dùng</p>}
            {grantMsg && <p className={`text-sm ${grantMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{grantMsg.text}</p>}
          </div>
        </div>
      )}

      <ConfirmDialog open={confirmDelete !== null} title="Xác nhận" message="Xóa mã giảm giá này?" confirmText="Xóa" onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
      <ConfirmDialog open={confirmToggle !== null} title="Đổi trạng thái" message="Bạn có chắc muốn đổi trạng thái mã giảm giá này?" confirmText="Xác nhận" variant="gold" onConfirm={() => handleToggleStatus(confirmToggle)} onCancel={() => setConfirmToggle(null)} />
      <ConfirmDialog open={confirmEdit} title="Cập nhật mã giảm giá" message={`Lưu thay đổi cho mã "${editing?.maCode}"?`} confirmText="Lưu" variant="gold" onConfirm={doEdit} onCancel={() => setConfirmEdit(false)} />
      <ConfirmDialog open={confirmGrant !== null} title="Cấp voucher" message={`Cấp voucher "${grantModal?.maCode}" cho ${confirmGrant?.hoTen || confirmGrant?.email}?`} confirmText="Cấp" variant="gold" onConfirm={() => doGrant(confirmGrant)} onCancel={() => setConfirmGrant(null)} />
      <ConfirmDialog open={confirmRevokeUser !== null} title="Thu hồi voucher" message={`Thu hồi voucher "${editing?.maCode}" khỏi ${confirmRevokeUser?.hoTen || confirmRevokeUser?.email}?`} confirmText="Thu hồi" variant="gold" onConfirm={doRevokeUser} onCancel={() => setConfirmRevokeUser(null)} />
    </div>
  )
}

function VND(n) {
  try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n }
}
