import { useState, useEffect } from 'react'
import {
  getEmployees, getCustomers, updateEmployee, toggleEmployeeStatus, convertToEmployee
} from '../../api/admin'
import { Search, Plus, Pencil, Lock, Unlock, X, Filter, UserPlus, Loader } from 'lucide-react'

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [error, setError] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [allCustomers, setAllCustomers] = useState([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [selected, setSelected] = useState(null)
  const [convertPos, setConvertPos] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ hoTen: '', email: '', soDienThoai: '', matKhau: '', vaiTro: 'STAFF', choPhepBanHang: false })
  const [showForm, setShowForm] = useState(false)

  const load = () => getEmployees().then(setEmployees).catch(() => setError('Không thể tải nhân viên'))
  useEffect(() => { load() }, [])

  const openStaffSearch = () => {
    setSelected(null)
    setSearchQ('')
    setConvertPos(false)
    setShowSearch(true)
    setLoadingCustomers(true)
    getCustomers()
      .then(res => setAllCustomers(res.filter(c => !employees.some(e => e.maNguoiDung === c.maNguoiDung))))
      .catch(() => setAllCustomers([]))
      .finally(() => setLoadingCustomers(false))
  }

  const candidates = allCustomers.filter(c => {
    if (!searchQ.trim()) return true
    const q = searchQ.toLowerCase()
    return (c.hoTen || '').toLowerCase().includes(q)
        || (c.email || '').toLowerCase().includes(q)
        || (c.soDienThoai || '').includes(q)
  })

  const filtered = employees.filter((e) => {
    const matchSearch = !search || (e.hoTen || '').toLowerCase().includes(search.toLowerCase()) || (e.email || '').toLowerCase().includes(search.toLowerCase()) || (e.soDienThoai || '').includes(search)
    const matchRole = roleFilter === 'all' || e.vaiTro === roleFilter
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' && e.trangThai === 1) || (statusFilter === 'locked' && e.trangThai !== 1)
    return matchSearch && matchRole && matchStatus
  })

  const openEdit = (emp) => {
    setEditing(emp)
    setForm({ hoTen: emp.hoTen, email: emp.email, soDienThoai: emp.soDienThoai || '', matKhau: '', vaiTro: emp.vaiTro, choPhepBanHang: emp.choPhepBanHang })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...form }
      if (!payload.matKhau) delete payload.matKhau
      await updateEmployee(editing.maNguoiDung, payload)
      setShowForm(false); setEditing(null); setError(''); load()
    } catch (err) { setError(err.response?.data?.message || 'Thao tác thất bại') }
  }

  const handleConvert = async () => {
    if (!selected) return
    try {
      await convertToEmployee({ maNguoiDung: selected.maNguoiDung, vaiTro: 'STAFF', choPhepBanHang: convertPos })
      setShowSearch(false); setSelected(null); setError(''); load()
    } catch (err) { setError(err.response?.data?.message || 'Chuyển đổi thất bại') }
  }

  const handleToggle = async (id) => {
    try { await toggleEmployeeStatus(id); setError(''); load() }
    catch { setError('Cập nhật thất bại') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý nhân viên</h1>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm nhân viên..." className="pl-9 pr-4 py-2 border rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-gold" />
          </div>
          <button onClick={openStaffSearch}
            className="bg-gold text-noir px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gold-hover flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Thêm nhân viên
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Filter className="h-4 w-4 text-stone" />
        <div className="flex gap-1">
          {[
            { value: 'all', label: 'Tất cả' },
            { value: 'ADMIN', label: 'Quản trị' },
            { value: 'STAFF', label: 'Nhân viên' },
          ].map((s) => (
            <button key={s.value} onClick={() => setRoleFilter(s.value)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition ${roleFilter === s.value ? 'bg-gold text-noir border-gold' : 'hover:bg-ivory-100'}`}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="w-px h-6 bg-ivory-100" />
        <div className="flex gap-1">
          {[
            { value: 'all', label: 'Tất cả' },
            { value: 'active', label: 'Hoạt động' },
            { value: 'locked', label: 'Đã khóa' },
          ].map((s) => (
            <button key={s.value} onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition ${statusFilter === s.value ? 'bg-gold text-noir border-gold' : 'hover:bg-ivory-100'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-bordeaux/10 border border-bordeaux/20 text-bordeaux text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

      <div className="bg-ivory rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ivory-100 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-stone">Nhân viên</th>
                <th className="text-left px-4 py-3 font-semibold text-stone">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-stone">SĐT</th>
                <th className="text-center px-4 py-3 font-semibold text-stone">Vai trò</th>
                <th className="text-center px-4 py-3 font-semibold text-stone">Bán tại quầy</th>
                <th className="text-center px-4 py-3 font-semibold text-stone">Trạng thái</th>
                <th className="text-center px-4 py-3 font-semibold text-stone">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((e) => (
                <tr key={e.maNguoiDung} className="hover:bg-ivory-100">
                  <td className="px-4 py-3 font-medium">{e.hoTen}</td>
                  <td className="px-4 py-3 text-stone">{e.email}</td>
                  <td className="px-4 py-3">{e.soDienThoai || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${e.vaiTro === 'ADMIN' ? 'bg-royal/20 text-royal' : 'bg-gold/20 text-gold-hover'}`}>
                      {e.vaiTro === 'ADMIN' ? 'Quản trị' : 'Nhân viên'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {e.vaiTro === 'ADMIN' ? (
                      <span className="text-xs text-stone">—</span>
                    ) : (
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${e.choPhepBanHang ? 'bg-emerald-deep/20 text-emerald-800' : 'bg-ivory-100 text-stone'}`}>
                        {e.choPhepBanHang ? 'Có' : 'Không'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${e.trangThai === 1 ? 'bg-emerald-deep/20 text-emerald-800' : 'bg-bordeaux/20 text-bordeaux'}`}>
                      {e.trangThai === 1 ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => openEdit(e)} className="p-1.5 text-gold hover:bg-gold/10 rounded-lg"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleToggle(e.maNguoiDung)} className={`p-1.5 rounded-lg ${e.trangThai === 1 ? 'text-bordeaux hover:bg-bordeaux/10' : 'text-emerald-deep hover:bg-emerald-deep/10'}`}>
                        {e.trangThai === 1 ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center text-stone py-8">Chưa có nhân viên</p>}
      </div>

      {/* Search customer modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowSearch(false)}>
          <div className="bg-ivory rounded-2xl shadow-xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Chọn khách hàng làm nhân viên</h2>
              <button onClick={() => setShowSearch(false)} className="text-stone hover:text-stone"><X className="h-5 w-5" /></button>
            </div>

            {!selected ? (
              <>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
                  <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Lọc theo tên, email, số điện thoại..."
                    className="pl-9 pr-4 py-2.5 border rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-gold" autoFocus />
                </div>
                {loadingCustomers ? (
                  <div className="flex justify-center py-8"><Loader className="h-6 w-6 animate-spin text-gold" /></div>
                ) : candidates.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto border rounded-lg divide-y">
                    {candidates.map(c => (
                      <div key={c.maNguoiDung} className="flex items-center justify-between px-4 py-3 hover:bg-ivory-100">
                        <div>
                          <p className="font-medium text-sm">{c.hoTen}</p>
                          <p className="text-xs text-stone">{c.email}{c.soDienThoai ? ` · ${c.soDienThoai}` : ''}</p>
                        </div>
                        <button onClick={() => setSelected(c)}
                          className="bg-gold text-noir px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gold-hover">
                          Chọn
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-stone py-8 text-sm">Không có khách hàng nào</p>
                )}
              </>
            ) : (
              <div>
                <div className="bg-ivory-100 rounded-xl p-4 mb-4">
                  <p className="font-medium">{selected.hoTen}</p>
                  <p className="text-sm text-stone mt-1">{selected.email}{selected.soDienThoai ? ` · ${selected.soDienThoai}` : ''}</p>
                </div>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 text-sm cursor-pointer">
                    <input type="checkbox" checked={convertPos} onChange={(e) => setConvertPos(e.target.checked)}
                      className="h-4 w-4 rounded border-stone/30 text-gold focus:ring-gold" />
                    <span>Cho phép bán tại quầy</span>
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={handleConvert}
                    className="bg-gold text-noir px-6 py-2 rounded-lg font-semibold hover:bg-gold-hover">
                    Xác nhận
                  </button>
                  <button onClick={() => { setSelected(null); setSearchQ('') }}
                    className="border px-6 py-2 rounded-lg font-semibold hover:bg-ivory-100">
                    Quay lại
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit employee form */}
      {showForm && editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-ivory rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Chỉnh sửa nhân viên</h2>
              <button onClick={() => setShowForm(false)} className="text-stone hover:text-stone"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-ink-soft">Họ tên</label>
                <input value={form.hoTen} onChange={(e) => setForm({ ...form, hoTen: e.target.value })} required className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-gold" />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-soft">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-gold" />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-soft">Số điện thoại</label>
                <input value={form.soDienThoai} onChange={(e) => setForm({ ...form, soDienThoai: e.target.value })} className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-gold" />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-soft">Mật khẩu mới (để trống nếu không đổi)</label>
                <input type="password" value={form.matKhau} onChange={(e) => setForm({ ...form, matKhau: e.target.value })} className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-gold" />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-soft">Vai trò</label>
                <select value={form.vaiTro} onChange={(e) => setForm({ ...form, vaiTro: e.target.value })} className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-gold">
                  <option value="STAFF">Nhân viên</option>
                  <option value="ADMIN">Quản trị viên</option>
                </select>
              </div>
              {form.vaiTro === 'STAFF' && (
                <label className="flex items-center gap-3 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.choPhepBanHang} onChange={(e) => setForm({ ...form, choPhepBanHang: e.target.checked })}
                    className="h-4 w-4 rounded border-stone/30 text-gold focus:ring-gold" />
                  <span>Cho phép bán tại quầy</span>
                </label>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="bg-gold text-noir px-6 py-2 rounded-lg font-semibold hover:bg-gold-hover">Cập nhật</button>
                <button type="button" onClick={() => setShowForm(false)} className="border px-6 py-2 rounded-lg font-semibold hover:bg-ivory-100">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
