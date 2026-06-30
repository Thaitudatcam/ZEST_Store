import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getCustomers, toggleCustomerStatus, getEmployees, createEmployee, updateEmployee, toggleEmployeeStatus } from '../../api/admin'
import { Search, Eye, Lock, Unlock, Plus, Pencil, X, Filter, Users, UserCheck, UserX, CheckCircle, XCircle, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'

export default function AdminUsers() {
  const { pathname } = useLocation()
  const tab = pathname.includes('employees') ? 'employees' : 'customers'
  const [customers, setCustomers] = useState([])
  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [error, setError] = useState('')
  const [detail, setDetail] = useState(null)
  const [confirmToggle, setConfirmToggle] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ hoTen: '', email: '', soDienThoai: '', matKhau: '', vaiTro: 'STAFF' })
  const [page, setPage] = useState(0)
  const [empPage, setEmpPage] = useState(0)
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState('asc')
  const [selectedIds, setSelectedIds] = useState([])
  const [confirmBulk, setConfirmBulk] = useState(null)
  const PAGE_SIZE = 20

  const loadCustomers = () => getCustomers().then(setCustomers).catch(() => setError('Không thể tải khách hàng'))
  const loadEmployees = () => getEmployees().then(setEmployees).catch(() => setError('Không thể tải nhân viên'))

  const sortData = (data) => {
    if (!sortField) return data
    return [...data].sort((a, b) => {
      const va = (a[sortField] == null ? '' : String(a[sortField])).toLowerCase()
      const vb = (b[sortField] == null ? '' : String(b[sortField])).toLowerCase()
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })
  }

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleSelectAll = (ids) => {
    setSelectedIds(prev => prev.length === ids.length ? [] : ids)
  }

  const handleBulkToggle = async (action) => {
    try {
      if (tab === 'employees') {
        for (const id of selectedIds) await toggleEmployeeStatus(id)
        loadEmployees()
      } else {
        for (const id of selectedIds) await toggleCustomerStatus(id)
        loadCustomers()
      }
      setSelectedIds([]); setConfirmBulk(null); setError('')
    } catch { setError('Thao tác thất bại'); setConfirmBulk(null) }
  }

  useEffect(() => { loadCustomers() }, [])
  useEffect(() => { loadEmployees() }, [])

  const filteredCustomers = customers.filter((c) => {
    const matchSearch = !search || (c.hoTen || '').toLowerCase().includes(search.toLowerCase()) || (c.email || '').toLowerCase().includes(search.toLowerCase()) || (c.soDienThoai || '').includes(search)
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' && c.trangThai === 1) || (statusFilter === 'locked' && c.trangThai !== 1)
    return matchSearch && matchStatus
  })

  const filteredEmployees = employees.filter((e) => {
    const matchSearch = !search || (e.hoTen || '').toLowerCase().includes(search.toLowerCase()) || (e.email || '').toLowerCase().includes(search.toLowerCase()) || (e.soDienThoai || '').includes(search)
    const matchRole = roleFilter === 'all' || e.vaiTro === roleFilter
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' && e.trangThai === 1) || (statusFilter === 'locked' && e.trangThai !== 1)
    return matchSearch && matchRole && matchStatus
  })

  const handleToggleCustomer = async () => {
    if (!confirmToggle) return
    try { await toggleCustomerStatus(confirmToggle); setError(''); setConfirmToggle(null); loadCustomers() }
    catch { setError('Cập nhật thất bại'); setConfirmToggle(null) }
  }

  const handleToggleEmployee = async (id) => {
    try { await toggleEmployeeStatus(id); setError(''); loadEmployees() }
    catch { setError('Cập nhật thất bại') }
  }

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
      setShowForm(false); setEditing(null); setError(''); loadEmployees()
    } catch (err) { setError(err.response?.data?.message || 'Thao tác thất bại') }
  }

  useEffect(() => { setPage(0); setEmpPage(0); setSelectedIds([]) }, [search, statusFilter, roleFilter])
  const sortedCustomers = sortData(filteredCustomers)
  const sortedEmployees = sortData(filteredEmployees)
  const totalPages = Math.ceil(sortedCustomers.length / PAGE_SIZE)
  const empTotalPages = Math.ceil(sortedEmployees.length / PAGE_SIZE)
  const pagedCustomers = sortedCustomers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const pagedEmployees = sortedEmployees.slice(empPage * PAGE_SIZE, (empPage + 1) * PAGE_SIZE)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={`Tìm ${tab === 'customers' ? 'khách hàng' : 'nhân viên'}...`}
              className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {tab === 'employees' && (
            <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Thêm nhân viên
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <Filter className="h-4 w-4 text-gray-400" />
        {tab === 'employees' && (
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
        )}
        {tab === 'customers' && <div className="flex gap-1">
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
        </div>}
        {tab === 'employees' && <>
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
        </>}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-2xl border p-4 flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 rounded-xl"><Users className="h-5 w-5 text-blue-700" /></div>
          <div><p className="text-xs text-gray-500">Tổng {tab === 'customers' ? 'khách hàng' : 'nhân viên'}</p><p className="text-xl font-bold">{tab === 'customers' ? customers.length : employees.length}</p></div>
        </div>
        <div className="bg-white rounded-2xl border p-4 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 rounded-xl"><UserCheck className="h-5 w-5 text-emerald-700" /></div>
          <div><p className="text-xs text-gray-500">Hoạt động</p><p className="text-xl font-bold">{(tab === 'customers' ? customers : employees).filter(x => x.trangThai === 1).length}</p></div>
        </div>
        <div className="bg-white rounded-2xl border p-4 flex items-center gap-3">
          <div className="p-2.5 bg-red-100 rounded-xl"><UserX className="h-5 w-5 text-red-700" /></div>
          <div><p className="text-xs text-gray-500">Đã khóa</p><p className="text-xl font-bold">{(tab === 'customers' ? customers : employees).filter(x => x.trangThai !== 1).length}</p></div>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 mb-4 flex items-center justify-between">
          <span className="text-sm text-blue-800 font-medium">Đã chọn {selectedIds.length} {tab === 'customers' ? 'khách hàng' : 'nhân viên'}</span>
          <button onClick={() => setConfirmBulk('lock')} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 font-semibold">Khóa</button>
          <button onClick={() => setConfirmBulk('unlock')} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 font-semibold ml-2">Mở khóa</button>
          <button onClick={() => setSelectedIds([])} className="text-xs text-gray-500 hover:text-gray-700 ml-3 font-medium">Bỏ chọn</button>
        </div>
      )}

      {confirmBulk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirmBulk(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Xác nhận</h3>
            <p className="text-sm text-gray-600 mb-4">{confirmBulk === 'lock' ? 'Khóa' : 'Mở khóa'} {selectedIds.length} {tab === 'customers' ? 'khách hàng' : 'nhân viên'}?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmBulk(null)} className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-gray-50">Hủy</button>
              <button onClick={() => handleBulkToggle(confirmBulk)} className="flex-1 py-2.5 bg-blue-700 text-white rounded-xl text-sm font-medium hover:bg-blue-800">Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'customers' && (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="w-10 px-2 py-3 text-center">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 cursor-pointer" checked={selectedIds.length === pagedCustomers.length && pagedCustomers.length > 0} onChange={() => toggleSelectAll(pagedCustomers.map(c => c.maNguoiDung))} />
                  </th>
                  {[
                    { key: 'hoTen', label: 'Khách hàng', align: 'text-left' },
                    { key: 'email', label: 'Email', align: 'text-left' },
                    { key: 'soDienThoai', label: 'SĐT', align: 'text-left' },
                    { key: 'ngayTao', label: 'Ngày tạo', align: 'text-center' },
                  ].map(({ key, label, align }) => (
                    <th key={key} className={`${align} px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-gray-900 select-none`} onClick={() => toggleSort(key)}>
                      <span className="inline-flex items-center gap-1">{label} {sortField === key ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 text-gray-300" />}</span>
                    </th>
                  ))}
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pagedCustomers.map((c) => (
                  <tr key={c.maNguoiDung} className={`hover:bg-gray-50 ${selectedIds.includes(c.maNguoiDung) ? 'bg-blue-50/50' : ''}`}>
                    <td className="w-10 px-2 py-3 text-center">
                      <input type="checkbox" className="h-4 w-4 rounded border-gray-300 cursor-pointer" checked={selectedIds.includes(c.maNguoiDung)} onChange={() => toggleSelect(c.maNguoiDung)} />
                    </td>
                    <td className="px-4 py-3 font-medium">{c.hoTen}</td>
                    <td className="px-4 py-3 text-gray-500">{c.email}</td>
                    <td className="px-4 py-3">{c.soDienThoai || '-'}</td>
                    <td className="px-4 py-3 text-center">{c.ngayTao ? new Date(c.ngayTao).toLocaleDateString('vi-VN') : '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${c.trangThai === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {c.trangThai === 1 ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => setDetail(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => setConfirmToggle(c.maNguoiDung)} className={`p-1.5 rounded-lg ${c.trangThai === 1 ? 'text-red-500 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}>
                          {c.trangThai === 1 ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagedCustomers.length === 0 && <p className="text-center text-gray-500 py-8">Chưa có khách hàng</p>}
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
      )}

      {tab === 'employees' && (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="w-10 px-2 py-3 text-center">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 cursor-pointer" checked={selectedIds.length === pagedEmployees.length && pagedEmployees.length > 0} onChange={() => toggleSelectAll(pagedEmployees.map(e => e.maNguoiDung))} />
                  </th>
                  {[
                    { key: 'hoTen', label: 'Nhân viên', align: 'text-left' },
                    { key: 'email', label: 'Email', align: 'text-left' },
                    { key: 'soDienThoai', label: 'SĐT', align: 'text-left' },
                  ].map(({ key, label, align }) => (
                    <th key={key} className={`${align} px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-gray-900 select-none`} onClick={() => toggleSort(key)}>
                      <span className="inline-flex items-center gap-1">{label} {sortField === key ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 text-gray-300" />}</span>
                    </th>
                  ))}
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Vai trò</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pagedEmployees.map((e) => (
                  <tr key={e.maNguoiDung} className={`hover:bg-gray-50 ${selectedIds.includes(e.maNguoiDung) ? 'bg-blue-50/50' : ''}`}>
                    <td className="w-10 px-2 py-3 text-center">
                      <input type="checkbox" className="h-4 w-4 rounded border-gray-300 cursor-pointer" checked={selectedIds.includes(e.maNguoiDung)} onChange={() => toggleSelect(e.maNguoiDung)} />
                    </td>
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
                        <button onClick={() => handleToggleEmployee(e.maNguoiDung)} className={`p-1.5 rounded-lg ${e.trangThai === 1 ? 'text-red-500 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}>
                          {e.trangThai === 1 ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagedEmployees.length === 0 && <p className="text-center text-gray-500 py-8">Chưa có nhân viên</p>}
          {empTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t">
              <button disabled={empPage === 0} onClick={() => setEmpPage(empPage - 1)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-100 disabled:opacity-40">Trước</button>
              {Array.from({ length: empTotalPages }, (_, i) => (
                <button key={i} onClick={() => setEmpPage(i)} className={`px-3 py-1.5 text-xs rounded-lg border ${i === empPage ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'}`}>{i + 1}</button>
              ))}
              <button disabled={empPage >= empTotalPages - 1} onClick={() => setEmpPage(empPage + 1)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-100 disabled:opacity-40">Sau</button>
            </div>
          )}
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-lg mb-4">Chi tiết khách hàng</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2"><span className="font-medium">Họ tên:</span><span>{detail.hoTen}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="font-medium">Email:</span><span>{detail.email}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="font-medium">SĐT:</span><span>{detail.soDienThoai || '-'}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="font-medium">Giới tính:</span><span>{detail.gioiTinh === true ? 'Nam' : detail.gioiTinh === false ? 'Nữ' : '-'}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="font-medium">Ngày sinh:</span><span>{detail.ngaySinh ? new Date(detail.ngaySinh).toLocaleDateString('vi-VN') : '-'}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="font-medium">Ngày tạo:</span><span>{detail.ngayTao ? new Date(detail.ngayTao).toLocaleDateString('vi-VN') : '-'}</span></div>
              <div className="flex justify-between pb-2"><span className="font-medium">Trạng thái:</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${detail.trangThai === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                  {detail.trangThai === 1 ? 'Hoạt động' : 'Đã khóa'}
                </span>
              </div>
            </div>
            <button onClick={() => setDetail(null)} className="mt-6 w-full border rounded-lg py-2 text-sm font-semibold hover:bg-gray-50">Đóng</button>
          </div>
        </div>
      )}

      {confirmToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirmToggle(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Xác nhận</h3>
            <p className="text-sm text-gray-600 mb-4">Thay đổi trạng thái khách hàng này?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmToggle(null)} className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-gray-50">Hủy</button>
              <button onClick={handleToggleCustomer} className="flex-1 py-2.5 bg-blue-700 text-white rounded-xl text-sm font-medium hover:bg-blue-800">Xác nhận</button>
            </div>
          </div>
        </div>
      )}

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
