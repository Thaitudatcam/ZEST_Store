import { useState, useEffect } from 'react'
import { getEmployees, createEmployee, updateEmployee, toggleEmployeeStatus } from '../../api/admin'
import { Search, Plus, Pencil, Lock, Unlock, X, Filter } from 'lucide-react'

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ hoTen: '', email: '', soDienThoai: '', matKhau: '', vaiTro: 'STAFF' })

  const load = () => getEmployees().then(setEmployees).catch(() => setError('Không thể tải nhân viên'))
  useEffect(() => { load() }, [])

  const filtered = employees.filter((e) => {
    const matchSearch = !search || (e.hoTen || '').toLowerCase().includes(search.toLowerCase()) || (e.email || '').toLowerCase().includes(search.toLowerCase()) || (e.soDienThoai || '').includes(search)
    const matchRole = roleFilter === 'all' || e.vaiTro === roleFilter
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' && e.trangThai === 1) || (statusFilter === 'locked' && e.trangThai !== 1)
    return matchSearch && matchRole && matchStatus
  })

  const openCreate = () => { setEditing(null); setForm({ hoTen: '', email: '', soDienThoai: '', matKhau: '', vaiTro: 'STAFF' }); setShowForm(true) }

  const openEdit = (emp) => {
    setEditing(emp)
    setForm({ hoTen: emp.hoTen, email: emp.email, soDienThoai: emp.soDienThoai || '', matKhau: '', vaiTro: emp.vaiTro })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        const payload = { ...form }
        if (!payload.matKhau) delete payload.matKhau
        await updateEmployee(editing.maNguoiDung, payload)
      } else {
        if (!form.matKhau) { alert('Vui lòng nhập mật khẩu'); return }
        await createEmployee(form)
      }
      setShowForm(false); setEditing(null); setError(''); load()
    } catch (err) { setError(err.response?.data?.message || 'Thao tác thất bại') }
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm nhân viên..." className="pl-9 pr-4 py-2 border rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Thêm nhân viên
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Filter className="h-4 w-4 text-gray-400" />
        <div className="flex gap-1">
          {[
            { value: 'all', label: 'Tất cả' },
            { value: 'ADMIN', label: 'Quản trị' },
            { value: 'STAFF', label: 'Nhân viên' },
          ].map((s) => (
            <button key={s.value} onClick={() => setRoleFilter(s.value)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition ${roleFilter === s.value ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'}`}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="w-px h-6 bg-gray-200" />
        <div className="flex gap-1">
          {[
            { value: 'all', label: 'Tất cả' },
            { value: 'active', label: 'Hoạt động' },
            { value: 'locked', label: 'Đã khóa' },
          ].map((s) => (
            <button key={s.value} onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition ${statusFilter === s.value ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Nhân viên</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">SĐT</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Vai trò</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((e) => (
                <tr key={e.maNguoiDung} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{e.hoTen}</td>
                  <td className="px-4 py-3 text-gray-500">{e.email}</td>
                  <td className="px-4 py-3">{e.soDienThoai || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${e.vaiTro === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {e.vaiTro === 'ADMIN' ? 'Quản trị' : 'Nhân viên'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${e.trangThai === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {e.trangThai === 1 ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => openEdit(e)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleToggle(e.maNguoiDung)} className={`p-1.5 rounded-lg ${e.trangThai === 1 ? 'text-red-500 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}>
                        {e.trangThai === 1 ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center text-gray-500 py-8">Chưa có nhân viên</p>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">{editing ? 'Sửa nhân viên' : 'Thêm nhân viên'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Họ tên</label>
                <input value={form.hoTen} onChange={(e) => setForm({ ...form, hoTen: e.target.value })} required className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Số điện thoại</label>
                <input value={form.soDienThoai} onChange={(e) => setForm({ ...form, soDienThoai: e.target.value })} className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{editing ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'}</label>
                <input type="password" value={form.matKhau} onChange={(e) => setForm({ ...form, matKhau: e.target.value })} required={!editing} className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Vai trò</label>
                <select value={form.vaiTro} onChange={(e) => setForm({ ...form, vaiTro: e.target.value })} className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="STAFF">Nhân viên</option>
                  <option value="ADMIN">Quản trị viên</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">{editing ? 'Cập nhật' : 'Tạo'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="border px-6 py-2 rounded-lg font-semibold hover:bg-gray-50">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
