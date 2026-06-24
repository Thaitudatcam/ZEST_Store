import { useState, useEffect } from 'react'
import { getCustomers, toggleCustomerStatus } from '../../api/admin'
import { Search, Eye, Lock, Unlock, Filter } from 'lucide-react'

const PAGE_SIZE = 20

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [error, setError] = useState('')
  const [detail, setDetail] = useState(null)
  const [page, setPage] = useState(0)
  const [confirmToggle, setConfirmToggle] = useState(null)

  const load = () => getCustomers().then(setCustomers).catch(() => setError('Không thể tải khách hàng'))
  useEffect(() => { load() }, [])

  const filtered = customers.filter((c) => {
    const matchSearch = !search || (c.hoTen || '').toLowerCase().includes(search.toLowerCase()) || (c.email || '').toLowerCase().includes(search.toLowerCase()) || (c.soDienThoai || '').includes(search)
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' && c.trangThai === 1) || (statusFilter === 'locked' && c.trangThai !== 1)
    return matchSearch && matchStatus
  })

  const handleToggle = async () => {
    if (!confirmToggle) return
    try { await toggleCustomerStatus(confirmToggle); setError(''); setConfirmToggle(null); load() }
    catch { setError('Cập nhật thất bại'); setConfirmToggle(null) }
  }

  useEffect(() => { setPage(0) }, [search, statusFilter])
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Quản lý khách hàng</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm khách hàng..." className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Filter className="h-4 w-4 text-gray-400" />
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

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Khách hàng</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">SĐT</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Ngày tạo</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.map((c) => (
                <tr key={c.maNguoiDung} className="hover:bg-gray-50">
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
        {paged.length === 0 && <p className="text-center text-gray-500 py-8">Chưa có khách hàng</p>}

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
              <button onClick={handleToggle} className="flex-1 py-2.5 bg-blue-700 text-white rounded-xl text-sm font-medium hover:bg-blue-800">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}