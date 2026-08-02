import { useState, useEffect } from 'react'
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
  const [pendingEmail, setPendingEmail] = useState('')
  const [confirmAction, setConfirmAction] = useState(null)
  const load = async () => {
    try {
      const [p, a, prov] = await Promise.all([getProfile(), getAddresses(), getProvinces()])
      setProfile(p); setAddresses(a); setForm({ hoTen: p.hoTen || '', email: p.email || '', soDienThoai: p.soDienThoai || '' }); setPendingEmail(p.emailMoiChoXacThuc || ''); setProvinces(prov || [])
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

  const handleUpdate = async () => {
    setMsg('')
    if (!profile) { setMsg('Không tải được thông tin tài khoản'); return }
    const emailChanged = form.email !== profile.email
    // Luôn lưu họ tên/SĐT. Nếu đổi email thì gửi email làm "email mới chờ xác thực"
    // (backend không đổi email chính, chỉ lưu emailMoiChoXacThuc và KHÔNG gửi OTP).
    try {
      await updateProfile(emailChanged
        ? { hoTen: form.hoTen, soDienThoai: form.soDienThoai, email: form.email }
        : { hoTen: form.hoTen, soDienThoai: form.soDienThoai })
      if (emailChanged) {
        // Lưu pending email, hiện "Chưa xác thực" + nút xác thực thủ công.
        // Không load() để giữ form.email = email mới.
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

  if (loading) return <LoadingSpinner className="py-20" />

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Tài khoản</h1>
      <div className="flex gap-2 mb-6 border-b pb-2">
        {['profile', 'password', 'addresses'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-t-lg text-sm font-medium ${tab === t ? 'bg-ivory border border-b-white -mb-[3px] text-gold' : 'text-stone hover:text-ink-soft'}`}>
            {t === 'profile' ? 'Thông tin' : t === 'password' ? 'Mật khẩu' : 'Địa chỉ'}
          </button>
        ))}
      </div>
      {msg && <p className="text-sm text-emerald-deep mb-4">{msg}</p>}

      {tab === 'profile' && (
        <form onSubmit={(e) => { e.preventDefault(); setConfirmAction('updateProfile') }} className="bg-ivory rounded-xl border p-6 space-y-4">
          <div>
            <label className="text-sm text-stone">Email</label>
            <div className="flex items-center gap-2 mt-1">
              <input type="email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }) }} className="flex-1 border rounded-lg px-4 py-2" />
              {form.email === profile?.email
                ? (profile?.emailDaXacThuc
                    ? <span className="flex items-center gap-1 text-emerald-deep text-sm whitespace-nowrap"><ShieldCheck className="h-4 w-4" /> Đã xác thực ✓</span>
                    : <span className="flex items-center gap-1 text-gold text-sm whitespace-nowrap"><ShieldAlert className="h-4 w-4" /> Chưa xác thực</span>)
                : form.email === pendingEmail && (
                    <span className="flex items-center gap-1 text-gold text-sm whitespace-nowrap"><ShieldAlert className="h-4 w-4" /> Chưa xác thực</span>
                  )
              }
            </div>
            {form.email === profile?.email
              ? (!profile?.emailDaXacThuc && (
                  <div className="mt-2">
                    <button type="button" onClick={handleXacThucEmailNgay}
                      className="text-gold text-sm hover:underline">
                      Xác thực email ngay
                    </button>
                  </div>
                ))
              : form.email === pendingEmail && (
                  <div className="mt-2">
                    <button type="button" onClick={handleXacThucEmailMoi}
                      className="text-gold text-sm hover:underline">
                      Xác thực email mới
                    </button>
                  </div>
                )
            }
          </div>
          <div><label className="text-sm text-stone">Số điện thoại</label><input type="tel" value={form.soDienThoai} onChange={(e) => setForm({ ...form, soDienThoai: e.target.value })} className="w-full border rounded-lg px-4 py-2 mt-1" /></div>
          <div><label className="text-sm text-stone">Họ tên</label><input value={form.hoTen} onChange={(e) => setForm({ ...form, hoTen: e.target.value })} className="w-full border rounded-lg px-4 py-2 mt-1" /></div>
          <button type="submit" className="bg-gold text-noir px-6 py-2 rounded-lg hover:bg-gold-hover">Lưu</button>
        </form>
      )}

      {tab === 'password' && (
        <form onSubmit={(e) => { e.preventDefault(); setConfirmAction('changePwd') }} className="bg-ivory rounded-xl border p-6 space-y-4">
          {pwdMsg && <p className={`text-sm ${pwdMsg === 'Đổi mật khẩu thành công' ? 'text-emerald-deep' : 'text-bordeaux'}`}>{pwdMsg}</p>}
          <div className="relative">
            <input type={showPwd.cu ? 'text' : 'password'} value={pwd.matKhauCu}
              onChange={(e) => setPwd({ ...pwd, matKhauCu: e.target.value })} placeholder="Mật khẩu cũ"
              required className="w-full border rounded-lg px-4 py-2 pr-10" />
            <button type="button" onClick={() => setShowPwd({ ...showPwd, cu: !showPwd.cu })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-stone">
              {showPwd.cu ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="relative">
            <input type={showPwd.moi ? 'text' : 'password'} value={pwd.matKhauMoi}
              onChange={(e) => setPwd({ ...pwd, matKhauMoi: e.target.value })} placeholder="Mật khẩu mới"
              required minLength={6} className="w-full border rounded-lg px-4 py-2 pr-10" />
            <button type="button" onClick={() => setShowPwd({ ...showPwd, moi: !showPwd.moi })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-stone">
              {showPwd.moi ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="relative">
            <input type={showPwd.xacNhan ? 'text' : 'password'} value={pwd.xacNhanMatKhauMoi}
              onChange={(e) => setPwd({ ...pwd, xacNhanMatKhauMoi: e.target.value })} placeholder="Xác nhận mật khẩu mới"
              required className="w-full border rounded-lg px-4 py-2 pr-10" />
            <button type="button" onClick={() => setShowPwd({ ...showPwd, xacNhan: !showPwd.xacNhan })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-stone">
              {showPwd.xacNhan ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button type="submit" className="bg-gold text-noir px-6 py-2 rounded-lg hover:bg-gold-hover">Đổi mật khẩu</button>
        </form>
      )}

      {tab === 'addresses' && (
        <div className="space-y-4">
          {addresses.map((a) => (
            <div key={a.maDiaChi} className="bg-ivory rounded-xl border p-4 flex justify-between items-start">
              <div>
                <p className="font-semibold">{a.tenNguoiNhan} <span className="font-normal text-stone">- {a.soDienThoai}</span></p>
                <p className="text-sm text-stone">{a.chiTietDiaChi}{a.tinhThanhPho ? `, ${a.tinhThanhPho}` : ''}</p>
                {a.laMacDinh && <span className="inline-block text-xs bg-gold/20 text-gold px-2 py-0.5 rounded mt-1">Mặc định</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEditAddr(a)} className="text-gold hover:underline text-sm"><Pencil className="h-4 w-4 inline" /></button>
                {!a.laMacDinh && <button onClick={() => handleSetDefault(a.maDiaChi)} className="text-gold hover:underline text-sm"><Star className="h-4 w-4 inline" /></button>}
                <button onClick={() => setConfirmAction(a.maDiaChi)} className="text-bordeaux hover:text-bordeaux"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          <form onSubmit={(e) => { e.preventDefault(); setConfirmAction('saveAddr') }} className="bg-ivory rounded-xl border p-4 space-y-3">
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
              <button type="submit" className="bg-gold text-noir px-4 py-2 rounded-lg text-sm hover:bg-gold-hover"><Plus className="h-4 w-4 inline" /> {editAddr ? 'Cập nhật' : 'Thêm'}</button>
              {editAddr && <button type="button" onClick={() => { setEditAddr(null); setAddrForm({ tenNguoiNhan: '', soDienThoai: '', tinhThanhPho: '', quanHuyen: '', phuongXa: '', provinceId: null, districtId: null, wardCode: '', chiTietDiaChi: '', laMacDinh: false }); setProvinceId(0); setDistrictId(0); setWardCode('') }} className="border px-4 py-2 rounded-lg text-sm hover:bg-ivory-100">Hủy</button>}
            </div>
          </form>
        </div>
      )}

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
