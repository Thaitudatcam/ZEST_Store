import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { getProfile, updateProfile, changePassword as changePwd, getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, guiMaXacThucEmailMoi } from '../api/users'
import { guiMaXacThuc } from '../api/auth'
import LoadingSpinner from '../components/LoadingSpinner'
import { User, MapPin, Plus, Trash2, Star, Pencil, Eye, EyeOff, ShieldCheck, ShieldAlert } from 'lucide-react'
import { getProvinces, getDistricts, getWards } from '../api/ghn'
import ConfirmDialog from '../components/ConfirmDialog'

export default function Profile() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState(searchParams.get('tab') === 'password' ? 'password' : searchParams.get('tab') === 'addresses' ? 'addresses' : 'profile')
  const [profile, setProfile] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ hoTen: '', email: '', soDienThoai: '', gioiTinh: '', ngaySinh: '' })
  const [pwd, setPwd] = useState({ matKhauCu: '', matKhauMoi: '', xacNhanMatKhauMoi: '' })
  const [showPwd, setShowPwd] = useState({ cu: false, moi: false, xacNhan: false })
  const [pwdMsg, setPwdMsg] = useState('')
  const [addrForm, setAddrForm] = useState({ tenNguoiNhan: '', soDienThoai: '', tinhThanhPho: '', quanHuyen: '', phuongXa: '', provinceId: null, districtId: null, wardCode: '', chiTietDiaChi: '', laMacDinh: false })
  const [editAddr, setEditAddr] = useState(null)
  const [msg, setMsg] = useState('')
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [wards, setWards] = useState([])
  const [provinceId, setProvinceId] = useState(0)
  const [districtId, setDistrictId] = useState(0)
  const [wardCode, setWardCode] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [confirmAction, setConfirmAction] = useState(null)

  const load = async () => {
    try {
      const [p, a] = await Promise.all([getProfile(), getAddresses()])
      setProfile(p)
      setAddresses(a)
      setForm({
        hoTen: p.hoTen || '',
        email: p.email || '',
        soDienThoai: p.soDienThoai || '',
        gioiTinh: p.gioiTinh || '',
        ngaySinh: p.ngaySinh || ''
      })
      setPendingEmail(p.emailMoiChoXacThuc || '')
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const provincesRequested = useRef(false)
  useEffect(() => {
    if (tab === 'addresses' && !provincesRequested.current) {
      provincesRequested.current = true
      getProvinces().then((prov) => setProvinces(prov || [])).catch(() => {})
    }
  }, [tab])

  useEffect(() => {
    if (provinceId) {
      getDistricts(provinceId).then(setDistricts).catch(() => setDistricts([]))
    }
  }, [provinceId])

  useEffect(() => {
    if (districtId) {
      getWards(districtId).then(setWards).catch(() => setWards([]))
    }
  }, [districtId])

  const handleUpdate = async () => {
    setMsg('')
    if (!profile) { setMsg('Không tải được thông tin tài khoản'); return }
    const emailChanged = form.email !== profile.email
    try {
      await updateProfile(emailChanged
        ? { hoTen: form.hoTen, soDienThoai: form.soDienThoai, email: form.email, gioiTinh: form.gioiTinh, ngaySinh: form.ngaySinh }
        : { hoTen: form.hoTen, soDienThoai: form.soDienThoai, gioiTinh: form.gioiTinh, ngaySinh: form.ngaySinh })
      if (emailChanged) {
        setPendingEmail(form.email)
        setMsg('Cập nhật thành công. Email mới chưa được xác thực, vui lòng bấm "Xác thực email mới".')
      } else {
        setMsg('Cập nhật thành công')
        load()
      }
    } catch (err) {
      setMsg(err.response?.data?.message || 'Lỗi cập nhật')
    }
  }

  const handleXacThucEmailNgay = async () => {
    try {
      await guiMaXacThuc()
      navigate('/xac-thuc-otp?type=verifyEmail')
    } catch (err) {
      setMsg(err.response?.data?.message || 'Lỗi gửi mã OTP')
    }
  }

  const handleXacThucEmailMoi = async () => {
    try {
      await guiMaXacThucEmailMoi({ emailMoi: form.email })
      navigate(`/xac-thuc-otp?type=verifyNewEmail&emailMoi=${encodeURIComponent(form.email)}`)
    } catch (err) {
      setMsg(err.response?.data?.message || 'Lỗi gửi mã OTP')
    }
  }

  useEffect(() => {
    if (location.state?.msg) {
      setMsg(location.state.msg)
    }
  }, [location.state])

  const handlePwd = async () => {
    setPwdMsg('')
    if (pwd.matKhauMoi.length < 6) { setPwdMsg('Mật khẩu mới phải có ít nhất 6 ký tự'); return }
    if (pwd.matKhauMoi !== pwd.xacNhanMatKhauMoi) { setPwdMsg('Mật khẩu mới không khớp'); return }
    if (pwd.matKhauCu && pwd.matKhauMoi === pwd.matKhauCu) { setPwdMsg('Mật khẩu mới không được trùng với mật khẩu cũ'); return }
    try {
      await changePwd({ matKhauCu: pwd.matKhauCu, matKhauMoi: pwd.matKhauMoi })
      setPwdMsg('Đổi mật khẩu thành công')
      setPwd({ matKhauCu: '', matKhauMoi: '', xacNhanMatKhauMoi: '' })
    } catch (err) {
      setPwdMsg(err.response?.data?.message || 'Mật khẩu cũ không đúng')
    }
  }

  const handleAddr = async () => {
    setMsg('')
    try {
      if (editAddr) {
        await updateAddress(editAddr, addrForm)
        setEditAddr(null)
      } else {
        await addAddress(addrForm)
      }
      setAddrForm({ tenNguoiNhan: '', soDienThoai: '', tinhThanhPho: '', quanHuyen: '', phuongXa: '', provinceId: null, districtId: null, wardCode: '', chiTietDiaChi: '', laMacDinh: false })
      setProvinceId(0); setDistrictId(0); setWardCode('')
      load()
    } catch { setMsg('Lỗi xử lý địa chỉ') }
  }

  const handleEditAddr = async (a) => {
    setEditAddr(a.maDiaChi)
    setAddrForm({ tenNguoiNhan: a.tenNguoiNhan, soDienThoai: a.soDienThoai, tinhThanhPho: a.tinhThanhPho || '', quanHuyen: a.quanHuyen || '', phuongXa: a.phuongXa || '', provinceId: a.provinceId, districtId: a.districtId, wardCode: a.wardCode || '', chiTietDiaChi: a.chiTietDiaChi, laMacDinh: a.laMacDinh })
    if (a.provinceId) {
      setProvinceId(a.provinceId)
      if (a.districtId) {
        setDistrictId(a.districtId)
        if (a.wardCode) setWardCode(a.wardCode)
      }
    } else { setProvinceId(0); setDistrictId(0); setWardCode('') }
    setTab('addresses')
  }

  const handleDelAddr = async (id) => {
    setConfirmAction(null)
    try { await deleteAddress(id); load() } catch { setMsg('Xóa địa chỉ thất bại') }
  }

  const handleSetDefault = async (id) => { await setDefaultAddress(id); load() }

  const getRoleLabel = (role) => {
    if (role === 'ADMIN') return 'Quản trị viên'
    if (role === 'STAFF') return 'Nhân viên'
    return 'Thành viên'
  }

  const getRoleBadgeColor = (role) => {
    if (role === 'ADMIN') return 'bg-red-100 text-red-700'
    if (role === 'STAFF') return 'bg-blue-100 text-blue-700'
    return 'bg-amber-100 text-amber-700'
  }

  if (loading) return <LoadingSpinner className="py-20" />

  const SIDEBAR_ITEMS = [
    { key: 'profile', label: 'THÔNG TIN CÁ NHÂN', icon: User },
    { key: 'password', label: 'ĐỔI MẬT KHẨU', icon: ShieldCheck },
    { key: 'addresses', label: 'SỐ ĐỊA CHỈ GIAO HÀNG', icon: MapPin },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[var(--primary-color)] to-[var(--primary-hover)]">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 text-white">
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
              {profile?.hoTen?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-sm opacity-90">Xin chào, <span className="font-bold">{profile?.hoTen || 'User'}</span></p>
              <p className="text-xs opacity-75">Member Bee Stylish</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              {/* User Info Card */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--primary-hover)] flex items-center justify-center text-white font-bold text-lg">
                    {profile?.hoTen?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-bold text-ink text-sm">{profile?.hoTen || 'User'}</p>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${getRoleBadgeColor(profile?.vaiTro)}`}>
                      {getRoleLabel(profile?.vaiTro)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="py-1">
                {SIDEBAR_ITEMS.map(({ key, label, icon: Icon }) => {
                  const active = tab === key
                  return (
                    <button
                      key={key}
                      onClick={() => setTab(key)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${
                        active
                          ? 'bg-[var(--primary-color)]/10 text-[var(--primary-color)] border-r-3 border-[var(--primary-color)]'
                          : 'text-stone hover:bg-gray-50 hover:text-ink'
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                      {label}
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Right Content */}
          <div className="flex-1 min-w-0">
            {msg && (
              <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
                msg.includes('thành công')
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {msg}
              </div>
            )}

            {/* Profile Tab */}
            {tab === 'profile' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                    <span className="w-1 h-5 bg-[var(--primary-color)] rounded-full inline-block" />
                    CHI TIẾT THÔNG TIN TÀI KHOẢN
                  </h2>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); setConfirmAction('updateProfile') }} className="p-6 space-y-5">
                  {/* Họ và tên */}
                  <div>
                    <label className="text-sm font-semibold text-ink mb-1.5 block">HỌ VÀ TÊN</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-stone" />
                      <input
                        type="text"
                        value={form.hoTen}
                        onChange={(e) => setForm({ ...form, hoTen: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)]/30 transition"
                        placeholder="Nhập họ và tên"
                      />
                    </div>
                  </div>

                  {/* SĐT & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-ink mb-1.5 block">SỐ ĐIỆN THOẠI</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone text-sm">📞</span>
                        <input
                          type="tel"
                          value={form.soDienThoai}
                          onChange={(e) => setForm({ ...form, soDienThoai: e.target.value })}
                          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)]/30 transition"
                          placeholder="Nhập số điện thoại"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-ink mb-1.5 block">EMAIL</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone text-sm">✉️</span>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)]/30 transition"
                          placeholder="Nhập email"
                        />
                      </div>
                      {/* Email verification status */}
                      <div className="mt-1.5">
                        {form.email === profile?.email
                          ? (profile?.emailDaXacThuc
                              ? <span className="flex items-center gap-1 text-emerald-600 text-xs"><ShieldCheck className="h-3.5 w-3.5" /> Đã xác thực</span>
                              : <span className="flex items-center gap-1 text-amber-600 text-xs"><ShieldAlert className="h-3.5 w-3.5" /> Chưa xác thực</span>)
                          : form.email === pendingEmail && (
                              <span className="flex items-center gap-1 text-amber-600 text-xs"><ShieldAlert className="h-3.5 w-3.5" /> Chưa xác thực</span>
                            )
                        }
                        {form.email === profile?.email && !profile?.emailDaXacThuc && (
                          <button type="button" onClick={handleXacThucEmailNgay}
                            className="text-[var(--primary-color)] text-xs hover:underline mt-0.5">
                            Xác thực email ngay
                          </button>
                        )}
                        {form.email === pendingEmail && (
                          <button type="button" onClick={handleXacThucEmailMoi}
                            className="text-[var(--primary-color)] text-xs hover:underline mt-0.5">
                            Xác thực email mới
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Giới tính & Ngày sinh */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-ink mb-1.5 block">GIỚI TÍNH</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, gioiTinh: 'Nam' })}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all flex items-center justify-center gap-2 ${
                            form.gioiTinh === 'Nam'
                              ? 'bg-[var(--primary-color)] text-white border-[var(--primary-color)]'
                              : 'border-gray-300 text-stone hover:border-[var(--primary-color)]'
                          }`}
                        >
                          <span className="text-base">♂</span> Nam
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, gioiTinh: 'Nữ' })}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all flex items-center justify-center gap-2 ${
                            form.gioiTinh === 'Nữ'
                              ? 'bg-[var(--primary-color)] text-white border-[var(--primary-color)]'
                              : 'border-gray-300 text-stone hover:border-[var(--primary-color)]'
                          }`}
                        >
                          <span className="text-base">♀</span> Nữ
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-ink mb-1.5 block">NGÀY SINH</label>
                      <input
                        type="date"
                        value={form.ngaySinh || ''}
                        onChange={(e) => setForm({ ...form, ngaySinh: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)]/30 transition"
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="bg-[var(--primary-color)] text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition flex items-center gap-2"
                    >
                      <span className="text-base">💾</span> LƯU THAY ĐỔI
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Password Tab */}
            {tab === 'password' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                    <span className="w-1 h-5 bg-[var(--primary-color)] rounded-full inline-block" />
                    ĐỔI MẬT KHẨU
                  </h2>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); setConfirmAction('changePwd') }} className="p-6 space-y-5">
                  {pwdMsg && (
                    <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                      pwdMsg === 'Đổi mật khẩu thành công'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {pwdMsg}
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-semibold text-ink mb-1.5 block">MẬT KHẨU CŨ</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-stone" />
                      <input
                        type={showPwd.cu ? 'text' : 'password'}
                        value={pwd.matKhauCu}
                        onChange={(e) => setPwd({ ...pwd, matKhauCu: e.target.value })}
                        placeholder="Nhập mật khẩu cũ"
                        required
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)]/30 transition"
                      />
                      <button type="button" onClick={() => setShowPwd({ ...showPwd, cu: !showPwd.cu })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-ink transition">
                        {showPwd.cu ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-ink mb-1.5 block">MẬT KHẨU MỚI</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-stone" />
                      <input
                        type={showPwd.moi ? 'text' : 'password'}
                        value={pwd.matKhauMoi}
                        onChange={(e) => setPwd({ ...pwd, matKhauMoi: e.target.value })}
                        placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                        required
                        minLength={6}
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)]/30 transition"
                      />
                      <button type="button" onClick={() => setShowPwd({ ...showPwd, moi: !showPwd.moi })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-ink transition">
                        {showPwd.moi ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-ink mb-1.5 block">XÁC NHẬN MẬT KHẨU MỚI</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-stone" />
                      <input
                        type={showPwd.xacNhan ? 'text' : 'password'}
                        value={pwd.xacNhanMatKhauMoi}
                        onChange={(e) => setPwd({ ...pwd, xacNhanMatKhauMoi: e.target.value })}
                        placeholder="Nhập lại mật khẩu mới"
                        required
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)]/30 transition"
                      />
                      <button type="button" onClick={() => setShowPwd({ ...showPwd, xacNhan: !showPwd.xacNhan })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-ink transition">
                        {showPwd.xacNhan ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="bg-[var(--primary-color)] text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition flex items-center gap-2"
                    >
                      <span className="text-base">🔒</span> ĐỔI MẬT KHẨU
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Addresses Tab */}
            {tab === 'addresses' && (
              <div className="space-y-4">
                {/* Address List */}
                {addresses.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                        <span className="w-1 h-5 bg-[var(--primary-color)] rounded-full inline-block" />
                        ĐỊA CHỈ GIAO HÀNG ({addresses.length})
                      </h2>
                    </div>
                    <div className="p-4 space-y-3">
                      {addresses.map((a) => (
                        <div key={a.maDiaChi} className="border border-gray-200 rounded-xl p-4 hover:border-[var(--primary-color)]/30 transition">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold text-ink text-sm">{a.tenNguoiNhan}</p>
                                <span className="text-stone text-sm">|</span>
                                <p className="text-stone text-sm">{a.soDienThoai}</p>
                                {a.laMacDinh && (
                                  <span className="text-xs bg-[var(--primary-color)]/10 text-[var(--primary-color)] px-2 py-0.5 rounded-full font-medium">
                                    Mặc định
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-stone flex items-start gap-1.5">
                                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                {a.chiTietDiaChi}{a.tinhThanhPho ? `, ${a.tinhThanhPho}` : ''}
                              </p>
                            </div>
                            <div className="flex gap-1 ml-3">
                              <button onClick={() => handleEditAddr(a)}
                                className="p-2 text-stone hover:text-[var(--primary-color)] hover:bg-[var(--primary-color)]/5 rounded-lg transition"
                                title="Sửa">
                                <Pencil className="h-4 w-4" />
                              </button>
                              {!a.laMacDinh && (
                                <button onClick={() => handleSetDefault(a.maDiaChi)}
                                  className="p-2 text-stone hover:text-amber-500 hover:bg-amber-50 rounded-lg transition"
                                  title="Đặt mặc định">
                                  <Star className="h-4 w-4" />
                                </button>
                              )}
                              <button onClick={() => setConfirmAction(a.maDiaChi)}
                                className="p-2 text-stone hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                title="Xóa">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add/Edit Address Form */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                      <span className="w-1 h-5 bg-[var(--primary-color)] rounded-full inline-block" />
                      {editAddr ? 'SỬA ĐỊA CHỈ' : 'THÊM ĐỊA CHỈ MỚI'}
                    </h2>
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); setConfirmAction('saveAddr') }} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-ink mb-1.5 block">Tên người nhận</label>
                        <input
                          value={addrForm.tenNguoiNhan}
                          onChange={(e) => setAddrForm({ ...addrForm, tenNguoiNhan: e.target.value })}
                          placeholder="Tên người nhận"
                          required
                          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)]/30 transition"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-ink mb-1.5 block">Số điện thoại</label>
                        <input
                          value={addrForm.soDienThoai}
                          onChange={(e) => setAddrForm({ ...addrForm, soDienThoai: e.target.value })}
                          placeholder="Số điện thoại"
                          required
                          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)]/30 transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-ink mb-1.5 block">Tỉnh/Thành phố</label>
                        <select
                          value={provinceId}
                          onChange={(e) => {
                            const id = Number(e.target.value)
                            setProvinceId(id)
                            const name = e.target.options[e.target.selectedIndex]?.text || ''
                            setAddrForm({ ...addrForm, tinhThanhPho: name, provinceId: id || null })
                          }}
                          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)]/30 transition"
                        >
                          <option value={0}>-- Tỉnh/Thành phố --</option>
                          {provinces.map((p) => <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-ink mb-1.5 block">Quận/Huyện</label>
                        <select
                          value={districtId}
                          onChange={(e) => {
                            const id = Number(e.target.value)
                            setDistrictId(id)
                            const name = e.target.options[e.target.selectedIndex]?.text || ''
                            setAddrForm({ ...addrForm, quanHuyen: name, districtId: id || null })
                          }}
                          disabled={!provinceId}
                          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)]/30 transition disabled:bg-gray-50 disabled:text-stone"
                        >
                          <option value={0}>-- Quận/Huyện --</option>
                          {districts.map((d) => <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-ink mb-1.5 block">Phường/Xã</label>
                        <select
                          value={wardCode}
                          onChange={(e) => {
                            setWardCode(e.target.value)
                            const name = e.target.options[e.target.selectedIndex]?.text || ''
                            setAddrForm({ ...addrForm, phuongXa: name, wardCode: e.target.value || '' })
                          }}
                          disabled={!districtId}
                          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)]/30 transition disabled:bg-gray-50 disabled:text-stone"
                        >
                          <option value="">-- Phường/Xã --</option>
                          {wards.map((w) => <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-ink mb-1.5 block">Địa chỉ chi tiết</label>
                        <input
                          value={addrForm.chiTietDiaChi}
                          onChange={(e) => setAddrForm({ ...addrForm, chiTietDiaChi: e.target.value })}
                          placeholder="Số nhà, đường"
                          required
                          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)]/30 transition"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addrForm.laMacDinh}
                        onChange={(e) => setAddrForm({ ...addrForm, laMacDinh: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                      />
                      <span className="text-ink">Đặt làm mặc định</span>
                    </label>

                    <div className="flex gap-3 pt-2">
                      <button type="submit"
                        className="bg-[var(--primary-color)] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition flex items-center gap-2">
                        <Plus className="h-4 w-4" /> {editAddr ? 'CẬP NHẬT' : 'THÊM MỚI'}
                      </button>
                      {editAddr && (
                        <button type="button"
                          onClick={() => {
                            setEditAddr(null)
                            setAddrForm({ tenNguoiNhan: '', soDienThoai: '', tinhThanhPho: '', quanHuyen: '', phuongXa: '', provinceId: null, districtId: null, wardCode: '', chiTietDiaChi: '', laMacDinh: false })
                            setProvinceId(0); setDistrictId(0); setWardCode('')
                          }}
                          className="border border-gray-300 px-6 py-2.5 rounded-xl text-sm font-medium text-stone hover:bg-gray-50 transition">
                          Hủy
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmAction === 'updateProfile'}
        title="Cập nhật hồ sơ"
        message="Bạn chắc chắn muốn lưu các thay đổi thông tin tài khoản?"
        confirmText="Lưu"
        variant="gold"
        onConfirm={() => { setConfirmAction(null); handleUpdate() }}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === 'changePwd'}
        title="Đổi mật khẩu"
        message="Bạn chắc chắn muốn đổi mật khẩu?"
        confirmText="Đổi mật khẩu"
        variant="gold"
        onConfirm={() => { setConfirmAction(null); handlePwd() }}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === 'saveAddr'}
        title={editAddr ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ'}
        message={`Bạn chắc chắn muốn ${editAddr ? 'cập nhật' : 'thêm'} địa chỉ này?`}
        confirmText={editAddr ? 'Cập nhật' : 'Thêm'}
        variant="gold"
        onConfirm={() => { setConfirmAction(null); handleAddr() }}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction !== null && !['updateProfile', 'changePwd', 'saveAddr'].includes(confirmAction)}
        title="Xóa địa chỉ"
        message="Bạn chắc chắn muốn xóa địa chỉ này?"
        confirmText="Xóa"
        onConfirm={() => handleDelAddr(confirmAction)}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}
