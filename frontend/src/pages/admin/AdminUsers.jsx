import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getCustomers, toggleCustomerStatus, getEmployees, createEmployee, updateEmployee, toggleEmployeeStatus } from '../../api/admin'
import { Search, Eye, Lock, Unlock, Plus, Pencil, X, Filter, Users, UserCheck, UserX, CheckCircle, XCircle, ArrowUpDown, ChevronUp, ChevronDown, RefreshCw, Download } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'

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
  const [form, setForm] = useState({ hoTen: '', email: '', soDienThoai: '', matKhau: '', choPhepBanHang: true })
  const [page, setPage] = useState(0)
  const [empPage, setEmpPage] = useState(0)
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState('asc')
  const [selectedIds, setSelectedIds] = useState([])
  const [confirmBulk, setConfirmBulk] = useState(null)
  const [confirmEmpToggle, setConfirmEmpToggle] = useState(null)
  const [confirmSave, setConfirmSave] = useState(false)
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
    setConfirmEmpToggle(null)
    try { await toggleEmployeeStatus(id); setError(''); loadEmployees() }
    catch { setError('Cập nhật thất bại') }
  }

  const openCreate = () => { setEditing(null); setForm({ hoTen: '', email: '', soDienThoai: '', matKhau: '', choPhepBanHang: true }); setShowForm(true) }

  const openEdit = (emp) => {
    setEditing(emp)
    setForm({ hoTen: emp.hoTen, email: emp.email, soDienThoai: emp.soDienThoai || '', matKhau: '', vaiTro: emp.vaiTro || 'STAFF', choPhepBanHang: emp.choPhepBanHang ?? true })
    setShowForm(true)
  }

  const handleSubmit = async () => {
    setConfirmSave(false)
    try {
      if (editing) {
        const payload = { ...form }
        if (!payload.matKhau) delete payload.matKhau
        await updateEmployee(editing.maNguoiDung, payload)
      } else {
        await createEmployee({ ...form, vaiTro: 'STAFF' })
      }
      setShowForm(false); setEditing(null); setError(''); loadEmployees()
    } catch (err) { setError(err.response?.data?.message || 'Thao tác thất bại') }
  }

  const requestSave = (e) => {
    e.preventDefault()
    setConfirmSave(true)
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {tab === 'employees' ? 'QUẢN LÝ NHÂN VIÊN' : 'Quản lý người dùng'}
        </h1>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'employees' ? 'Tìm theo tên, mã, email, sdt' : 'Tìm khách hàng...'}
            className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm w-full focus:outline-none focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)]/30" />
        </div>
        {tab === 'employees' && (
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary-color)]">
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="locked">Đã khóa</option>
          </select>
        )}
        {tab === 'employees' && (
          <>
            <button onClick={loadEmployees}
              className="flex items-center gap-2 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              <RefreshCw className="h-4 w-4" /> Làm mới
            </button>
            <button className="flex items-center gap-2 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              <Download className="h-4 w-4" /> Xuất Excel
            </button>
            <button onClick={openCreate}
              className="flex items-center gap-2 bg-[var(--primary-color)] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition">
              <Plus className="h-4 w-4" /> Thêm nhân viên
            </button>
          </>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

      {tab === 'customers' && (
        <div className="bg-ivory rounded-2xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ivory-100 border-b">
                <tr>
                  <th className="w-10 px-2 py-3 text-center">
                    <input type="checkbox" className="h-4 w-4 rounded border-stone/30 cursor-pointer" checked={selectedIds.length === pagedCustomers.length && pagedCustomers.length > 0} onChange={() => toggleSelectAll(pagedCustomers.map(c => c.maNguoiDung))} />
                  </th>
                  {[
                    { key: 'hoTen', label: 'Khách hàng', align: 'text-left' },
                    { key: 'email', label: 'Email', align: 'text-left' },
                    { key: 'soDienThoai', label: 'SĐT', align: 'text-left' },
                    { key: 'ngayTao', label: 'Ngày tạo', align: 'text-center' },
                  ].map(({ key, label, align }) => (
                    <th key={key} className={`${align} px-4 py-3 font-semibold text-stone cursor-pointer hover:text-ink select-none`} onClick={() => toggleSort(key)}>
                      <span className="inline-flex items-center gap-1">{label} {sortField === key ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 text-stone" />}</span>
                    </th>
                  ))}
                  <th className="text-center px-4 py-3 font-semibold text-stone">Trạng thái</th>
                  <th className="text-center px-4 py-3 font-semibold text-stone">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pagedCustomers.map((c) => (
                  <tr key={c.maNguoiDung} className={`hover:bg-ivory-100 ${selectedIds.includes(c.maNguoiDung) ? 'bg-gold/10/50' : ''}`}>
                    <td className="w-10 px-2 py-3 text-center">
                      <input type="checkbox" className="h-4 w-4 rounded border-stone/30 cursor-pointer" checked={selectedIds.includes(c.maNguoiDung)} onChange={() => toggleSelect(c.maNguoiDung)} />
                    </td>
                    <td className="px-4 py-3 font-medium">{c.hoTen}</td>
                    <td className="px-4 py-3 text-stone">{c.email}</td>
                    <td className="px-4 py-3">{c.soDienThoai || '-'}</td>
                    <td className="px-4 py-3 text-center">{c.ngayTao ? new Date(c.ngayTao).toLocaleDateString('vi-VN') : '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${c.trangThai === 1 ? 'bg-emerald-deep/20 text-emerald-800' : 'bg-bordeaux/20 text-bordeaux'}`}>
                        {c.trangThai === 1 ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => setDetail(c)} className="p-1.5 text-gold hover:bg-gold/10 rounded-lg"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => setConfirmToggle(c.maNguoiDung)} className={`p-1.5 rounded-lg ${c.trangThai === 1 ? 'text-bordeaux hover:bg-bordeaux/10' : 'text-emerald-deep hover:bg-emerald-deep/10'}`}>
                          {c.trangThai === 1 ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagedCustomers.length === 0 && <p className="text-center text-stone py-8">Chưa có khách hàng</p>}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t">
              <button disabled={page === 0} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-ivory-100 disabled:opacity-40">Trước</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i)} className={`px-3 py-1.5 text-xs rounded-lg border ${i === page ? 'bg-gold text-noir border-gold' : 'hover:bg-ivory-100'}`}>{i + 1}</button>
              ))}
              <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-ivory-100 disabled:opacity-40">Sau</button>
            </div>
          )}
        </div>
      )}

      {tab === 'employees' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 text-xs uppercase">STT</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 text-xs uppercase">ẢNH</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 text-xs uppercase">MÃ NV</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">HỌ TÊN</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">EMAIL</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">SĐT</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">ĐỊA CHỈ</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 text-xs uppercase">CHỨC VỤ</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 text-xs uppercase">TRẠNG THÁI</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 text-xs uppercase">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedEmployees.map((e, idx) => {
                  const initials = (e.hoTen || '').split(' ').filter(Boolean).slice(-2).map(w => w[0]).join('').toUpperCase()
                  const avatarColors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500']
                  const colorIdx = (e.hoTen || '').charCodeAt(0) % avatarColors.length
                  return (
                    <tr key={e.maNguoiDung} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-center text-gray-500">{empPage * PAGE_SIZE + idx + 1}</td>
                      <td className="px-4 py-3 text-center">
                        <div className={`w-10 h-10 rounded-full ${avatarColors[colorIdx]} flex items-center justify-center text-white font-bold text-sm mx-auto`}>
                          {initials}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-gray-700">{e.maNV || `NV${String(e.maNguoiDung).padStart(3, '0')}`}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{e.hoTen}</td>
                      <td className="px-4 py-3 text-gray-500">{e.email}</td>
                      <td className="px-4 py-3 text-gray-700">{e.soDienThoai || '-'}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">{e.diaChi || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-medium text-gray-700">
                          {e.vaiTro === 'ADMIN' ? 'Quản lý' : 'Nhân viên'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => setConfirmEmpToggle(e.maNguoiDung)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            e.trangThai === 1 ? 'bg-[var(--primary-color)]' : 'bg-gray-300'
                          }`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            e.trangThai === 1 ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => openEdit(e)} className="p-1.5 text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 rounded-lg transition">
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {pagedEmployees.length === 0 && <p className="text-center text-gray-400 py-8">Chưa có nhân viên</p>}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Hiển thị {pagedEmployees.length > 0 ? empPage * PAGE_SIZE + 1 : 0} - {Math.min((empPage + 1) * PAGE_SIZE, sortedEmployees.length)} trên tổng số {sortedEmployees.length} nhân viên
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Hiển thị</span>
              <select value={PAGE_SIZE} className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none">
                <option value={10}>10</option>
              </select>
              <span className="text-sm text-gray-500">dòng</span>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="bg-ivory rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-lg mb-4">Chi tiết khách hàng</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2"><span className="font-medium">Họ tên:</span><span>{detail.hoTen}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="font-medium">Email:</span><span>{detail.email}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="font-medium">SĐT:</span><span>{detail.soDienThoai || '-'}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="font-medium">Giới tính:</span><span>{detail.gioiTinh === true ? 'Nam' : detail.gioiTinh === false ? 'Nữ' : '-'}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="font-medium">Ngày sinh:</span><span>{detail.ngaySinh ? new Date(detail.ngaySinh).toLocaleDateString('vi-VN') : '-'}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="font-medium">Ngày tạo:</span><span>{detail.ngayTao ? new Date(detail.ngayTao).toLocaleDateString('vi-VN') : '-'}</span></div>
              <div className="flex justify-between pb-2"><span className="font-medium">Trạng thái:</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${detail.trangThai === 1 ? 'bg-emerald-deep/20 text-emerald-800' : 'bg-bordeaux/20 text-bordeaux'}`}>
                  {detail.trangThai === 1 ? 'Hoạt động' : 'Đã khóa'}
                </span>
              </div>
            </div>
            <button onClick={() => setDetail(null)} className="mt-6 w-full border rounded-lg py-2 text-sm font-semibold hover:bg-ivory-100">Đóng</button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmToggle !== null}
        title="Xác nhận"
        message="Thay đổi trạng thái khách hàng này?"
        confirmText="Xác nhận"
        variant="gold"
        onConfirm={handleToggleCustomer}
        onCancel={() => setConfirmToggle(null)}
      />

      <ConfirmDialog
        open={confirmEmpToggle !== null}
        title="Xác nhận"
        message="Thay đổi trạng thái nhân viên này?"
        confirmText="Xác nhận"
        variant="gold"
        onConfirm={() => handleToggleEmployee(confirmEmpToggle)}
        onCancel={() => setConfirmEmpToggle(null)}
      />

      <ConfirmDialog
        open={confirmSave}
        title={editing ? 'Cập nhật nhân viên' : 'Thêm nhân viên'}
        message={`Bạn chắc chắn muốn ${editing ? 'cập nhật nhân viên' : 'thêm nhân viên'} "${form.hoTen}"?`}
        confirmText={editing ? 'Cập nhật' : 'Tạo'}
        variant="gold"
        onConfirm={handleSubmit}
        onCancel={() => setConfirmSave(false)}
      />

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-ivory rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">{editing ? 'Sửa nhân viên' : 'Thêm nhân viên'}</h2>
              <button onClick={() => setShowForm(false)} className="text-stone hover:text-stone"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={requestSave} className="space-y-4">
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
                <label className="text-sm font-medium text-ink-soft">Mật khẩu</label>
                <input type="password" value={form.matKhau} onChange={(e) => setForm({ ...form, matKhau: e.target.value })} required={!editing} placeholder={editing ? 'Để trống nếu không đổi' : ''} className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-gold" />
              </div>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={form.choPhepBanHang} onChange={(e) => setForm({ ...form, choPhepBanHang: e.target.checked })} />
                  <div className="w-10 h-5 bg-ivory-100 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-ivory after:border-stone/30 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gold"></div>
                </label>
                <span className="text-sm font-medium text-ink-soft">Cho phép bán tại quầy</span>
              </div>
              {editing && (
                <div>
                  <label className="text-sm font-medium text-ink-soft">Vai trò</label>
                  <select value={form.vaiTro} onChange={(e) => setForm({ ...form, vaiTro: e.target.value })} className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-gold">
                    <option value="STAFF">Nhân viên</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="bg-gold text-noir px-6 py-2 rounded-lg font-semibold hover:bg-gold-hover">{editing ? 'Cập nhật' : 'Tạo'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="border px-6 py-2 rounded-lg font-semibold hover:bg-ivory-100">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
