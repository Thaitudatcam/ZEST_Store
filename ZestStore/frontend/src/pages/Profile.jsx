import { useState, useEffect } from 'react'
import { getProfile, updateProfile, changePassword as changePwd, getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '../api/users'
import LoadingSpinner from '../components/LoadingSpinner'
import { User, MapPin, Plus, Trash2, Star, Pencil } from 'lucide-react'

export default function Profile() {
  const [tab, setTab] = useState('profile')
  const [profile, setProfile] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ hoTen: '' })
  const [pwd, setPwd] = useState({ matKhauCu: '', matKhauMoi: '' })
  const [addrForm, setAddrForm] = useState({ tenNguoiNhan: '', soDienThoai: '', tinhThanhPho: '', quanHuyen: '', chiTietDiaChi: '', laMacDinh: false })
  const [editAddr, setEditAddr] = useState(null)
  const [msg, setMsg] = useState('')

  const load = async () => {
    try {
      const [p, a] = await Promise.all([getProfile(), getAddresses()])
      setProfile(p); setAddresses(a); setForm({ hoTen: p.hoTen || '' })
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleUpdate = async (e) => {
    e.preventDefault(); setMsg('')
    try { await updateProfile({ hoTen: form.hoTen }); setMsg('Cập nhật thành công') } catch { setMsg('Lỗi cập nhật') }
  }

  const handlePwd = async (e) => {
    e.preventDefault(); setMsg('')
    try { await changePwd(pwd); setMsg('Đổi mật khẩu thành công'); setPwd({ matKhauCu: '', matKhauMoi: '' }) } catch { setMsg('Mật khẩu cũ không đúng') }
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
      setAddrForm({ tenNguoiNhan: '', soDienThoai: '', tinhThanhPho: '', quanHuyen: '', chiTietDiaChi: '', laMacDinh: false }); load()
    } catch { setMsg('Lỗi xử lý địa chỉ') }
  }

  const handleEditAddr = (a) => {
    setEditAddr(a.maDiaChi)
    setAddrForm({ tenNguoiNhan: a.tenNguoiNhan, soDienThoai: a.soDienThoai, tinhThanhPho: a.tinhThanhPho || '', quanHuyen: a.quanHuyen || '', chiTietDiaChi: a.chiTietDiaChi, laMacDinh: a.laMacDinh })
    setTab('addresses')
  }

  const handleDelAddr = async (id) => { await deleteAddress(id); load() }
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
          <input type="password" value={pwd.matKhauCu} onChange={(e) => setPwd({ ...pwd, matKhauCu: e.target.value })} placeholder="Mật khẩu cũ" required className="w-full border rounded-lg px-4 py-2" />
          <input type="password" value={pwd.matKhauMoi} onChange={(e) => setPwd({ ...pwd, matKhauMoi: e.target.value })} placeholder="Mật khẩu mới" required className="w-full border rounded-lg px-4 py-2" />
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
              <input value={addrForm.tinhThanhPho} onChange={(e) => setAddrForm({ ...addrForm, tinhThanhPho: e.target.value })} placeholder="Tỉnh/Thành phố" className="w-full border rounded-lg px-3 py-2 text-sm" />
              <input value={addrForm.quanHuyen} onChange={(e) => setAddrForm({ ...addrForm, quanHuyen: e.target.value })} placeholder="Quận/Huyện" className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <input value={addrForm.chiTietDiaChi} onChange={(e) => setAddrForm({ ...addrForm, chiTietDiaChi: e.target.value })} placeholder="Địa chỉ chi tiết (số nhà, đường)" required className="w-full border rounded-lg px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={addrForm.laMacDinh} onChange={(e) => setAddrForm({ ...addrForm, laMacDinh: e.target.checked })} /> Đặt làm mặc định</label>
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800"><Plus className="h-4 w-4 inline" /> {editAddr ? 'Cập nhật' : 'Thêm'}</button>
              {editAddr && <button type="button" onClick={() => { setEditAddr(null); setAddrForm({ tenNguoiNhan: '', soDienThoai: '', tinhThanhPho: '', quanHuyen: '', chiTietDiaChi: '', laMacDinh: false }) }} className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50">Hủy</button>}
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
