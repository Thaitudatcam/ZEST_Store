import { useState, useEffect } from 'react'
import { getProfile, updateProfile, changePassword as changePwd, getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '../api/users'
import LoadingSpinner from '../components/LoadingSpinner'
import { User, MapPin, Plus, Trash2, Star, Pencil, Eye, EyeOff } from 'lucide-react'
import { getProvinces, getDistricts, getWards } from '../api/ghn'

export default function Profile() {
  const [tab, setTab] = useState('profile')
  const [profile, setProfile] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ hoTen: '' })
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

  const load = async () => {
    try {
      const [p, a, prov] = await Promise.all([getProfile(), getAddresses(), getProvinces()])
      setProfile(p); setAddresses(a); setForm({ hoTen: p.hoTen || '' }); setProvinces(prov || [])
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    if (provinceId) {
      getDistricts(provinceId).then(setDistricts).catch(() => setDistricts([]))
      setDistrictId(0); setWardCode(''); setWards([])
    }
  }, [provinceId])

  useEffect(() => {
    if (districtId) {
      getWards(districtId).then(setWards).catch(() => setWards([]))
      setWardCode('')
    }
  }, [districtId])

  const handleUpdate = async (e) => {
    e.preventDefault(); setMsg('')
    try { await updateProfile({ hoTen: form.hoTen }); setMsg('Cập nhật thành công') } catch { setMsg('Lỗi cập nhật') }
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
      try { const d = await getDistricts(a.provinceId); setDistricts(d || []) } catch {}
      setProvinceId(a.provinceId)
      if (a.districtId) {
        setDistrictId(a.districtId)
        try { const w = await getWards(a.districtId); setWards(w || []) } catch {}
        if (a.wardCode) setWardCode(a.wardCode)
      } else { setDistrictId(0); setWardCode('') }
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
          <div><label className="text-sm text-gray-500">Email</label><p className="font-semibold">{profile?.email}</p></div>
          <div><label className="text-sm text-gray-500">Số điện thoại</label><p className="font-semibold">{profile?.soDienThoai || 'Chưa cập nhật'}</p></div>
          <div><label className="text-sm text-gray-500">Họ tên</label><input value={form.hoTen} onChange={(e) => setForm({ hoTen: e.target.value })} className="w-full border rounded-lg px-4 py-2 mt-1" /></div>
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
