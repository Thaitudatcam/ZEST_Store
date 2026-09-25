import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getCustomers, toggleCustomerStatus, getEmployees, createEmployee, updateEmployee, toggleEmployeeStatus, getCustomerAddresses, addCustomerAddress, setDefaultCustomerAddress, deleteCustomerAddress, createCustomer } from '../../api/admin'
import { Search, Eye, Plus, Pencil, X, RefreshCw, Download, MapPin, Trash2, Star } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'
import { getProvinces, getDistricts, getWards } from '../../api/address'

export default function AdminUsers() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const tab = pathname.includes('employees') ? 'employees' : 'customers'
  const [customers, setCustomers] = useState([])
  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [genderFilter, setGenderFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [error, setError] = useState('')
  const [detail, setDetail] = useState(null)
  const [confirmToggle, setConfirmToggle] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ hoTen: '', email: '', soDienThoai: '', matKhau: '', choPhepBanHang: true })
  const [page, setPage] = useState(0)
  const [empPage, setEmpPage] = useState(0)
  const [pageSize, setPageSize] = useState(5)
  const [empPageSize, setEmpPageSize] = useState(5)
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState('asc')
  const [confirmEmpToggle, setConfirmEmpToggle] = useState(null)
  const [confirmSave, setConfirmSave] = useState(false)
  const [showCustForm, setShowCustForm] = useState(false)
  const [custForm, setCustForm] = useState({ hoTen: '', email: '', soDienThoai: '', matKhau: '' })

  // Address modal state
  const [addrModal, setAddrModal] = useState(false)
  const [addrCustomer, setAddrCustomer] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [addrLoading, setAddrLoading] = useState(false)
  const [addrForm, setAddrForm] = useState({ tenNguoiNhan: '', soDienThoai: '', tinhThanhPho: '', quanHuyen: '', phuongXa: '', chiTietDiaChi: '', laMacDinh: false })
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [wards, setWards] = useState([])
  const [addrProvinceId, setAddrProvinceId] = useState(0)
  const [addrDistrictId, setAddrDistrictId] = useState(0)
  const [addrWardCode, setAddrWardCode] = useState('')
  const [confirmAddrDelete, setConfirmAddrDelete] = useState(null)

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

  useEffect(() => { loadCustomers() }, [])
  useEffect(() => { loadEmployees() }, [])

  const filteredCustomers = customers.filter((c) => {
    const matchSearch = !search || (c.hoTen || '').toLowerCase().includes(search.toLowerCase()) || (c.email || '').toLowerCase().includes(search.toLowerCase()) || (c.soDienThoai || '').includes(search)
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' && c.trangThai === 1) || (statusFilter === 'locked' && c.trangThai !== 1)
    const matchGender = genderFilter === 'all' || (genderFilter === 'male' && c.gioiTinh === true) || (genderFilter === 'female' && c.gioiTinh === false)
    return matchSearch && matchStatus && matchGender
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

  // Address modal functions
  const openAddressModal = async (customer) => {
    setAddrCustomer(customer)
    setAddrForm({ tenNguoiNhan: customer.hoTen || '', soDienThoai: customer.soDienThoai || '', tinhThanhPho: '', quanHuyen: '', phuongXa: '', chiTietDiaChi: '', laMacDinh: false })
    setAddrProvinceId(0); setAddrDistrictId(0); setAddrWardCode(''); setDistricts([]); setWards([])
    setAddrModal(true)
    try {
      const addrs = await getCustomerAddresses(customer.maNguoiDung)
      setAddresses(addrs || [])
    } catch { setAddresses([]) }
    try {
      const provs = await getProvinces()
      setProvinces(provs || [])
    } catch { setProvinces([]) }
  }

  useEffect(() => {
    if (addrProvinceId) {
      setAddrDistrictId(0); setAddrWardCode(''); setWards([])
      getDistricts(addrProvinceId).then(setDistricts).catch(() => setDistricts([]))
    }
  }, [addrProvinceId])

  useEffect(() => {
    if (addrDistrictId) {
      setAddrWardCode('')
      getWards(addrDistrictId).then(setWards).catch(() => setWards([]))
    }
  }, [addrDistrictId])

  const handleAddAddress = async () => {
    if (!addrCustomer) return
    setAddrLoading(true)
    try {
      await addCustomerAddress(addrCustomer.maNguoiDung, addrForm)
      setAddrForm({ tenNguoiNhan: addrCustomer.hoTen || '', soDienThoai: addrCustomer.soDienThoai || '', tinhThanhPho: '', quanHuyen: '', phuongXa: '', chiTietDiaChi: '', laMacDinh: false })
      setAddrProvinceId(0); setAddrDistrictId(0); setAddrWardCode('')
      const addrs = await getCustomerAddresses(addrCustomer.maNguoiDung)
      setAddresses(addrs || [])
    } catch { setError('Thêm địa chỉ thất bại') }
    finally { setAddrLoading(false) }
  }

  const handleSetDefaultAddr = async (addressId) => {
    if (!addrCustomer) return
    try {
      await setDefaultCustomerAddress(addrCustomer.maNguoiDung, addressId)
      const addrs = await getCustomerAddresses(addrCustomer.maNguoiDung)
      setAddresses(addrs || [])
    } catch { setError('Cập nhật thất bại') }
  }

  const handleDeleteAddr = async (addressId) => {
    setConfirmAddrDelete(null)
    if (!addrCustomer) return
    try {
      await deleteCustomerAddress(addrCustomer.maNguoiDung, addressId)
      const addrs = await getCustomerAddresses(addrCustomer.maNguoiDung)
      setAddresses(addrs || [])
    } catch { setError('Xóa địa chỉ thất bại') }
  }

  const openCreate = () => {
    if (tab === 'customers') {
      setCustForm({ hoTen: '', email: '', soDienThoai: '', matKhau: '' })
      setShowCustForm(true)
    } else {
      setEditing(null); setForm({ hoTen: '', email: '', soDienThoai: '', matKhau: '', choPhepBanHang: true }); setShowForm(true)
    }
  }

  const handleCreateCustomer = async () => {
    setConfirmSave(false)
    try {
      await createCustomer(custForm)
      setShowCustForm(false); setError(''); loadCustomers()
    } catch (err) { setError(err.response?.data?.message || 'Thao tác thất bại') }
  }

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

  useEffect(() => { setPage(0); setEmpPage(0) }, [search, statusFilter, roleFilter, genderFilter])
  const sortedCustomers = sortData(filteredCustomers)
  const sortedEmployees = sortData(filteredEmployees)
  const totalPages = Math.ceil(sortedCustomers.length / pageSize)
  const empTotalPages = Math.ceil(sortedEmployees.length / empPageSize)
  const pagedCustomers = sortedCustomers.slice(page * pageSize, (page + 1) * pageSize)
  const pagedEmployees = sortedEmployees.slice(empPage * empPageSize, (empPage + 1) * empPageSize)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {tab === 'employees' ? 'QUẢN LÝ NHÂN VIÊN' : 'Quản lý tài khoản / Quản lý khách hàng'}
        </h1>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, sđt, email"
            className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm w-full focus:outline-none focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)]/30" />
        </div>
        {tab === 'customers' && (
          <>
            <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary-color)]">
              <option value="all">Giới tính (Tất cả)</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary-color)]">
              <option value="all">Trạng thái (Tất cả)</option>
              <option value="active">Hoạt động</option>
              <option value="locked">Ngừng hoạt động</option>
            </select>
          </>
        )}
        {tab === 'employees' && (
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary-color)]">
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="locked">Đã khóa</option>
          </select>
        )}
        {tab === 'customers' && (
          <>
            <button onClick={loadCustomers}
              className="flex items-center gap-2 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              <RefreshCw className="h-4 w-4" /> Làm mới
            </button>
            <button className="flex items-center gap-2 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              <Download className="h-4 w-4" /> Xuất Excel
            </button>
            <button onClick={openCreate}
              className="flex items-center gap-2 bg-[var(--primary-color)] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition">
              <Plus className="h-4 w-4" /> Thêm mới
            </button>
          </>
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
            <button onClick={() => navigate('/admin/employees/create')}
              className="flex items-center gap-2 bg-[var(--primary-color)] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition">
              <Plus className="h-4 w-4" /> Thêm nhân viên
            </button>
          </>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

      {tab === 'customers' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 text-xs uppercase">STT</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 text-xs uppercase">MÃ KH</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">HỌ TÊN</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">SĐT</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">EMAIL</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">ĐỊA CHỈ</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 text-xs uppercase">GIỚI TÍNH</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 text-xs uppercase">TRẠNG THÁI</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 text-xs uppercase">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedCustomers.map((c, idx) => (
                  <tr key={c.maNguoiDung} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-center text-gray-500">{page * pageSize + idx + 1}</td>
                    <td className="px-4 py-3 text-center font-medium text-gray-700">{c.maNguoiDungCode || `KH${String(c.maNguoiDung).padStart(3, '0')}`}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{c.hoTen}</td>
                    <td className="px-4 py-3 text-gray-700">{c.soDienThoai || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{c.email}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate" title={c.diaChi}>{c.diaChi || 'Chưa cập nhật'}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{c.gioiTinh === true ? 'Nam' : c.gioiTinh === false ? 'Nữ' : 'N/A'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        c.trangThai === 1 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'
                      }`}>
                        {c.trangThai === 1 ? 'Hoạt động' : 'Ngừng hoạt động'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => setDetail(c)} className="p-1.5 text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 rounded-lg transition" title="Xem chi tiết">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => openAddressModal(c)} className="p-1.5 text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 rounded-lg transition" title="Địa chỉ">
                          <MapPin className="h-4 w-4" />
                        </button>
                        <button onClick={() => setConfirmToggle(c.maNguoiDung)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            c.trangThai === 1 ? 'bg-[var(--primary-color)]' : 'bg-gray-300'
                          }`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            c.trangThai === 1 ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
</div>
            {pagedCustomers.length === 0 && <p className="text-center text-gray-400 py-8">Chưa có khách hàng</p>}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Hiển thị {pagedCustomers.length > 0 ? page * pageSize + 1 : 0} - {Math.min((page + 1) * pageSize, sortedCustomers.length)} trên tổng số {sortedCustomers.length} khách hàng
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Hiển thị</span>
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                  className="text-sm font-medium border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[var(--primary-color)]">
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-gray-500">dòng</span>
              </div>
            </div>
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
                      <td className="px-4 py-3 text-center text-gray-500">{empPage * empPageSize + idx + 1}</td>
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
              Hiển thị {pagedEmployees.length > 0 ? empPage * empPageSize + 1 : 0} - {Math.min((empPage + 1) * empPageSize, sortedEmployees.length)} trên tổng số {sortedEmployees.length} nhân viên
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Hiển thị</span>
              <select value={empPageSize} onChange={(e) => { setEmpPageSize(Number(e.target.value)); setEmpPage(0); }}
                className="text-sm font-medium border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[var(--primary-color)]">
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
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

      {/* Address Management Modal */}
      {addrModal && addrCustomer && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setAddrModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-gray-800">Sổ địa chỉ khách hàng</h2>
                  <p className="text-sm text-gray-500">{addrCustomer.hoTen} • {addrCustomer.maNguoiDungCode || `KH${String(addrCustomer.maNguoiDung).padStart(3, '0')}`}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openAddressModal(addrCustomer)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button onClick={() => setAddrModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Address list */}
              <div>
                <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-[var(--primary-color)] rounded-full inline-block" />
                  Danh sách địa chỉ
                </h3>
                {addresses.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4">Chưa có địa chỉ</p>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((a, idx) => (
                      <div key={a.maDiaChi} className="border border-gray-200 rounded-xl p-3 hover:border-[var(--primary-color)]/30 transition">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-gray-400">{idx + 1}</span>
                              <p className="text-sm font-medium text-gray-800 truncate">{a.chiTietDiaChi}{a.tinhThanhPho ? `, ${a.tinhThanhPho}` : ''}</p>
                            </div>
                            <p className="text-xs text-gray-500 ml-5">{a.tenNguoiNhan} • SĐT: {a.soDienThoai}</p>
                            {a.laMacDinh && (
                              <span className="ml-5 mt-1 inline-block text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Mặc định</span>
                            )}
                          </div>
                          <div className="flex gap-1 ml-2">
                            {!a.laMacDinh && (
                              <button onClick={() => handleSetDefaultAddr(a.maDiaChi)} className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition" title="Đặt mặc định">
                                <Star className="h-4 w-4" />
                              </button>
                            )}
                            <button onClick={() => setConfirmAddrDelete(a.maDiaChi)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Xóa">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Add address form */}
              <div>
                <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-[var(--primary-color)] rounded-full inline-block" />
                  Thêm nhanh địa chỉ
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Họ tên người nhận *</label>
                      <input value={addrForm.tenNguoiNhan} onChange={(e) => setAddrForm({ ...addrForm, tenNguoiNhan: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary-color)]" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Số điện thoại *</label>
                      <input value={addrForm.soDienThoai} onChange={(e) => setAddrForm({ ...addrForm, soDienThoai: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary-color)]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Thành phố/Tỉnh *</label>
                      <select value={addrProvinceId} onChange={(e) => {
                        const id = Number(e.target.value); setAddrProvinceId(id)
                        const name = e.target.options[e.target.selectedIndex]?.text || ''
                        setAddrForm({ ...addrForm, tinhThanhPho: name })
                      }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary-color)]">
                        <option value={0}>Chọn hoặc nhập tỉnh/thành</option>
                        {provinces.map((p) => <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Quận/Huyện *</label>
                      <select value={addrDistrictId} onChange={(e) => {
                        const id = Number(e.target.value); setAddrDistrictId(id)
                        const name = e.target.options[e.target.selectedIndex]?.text || ''
                        setAddrForm({ ...addrForm, quanHuyen: name })
                      }} disabled={!addrProvinceId} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary-color)] disabled:bg-gray-50">
                        <option value={0}>Chọn hoặc nhập quận/huyện</option>
                        {districts.map((d) => <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Phường/Xã *</label>
                      <select value={addrWardCode} onChange={(e) => {
                        setAddrWardCode(e.target.value)
                        const name = e.target.options[e.target.selectedIndex]?.text || ''
                        setAddrForm({ ...addrForm, phuongXa: name })
                      }} disabled={!addrDistrictId} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary-color)] disabled:bg-gray-50">
                        <option value="">Chọn hoặc nhập phường/xã</option>
                        {wards.map((w) => <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Địa chỉ cụ thể *</label>
                      <input value={addrForm.chiTietDiaChi} onChange={(e) => setAddrForm({ ...addrForm, chiTietDiaChi: e.target.value })}
                        placeholder="Số nhà, đường..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary-color)]" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={addrForm.laMacDinh} onChange={(e) => setAddrForm({ ...addrForm, laMacDinh: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]" />
                    <span className="text-gray-700">Đặt làm địa chỉ mặc định</span>
                  </label>
                  <button onClick={handleAddAddress} disabled={addrLoading || !addrForm.tenNguoiNhan || !addrForm.chiTietDiaChi}
                    className="w-full bg-gray-800 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    {addrLoading ? 'Đang thêm...' : 'Thêm nhanh'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmAddrDelete !== null}
        title="Xóa địa chỉ"
        message="Bạn chắc chắn muốn xóa địa chỉ này?"
        confirmText="Xóa"
        onConfirm={() => handleDeleteAddr(confirmAddrDelete)}
        onCancel={() => setConfirmAddrDelete(null)}
      />

      {showCustForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCustForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Thêm khách hàng mới</h2>
              <button onClick={() => setShowCustForm(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Họ tên *</label>
                <input value={custForm.hoTen} onChange={(e) => setCustForm({ ...custForm, hoTen: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={custForm.email} onChange={(e) => setCustForm({ ...custForm, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Số điện thoại</label>
                <input value={custForm.soDienThoai} onChange={(e) => setCustForm({ ...custForm, soDienThoai: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Mật khẩu</label>
                <input type="password" value={custForm.matKhau} onChange={(e) => setCustForm({ ...custForm, matKhau: e.target.value })}
                  placeholder="Để trống sẽ dùng mặc định: customer123"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { if (!custForm.hoTen.trim()) { setError('Họ tên không được để trống'); return } handleCreateCustomer() }}
                  className="bg-[var(--primary-color)] text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90">Tạo</button>
                <button onClick={() => setShowCustForm(false)} className="border border-gray-300 px-6 py-2 rounded-lg font-semibold hover:bg-gray-50">Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
