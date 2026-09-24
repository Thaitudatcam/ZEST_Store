import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCoupon, searchCustomers, getCustomers } from '../../api/admin'
import { grantVoucher } from '../../api/userVoucher'
import { ArrowLeft, Search } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function AdminVoucherCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    tenPhieuGiamGia: '',
    kieuApDung: 'tat-ca',
    loaiUuUai: 1,
    giaTriGiam: '',
    giaTriGiamToiDa: '',
    dieuKienDonToiThieu: '',
    soLuong: '',
    ngayBatDau: '',
    ngayKetThuc: '',
  })
  const [selectedUsers, setSelectedUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [userResults, setUserResults] = useState([])
  const [searchingUser, setSearchingUser] = useState(false)
  const [allCustomers, setAllCustomers] = useState([])
  const [allCustomersLoaded, setAllCustomersLoaded] = useState(false)
  const [confirmSave, setConfirmSave] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [userPage, setUserPage] = useState(0)
  const USER_PAGE_SIZE = 5

  const searchTimerRef = useState({ current: null })[0]

  const handleUserSearch = useCallback(async (q) => {
    if (q.trim().length < 2) { setUserResults([]); return }
    setSearchingUser(true)
    try {
      const res = await searchCustomers(q.trim())
      setUserResults(Array.isArray(res) ? res : [])
    } catch { setUserResults([]) }
    finally { setSearchingUser(false) }
  }, [])

  useEffect(() => {
    if (form.kieuApDung === 'ca-nhan' && !allCustomersLoaded) {
      getCustomers().then(res => {
        setAllCustomers(Array.isArray(res) ? res : [])
        setAllCustomersLoaded(true)
      }).catch(() => { setAllCustomersLoaded(true) })
    }
    if (form.kieuApDung !== 'ca-nhan') {
      setAllCustomersLoaded(false)
    }
  }, [form.kieuApDung, allCustomersLoaded])

  useEffect(() => {
    setUserPage(0)
  }, [userSearch])

  useEffect(() => {
    const timer = searchTimerRef
    if (timer) clearTimeout(timer)
    searchTimerRef.current = setTimeout(() => handleUserSearch(userSearch), 300)
    return () => clearTimeout(searchTimerRef.current)
  }, [userSearch, handleUserSearch])

  const toggleUser = (user) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => u.maNguoiDung === user.maNguoiDung)
      if (exists) return prev.filter(u => u.maNguoiDung !== user.maNguoiDung)
      return [...prev, user]
    })
  }

  const removeUser = (id) => setSelectedUsers(prev => prev.filter(u => u.maNguoiDung !== id))

  const validate = () => {
    if (!form.tenPhieuGiamGia.trim()) { alert('Vui lòng nhập tên phiếu giảm giá!'); return false }
    if (!form.giaTriGiam || Number(form.giaTriGiam) <= 0) { alert('Giá trị giảm phải lớn hơn 0!'); return false }
    if (form.loaiUuUai === 1 && Number(form.giaTriGiam) > 100) { alert('Phần trăm giảm không được vượt quá 100%!'); return false }
    if (!form.ngayBatDau) { alert('Vui lòng chọn ngày bắt đầu!'); return false }
    if (!form.ngayKetThuc) { alert('Vui lòng chọn ngày kết thúc!'); return false }
    if (new Date(form.ngayBatDau) >= new Date(form.ngayKetThuc)) { alert('Ngày bắt đầu phải nhỏ hơn ngày kết thúc!'); return false }
    if (form.soLuong && Number(form.soLuong) <= 0) { alert('Số lượt mỗi khách hàng phải lớn hơn 0!'); return false }
    if (form.giaTriGiamToiDa && Number(form.giaTriGiamToiDa) <= 0) { alert('Giá trị giảm tối đa phải lớn hơn 0!'); return false }
    if (form.kieuApDung === 'ca-nhan' && selectedUsers.length === 0) { alert('Vui lòng chọn ít nhất 1 khách hàng!'); return false }
    return true
  }

  const handleSubmit = async () => {
    setConfirmSave(false)
    setSubmitting(true)
    try {
      const payload = {
        maCode: form.tenPhieuGiamGia.trim().toUpperCase(),
        kieuGiamGia: form.loaiUuUai,
        giaTriGiam: Number(form.giaTriGiam),
        giaTriDonToiThieu: form.dieuKienDonToiThieu ? Number(form.dieuKienDonToiThieu) : null,
        ngayBatDau: form.ngayBatDau + 'T00:00:00',
        ngayKetThuc: form.ngayKetThuc + 'T23:59:59',
        soLuong: form.soLuong ? Number(form.soLuong) : null,
        giaTriGiamToiDa: form.loaiUuUai === 1 && form.giaTriGiamToiDa ? Number(form.giaTriGiamToiDa) : null,
        congKhai: form.kieuApDung === 'tat-ca',
      }
      const result = await createCoupon(payload)

      if (form.kieuApDung === 'ca-nhan' && selectedUsers.length > 0) {
        const couponId = result?.maPhieuGiamGia || result?.id
        if (!couponId) throw new Error('Không nhận được mã phiếu giảm giá vừa tạo')
        const grants = await Promise.allSettled(selectedUsers.map(user =>
          grantVoucher(user.maNguoiDung, couponId)))
        const failedUsers = selectedUsers.filter((_, index) => grants[index].status === 'rejected')
        if (failedUsers.length) {
          const names = failedUsers.slice(0, 5).map(user => user.hoTen || user.email || `#${user.maNguoiDung}`).join(', ')
          alert(`Đã tạo mã nhưng chưa cấp được cho ${failedUsers.length} khách hàng: ${names}${failedUsers.length > 5 ? ', ...' : ''}. Vui lòng cấp lại trong trang quản lý mã.`)
          navigate('/admin/coupons')
          return
        }
      }
      navigate('/admin/coupons')
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi tạo phiếu giảm giá')
    } finally { setSubmitting(false) }
  }

  const isPercentDiscount = form.loaiUuUai === 1

  return (
    <div>
      <button onClick={() => navigate('/admin/coupons')} className="flex items-center gap-1.5 text-sm text-stone hover:text-ink mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </button>

      <div className="bg-white rounded-xl border border-stone/10 p-6 max-w-4xl">
        <h1 className="text-xl font-bold text-ink mb-6">THÊM PHIẾU GIẢM GIÁ</h1>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Tên phiếu giảm giá *</label>
            <input value={form.tenPhieuGiamGia} onChange={e => setForm({ ...form, tenPhieuGiamGia: e.target.value })}
              placeholder="Nhập tên phiếu giảm giá"
              className="w-full border border-stone/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Kiểu áp dụng *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="kieuApDung" value="tat-ca" checked={form.kieuApDung === 'tat-ca'}
                    onChange={e => setForm({ ...form, kieuApDung: e.target.value })}
                    className="h-4 w-4 text-[var(--primary-color)] focus:ring-[var(--primary-color)]" />
                  <span className="text-sm text-ink">Tất cả</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="kieuApDung" value="ca-nhan" checked={form.kieuApDung === 'ca-nhan'}
                    onChange={e => setForm({ ...form, kieuApDung: e.target.value })}
                    className="h-4 w-4 text-[var(--primary-color)] focus:ring-[var(--primary-color)]" />
                  <span className="text-sm text-ink">Cá nhân</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-2">Loại ưu đãi *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="loaiUuUai" value={1} checked={form.loaiUuUai === 1}
                    onChange={e => setForm({ ...form, loaiUuUai: 1, giaTriGiam: '' })}
                    className="h-4 w-4 text-[var(--primary-color)] focus:ring-[var(--primary-color)]" />
                  <span className="text-sm text-ink">Giảm %</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="loaiUuUai" value={2} checked={form.loaiUuUai === 2}
                    onChange={e => setForm({ ...form, loaiUuUai: 2, giaTriGiam: '' })}
                    className="h-4 w-4 text-[var(--primary-color)] focus:ring-[var(--primary-color)]" />
                  <span className="text-sm text-ink">Giảm tiền</span>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Giá trị giảm * {isPercentDiscount ? '(%)' : '(đ)'}</label>
              <input type="number" value={form.giaTriGiam} onChange={e => setForm({ ...form, giaTriGiam: e.target.value })}
                placeholder={isPercentDiscount ? 'Nhập giá trị giảm %' : 'Nhập giá trị giảm'}
                className="w-full border border-stone/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
            </div>
            {isPercentDiscount && (
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Giá trị giảm tối đa (đ)</label>
                <input type="number" value={form.giaTriGiamToiDa} onChange={e => setForm({ ...form, giaTriGiamToiDa: e.target.value })}
                  placeholder="Nhập giá trị giảm tối đa"
                  className="w-full border border-stone/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Điều kiện đơn hàng tối thiểu (đ)</label>
              <input type="number" value={form.dieuKienDonToiThieu} onChange={e => setForm({ ...form, dieuKienDonToiThieu: e.target.value })}
                placeholder="Nhập giá trị đơn hàng tối thiểu"
                className="w-full border border-stone/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Lượt sử dụng mỗi khách hàng</label>
              <input type="number" value={form.soLuong} onChange={e => setForm({ ...form, soLuong: e.target.value })}
                placeholder="Ví dụ: 30 lượt / khách hàng"
                className="w-full border border-stone/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
              <p className="mt-1 text-[11px] text-stone">Mỗi khách hàng được dùng tối đa số lượt này; mỗi đơn thành công giảm 1 lượt riêng của khách đó.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Ngày bắt đầu *</label>
              <input type="date" value={form.ngayBatDau} onChange={e => setForm({ ...form, ngayBatDau: e.target.value })}
                className="w-full border border-stone/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Ngày kết thúc *</label>
              <input type="date" value={form.ngayKetThuc} onChange={e => setForm({ ...form, ngayKetThuc: e.target.value })}
                className="w-full border border-stone/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
            </div>
          </div>
        </div>

        {form.kieuApDung === 'ca-nhan' && (
          <div className="mt-8 border-t border-stone/10 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-ink uppercase tracking-wide">DANH SÁCH KHÁCH HÀNG</h2>
              {selectedUsers.length > 0 && (
                <span className="bg-[var(--primary-color)] text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  Đã chọn: {selectedUsers.length}
                </span>
              )}
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
              <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                placeholder="Nhập tên hoặc email khách hàng"
                className="w-full pl-9 pr-4 py-2.5 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
            </div>

            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedUsers.map(u => (
                  <span key={u.maNguoiDung} className="inline-flex items-center gap-1.5 bg-[var(--primary-color)]/10 text-[var(--primary-color)] text-xs font-medium px-2.5 py-1 rounded-full">
                    {u.hoTen || u.email}
                    <button onClick={() => removeUser(u.maNguoiDung)} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}

            {searchingUser && <p className="text-xs text-stone mb-2">Đang tìm...</p>}

            {(userSearch.trim().length >= 2 && userResults.length > 0) || (userSearch.trim().length < 2 && allCustomers.length > 0) && (() => {
              const list = userSearch.trim().length >= 2 ? userResults : allCustomers
              const totalPages = Math.ceil(list.length / USER_PAGE_SIZE)
              const paged = list.slice(userPage * USER_PAGE_SIZE, (userPage + 1) * USER_PAGE_SIZE)
              return (
              <>
              <div className="border border-stone/10 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-stone/10">
                    <tr>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-stone w-10"></th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-stone w-10">STT</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-stone">TÊN</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-stone">EMAIL</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-stone">NGÀY SINH</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-stone">TỔNG ĐƠN</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-stone">TỔNG CHI TIÊU</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-stone">LẦN MUA GẦN NHẤT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone/10">
                    {paged.map((u, idx) => {
                      const isSelected = selectedUsers.some(s => s.maNguoiDung === u.maNguoiDung)
                      return (
                        <tr key={u.maNguoiDung}
                          className={`cursor-pointer transition-colors ${isSelected ? 'bg-[var(--primary-color)]/5' : 'hover:bg-gray-50'}`}
                          onClick={() => toggleUser(u)}>
                          <td className="px-3 py-2.5 text-center">
                            <input type="checkbox" checked={isSelected} onChange={() => toggleUser(u)} className="h-4 w-4" />
                          </td>
                          <td className="px-3 py-2.5 text-center text-xs text-stone">{userPage * USER_PAGE_SIZE + idx + 1}</td>
                          <td className="px-3 py-2.5 text-xs font-medium text-ink">{u.hoTen || '—'}</td>
                          <td className="px-3 py-2.5 text-xs text-stone">{u.email || '—'}</td>
                          <td className="px-3 py-2.5 text-center text-xs text-stone">{u.ngaySinh ? new Date(u.ngaySinh).toLocaleDateString('vi-VN') : '—'}</td>
                          <td className="px-3 py-2.5 text-center text-xs text-stone">{u.tongDonHang ?? 0}</td>
                          <td className="px-3 py-2.5 text-center text-xs text-stone">{u.tongChiTieu ? new Intl.NumberFormat('vi-VN').format(u.tongChiTieu) : '0'}</td>
                          <td className="px-3 py-2.5 text-center text-xs text-stone">{u.lanMuaGanNhat ? new Date(u.lanMuaGanNhat).toLocaleDateString('vi-VN') : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <button disabled={userPage === 0} onClick={() => setUserPage(userPage - 1)}
                    className="px-3 py-1.5 text-xs border border-stone/20 rounded-lg hover:bg-gray-50 disabled:opacity-40">Trước</button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i} onClick={() => setUserPage(i)}
                      className={`px-3 py-1.5 text-xs rounded-lg border ${i === userPage ? 'bg-[var(--primary-color)] text-white border-[var(--primary-color)]' : 'border-stone/20 hover:bg-gray-50'}`}>{i + 1}</button>
                  ))}
                  <button disabled={userPage >= totalPages - 1} onClick={() => setUserPage(userPage + 1)}
                    className="px-3 py-1.5 text-xs border border-stone/20 rounded-lg hover:bg-gray-50 disabled:opacity-40">Sau</button>
                </div>
              )}
              <p className="text-[10px] text-stone text-right mt-1">Hiển thị {userPage * USER_PAGE_SIZE + 1}–{Math.min((userPage + 1) * USER_PAGE_SIZE, list.length)} / {list.length} khách hàng</p>
              </>
              )
            })()}

            {userResults.length === 0 && allCustomers.length === 0 && userSearch.trim().length >= 2 && !searchingUser && (
              <p className="text-xs text-stone text-center py-4">Không tìm thấy khách hàng</p>
            )}
          </div>
        )}

        <div className="flex gap-3 mt-8 pt-6 border-t border-stone/10">
          <button onClick={() => navigate('/admin/coupons')}
            className="border border-stone/20 px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors">Hủy</button>
          <button onClick={() => { if (validate()) setConfirmSave(true) }} disabled={submitting}
            className="bg-[var(--primary-color)] text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity">Lưu</button>
        </div>
      </div>

      <ConfirmDialog open={confirmSave} title="Tạo phiếu giảm giá"
        message={`Bạn chắc chắn muốn tạo phiếu giảm giá "${form.tenPhieuGiamGia}"?`}
        confirmText="Tạo" variant="gold" onConfirm={handleSubmit} onCancel={() => setConfirmSave(false)} />
    </div>
  )
}
