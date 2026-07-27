import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { getProfile, updateProfile, changePassword as changePwd, getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, guiMaXacThucEmailMoi, xacNhanEmailMoi } from '../api/users'
import { guiMaXacThuc, xacThucEmail } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { User, MapPin, Plus, Trash2, Star, Pencil, Eye, EyeOff, ShieldCheck, ShieldAlert } from 'lucide-react'
import { getProvinces, getDistricts, getWards } from '../api/ghn'

export default function Profile() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [tab, setTab] = useState(searchParams.get('tab') === 'password' ? 'password' : 'profile')
  const [profile, setProfile] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ hoTen: '', email: '', soDienThoai: '' })
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
  const [emailOtp, setEmailOtp] = useState('')
  const [emailOtpStep, setEmailOtpStep] = useState(null) // 'verify' | 'change'
  const [emailOtpErr, setEmailOtpErr] = useState('')
  const [emailOtpSub, setEmailOtpSub] = useState(false)
  const [emailNew, setEmailNew] = useState('')

  const load = async () => {
    try {
      const [p, a, prov] = await Promise.all([getProfile(), getAddresses(), getProvinces()])
      setProfile(p); setAddresses(a); setForm({ hoTen: p.hoTen || '', email: p.email || '', soDienThoai: p.soDienThoai || '' }); setProvinces(prov || [])
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

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

  const handleUpdate = async (e) => {
    e.preventDefault(); setMsg(''); setEmailOtpErr('')
    if (!profile) { setMsg('Không tải được thông tin tài khoản'); return }
    const emailChanged = form.email !== profile.email
    // Luôn lưu họ tên/SĐT. Nếu đổi email thì KHÔNG gửi email vào updateProfile
    // (backend đã bỏ đổi email trực tiếp) mà chuyển sang luồng OTP riêng.
    try {
      await updateProfile({ hoTen: form.hoTen, soDienThoai: form.soDienThoai })
      if (emailChanged) {
        // Bắt đầu luồng xác thực email mới (không load lại để giữ form.email = email mới)
        await guiMaXacThucEmailMoi({ emailMoi: form.email })
        setEmailNew(form.email)
        setEmailOtpStep('change')
        setEmailOtp('')
        setMsg(`Đã gửi mã OTP đến ${form.email}. Vui lòng nhập mã để xác thực email mới.`)
      } else {
        setMsg('Cập nhật thành công')
        load()
      }
    } catch (err) {
      setMsg(err.response?.data?.message || 'Lỗi cập nhật')
    }
  }

  const handleGuiOtp = async () => {
    setEmailOtpErr(''); setEmailOtp(''); setEmailOtpSub(true)
    try {
      await guiMaXacThuc()
      setEmailOtpStep('verify')
    } catch (err) {
      setEmailOtpErr(err.response?.data?.message || 'Lỗi gửi mã')
    } finally { setEmailOtpSub(false) }
  }

  const handleXacThucOtp = async () => {
    setEmailOtpErr(''); setEmailOtpSub(true)
    try {
      await xacThucEmail({ maXacThuc: emailOtp })
      setMsg('Xác thực email thành công')
      setEmailOtpStep(null); setEmailOtp(''); load()
    } catch (err) {
      setEmailOtpErr(err.response?.data?.message || 'Mã không đúng')
    } finally { setEmailOtpSub(false) }
  }

  const handleGuiOtpEmailMoi = async () => {
    setEmailOtpErr(''); setEmailOtp(''); setEmailOtpSub(true)
    try {
      await guiMaXacThucEmailMoi({ emailMoi: emailNew })
      setEmailOtpStep('change')
      setMsg(`Đã gửi lại mã OTP đến ${emailNew}`)
    } catch (err) {
      setEmailOtpErr(err.response?.data?.message || 'Lỗi gửi mã')
    } finally { setEmailOtpSub(false) }
  }

  const handleXacNhanEmailMoi = async () => {
    setEmailOtpErr(''); setEmailOtpSub(true)
    try {
      await xacNhanEmailMoi({ maXacThuc: emailOtp })
      // Email mới đã được áp dụng trong DB -> token hiện tại (chứa email cũ) không còn hợp lệ.
      // Đăng xuất và yêu cầu đăng nhập lại bằng email mới.
      setEmailOtpStep(null); setEmailOtp(''); setEmailNew('')
      logout()
      navigate('/login', { state: { message: 'Đổi email thành công. Vui lòng đăng nhập lại bằng email mới.' } })
    } catch (err) {
      setEmailOtpErr(err.response?.data?.message || 'Mã không đúng')
    } finally { setEmailOtpSub(false) }
  }

  const handlePwd = async (e) => {
    e.preventDefault(); setPwdMsg('')
    if (pwd.matKhauMoi.length < 6) { setPwdMsg('Mật khẩu mới phải có ít nhất 6 ký tự'); return }
    if (pwd.matKhauMoi !== pwd.xacNhanMatKhauMoi) { setPwdMsg('Mật khẩu mới không khớp'); return }
    try {
      await changePwd({ matKhauCu: pwd.matKhauCu, matKhauMoi: pwd.matKhauMoi })
      setPwdMsg('Đổi mật khẩu thành công')
      setPwd({ matKhauCu: '', matKhauMoi: '', xacNhanMatKhauMoi: '' })
    } catch { setPwdMsg('Mật khẩu cũ không đúng') }
  }

  const handleAddr = async (e) => {
    e.preventDefault(); setMsg('')
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
    try { await deleteAddress(id); load() } catch { setMsg('Xóa địa chỉ thất bại') }
  }
  const handleSetDefault = async (id) => { await setDefaultAddress(id); load() }

  if (loading) return <LoadingSpinner className="py-20" />

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Tài khoản</h1>
      <div className="flex gap-2 mb-6 border-b pb-2">
        {['profile', 'password', 'addresses'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-t-lg text-sm font-medium ${tab === t ? 'bg-white border border-b-white -mb-[3px] text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'profile' ? 'Thông tin' : t === 'password' ? 'Mật khẩu' : 'Địa chỉ'}
          </button>
        ))}
      </div>
      {msg && <p className="text-sm text-green-600 mb-4">{msg}</p>}

      {tab === 'profile' && (
        <form onSubmit={handleUpdate} className="bg-white rounded-xl border p-6 space-y-4">
          <div>
            <label className="text-sm text-gray-500">Email</label>
            <div className="flex items-center gap-2 mt-1">
              <input type="email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setEmailNew(e.target.value) }} className="flex-1 border rounded-lg px-4 py-2" />
              {profile?.emailDaXacThuc
                ? <span className="flex items-center gap-1 text-green-600 text-sm whitespace-nowrap"><ShieldCheck className="h-4 w-4" /> Đã xác thực</span>
                : <span className="flex items-center gap-1 text-amber-600 text-sm whitespace-nowrap"><ShieldAlert className="h-4 w-4" /> Chưa xác thực</span>
              }
            </div>
            {!profile?.emailDaXacThuc && form.email === profile?.email && (
              <div className="mt-2">
                {emailOtpStep === 'verify' ? (
                  <div className="flex items-center gap-2">
                    <input type="text" value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)}
                      placeholder="Nhập mã OTP" maxLength={6} className="w-32 border rounded-lg px-3 py-1.5 text-sm text-center tracking-widest" />
                    <button type="button" onClick={handleXacThucOtp} disabled={emailOtpSub || emailOtp.length !== 6}
                      className="bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-800 disabled:opacity-50">
                      {emailOtpSub ? '...' : 'Xác nhận'}
                    </button>
                    <button type="button" onClick={() => setEmailOtpStep(null)} className="text-gray-500 text-sm">Hủy</button>
                    {emailOtpErr && <span className="text-red-500 text-xs">{emailOtpErr}</span>}
                  </div>
                ) : (
                  <button type="button" onClick={handleGuiOtp} disabled={emailOtpSub}
                    className="text-blue-700 text-sm hover:underline">
                    {emailOtpSub ? 'Đang gửi...' : 'Xác thực email ngay'}
                  </button>
                )}
              </div>
            )}
            {emailOtpStep === 'change' && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Mã OTP đã gửi đến <strong>{emailNew}</strong></p>
                <div className="flex items-center gap-2">
                  <input type="text" value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)}
                    placeholder="Nhập mã OTP" maxLength={6} className="w-32 border rounded-lg px-3 py-1.5 text-sm text-center tracking-widest" />
                  <button type="button" onClick={handleXacNhanEmailMoi} disabled={emailOtpSub || emailOtp.length !== 6}
                    className="bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-800 disabled:opacity-50">
                    {emailOtpSub ? '...' : 'Xác nhận'}
                  </button>
                  <button type="button" onClick={handleGuiOtpEmailMoi} disabled={emailOtpSub}
                    className="text-blue-700 text-sm hover:underline">
                    {emailOtpSub ? 'Đang gửi...' : 'Gửi lại mã'}
                  </button>
                  <button type="button" onClick={() => { setEmailOtpStep(null); setEmailOtp(''); setEmailOtpErr(''); setForm({ ...form, email: profile?.email || '' }) }} className="text-gray-500 text-sm">Hủy</button>
                  {emailOtpErr && <span className="text-red-500 text-xs">{emailOtpErr}</span>}
                </div>
              </div>
            )}
          </div>
          <div><label className="text-sm text-gray-500">Số điện thoại</label><input type="tel" value={form.soDienThoai} onChange={(e) => setForm({ ...form, soDienThoai: e.target.value })} className="w-full border rounded-lg px-4 py-2 mt-1" /></div>
          <div><label className="text-sm text-gray-500">Họ tên</label><input value={form.hoTen} onChange={(e) => setForm({ ...form, hoTen: e.target.value })} className="w-full border rounded-lg px-4 py-2 mt-1" /></div>
          <button type="submit" className="bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800">Lưu</button>
        </form>
      )}

      {tab === 'password' && (
        <form onSubmit={handlePwd} className="bg-white rounded-xl border p-6 space-y-4">
          {pwdMsg && <p className={`text-sm ${pwdMsg === 'Đổi mật khẩu thành công' ? 'text-green-600' : 'text-red-600'}`}>{pwdMsg}</p>}
          <div className="relative">
            <input type={showPwd.cu ? 'text' : 'password'} value={pwd.matKhauCu}
              onChange={(e) => setPwd({ ...pwd, matKhauCu: e.target.value })} placeholder="Mật khẩu cũ"
              required className="w-full border rounded-lg px-4 py-2 pr-10" />
            <button type="button" onClick={() => setShowPwd({ ...showPwd, cu: !showPwd.cu })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPwd.cu ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="relative">
            <input type={showPwd.moi ? 'text' : 'password'} value={pwd.matKhauMoi}
              onChange={(e) => setPwd({ ...pwd, matKhauMoi: e.target.value })} placeholder="Mật khẩu mới"
              required minLength={6} className="w-full border rounded-lg px-4 py-2 pr-10" />
            <button type="button" onClick={() => setShowPwd({ ...showPwd, moi: !showPwd.moi })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPwd.moi ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="relative">
            <input type={showPwd.xacNhan ? 'text' : 'password'} value={pwd.xacNhanMatKhauMoi}
              onChange={(e) => setPwd({ ...pwd, xacNhanMatKhauMoi: e.target.value })} placeholder="Xác nhận mật khẩu mới"
              required className="w-full border rounded-lg px-4 py-2 pr-10" />
            <button type="button" onClick={() => setShowPwd({ ...showPwd, xacNhan: !showPwd.xacNhan })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPwd.xacNhan ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button type="submit" className="bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800">Đổi mật khẩu</button>
        </form>
      )}

      {tab === 'addresses' && (
        <div className="space-y-4">
          {addresses.map((a) => (
            <div key={a.maDiaChi} className="bg-white rounded-xl border p-4 flex justify-between items-start">
              <div>
                <p className="font-semibold">{a.tenNguoiNhan} <span className="font-normal text-gray-500">- {a.soDienThoai}</span></p>
                <p className="text-sm text-gray-600">{a.chiTietDiaChi}{a.tinhThanhPho ? `, ${a.tinhThanhPho}` : ''}</p>
                {a.laMacDinh && <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded mt-1">Mặc định</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEditAddr(a)} className="text-blue-600 hover:underline text-sm"><Pencil className="h-4 w-4 inline" /></button>
                {!a.laMacDinh && <button onClick={() => handleSetDefault(a.maDiaChi)} className="text-blue-600 hover:underline text-sm"><Star className="h-4 w-4 inline" /></button>}
                <button onClick={() => handleDelAddr(a.maDiaChi)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          <form onSubmit={handleAddr} className="bg-white rounded-xl border p-4 space-y-3">
            <h3 className="font-semibold">{editAddr ? 'Sửa địa chỉ' : 'Thêm địa chỉ'}</h3>
            <input value={addrForm.tenNguoiNhan} onChange={(e) => setAddrForm({ ...addrForm, tenNguoiNhan: e.target.value })} placeholder="Tên người nhận" required className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input value={addrForm.soDienThoai} onChange={(e) => setAddrForm({ ...addrForm, soDienThoai: e.target.value })} placeholder="Số điện thoại" required className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <select value={provinceId} onChange={(e) => { const id = Number(e.target.value); setProvinceId(id); const name = e.target.options[e.target.selectedIndex]?.text || ''; setAddrForm({ ...addrForm, tinhThanhPho: name, provinceId: id || null }) }}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value={0}>-- Tỉnh/Thành phố --</option>
                {provinces.map((p) => <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>)}
              </select>
              <select value={districtId} onChange={(e) => { const id = Number(e.target.value); setDistrictId(id); const name = e.target.options[e.target.selectedIndex]?.text || ''; setAddrForm({ ...addrForm, quanHuyen: name, districtId: id || null }) }}
                disabled={!provinceId} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value={0}>-- Quận/Huyện --</option>
                {districts.map((d) => <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>)}
              </select>
            </div>
            <select value={wardCode} onChange={(e) => { setWardCode(e.target.value); const name = e.target.options[e.target.selectedIndex]?.text || ''; setAddrForm({ ...addrForm, phuongXa: name, wardCode: e.target.value || '' }) }}
              disabled={!districtId} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">-- Phường/Xã --</option>
              {wards.map((w) => <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>)}
            </select>
            <input value={addrForm.chiTietDiaChi} onChange={(e) => setAddrForm({ ...addrForm, chiTietDiaChi: e.target.value })} placeholder="Địa chỉ chi tiết (số nhà, đường)" required className="w-full border rounded-lg px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={addrForm.laMacDinh} onChange={(e) => setAddrForm({ ...addrForm, laMacDinh: e.target.checked })} /> Đặt làm mặc định</label>
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800"><Plus className="h-4 w-4 inline" /> {editAddr ? 'Cập nhật' : 'Thêm'}</button>
              {editAddr && <button type="button" onClick={() => { setEditAddr(null); setAddrForm({ tenNguoiNhan: '', soDienThoai: '', tinhThanhPho: '', quanHuyen: '', phuongXa: '', provinceId: null, districtId: null, wardCode: '', chiTietDiaChi: '', laMacDinh: false }); setProvinceId(0); setDistrictId(0); setWardCode('') }} className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50">Hủy</button>}
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
