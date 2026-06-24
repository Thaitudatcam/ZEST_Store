import { useState, useEffect } from 'react'
import { getShippingFees, createShippingFee, updateShippingFee, deleteShippingFee } from '../../api/admin'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const PAGE_SIZE = 15

export default function AdminShipping() {
  const [fees, setFees] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ tenTinh: '', phiVanChuyen: '' })
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [page, setPage] = useState(0)

  const load = () => getShippingFees().then(setFees).catch(() => {})
  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = { tenTinh: form.tenTinh, phiVanChuyen: Number(form.phiVanChuyen) }
      if (editing) {
        await updateShippingFee(editing, data)
      } else {
        await createShippingFee(data)
      }
      setShowForm(false); setEditing(null); setForm({ tenTinh: '', phiVanChuyen: '' }); load()
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi')
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try { await deleteShippingFee(confirmDelete); setConfirmDelete(null); load() }
    catch { setConfirmDelete(null) }
  }

  const openEdit = (item) => {
    setEditing(item.maPhiVanChuyen)
    setForm({ tenTinh: item.tenTinh, phiVanChuyen: String(item.phiVanChuyen) })
    setShowForm(true)
  }

  const openCreate = () => {
    setEditing(null); setForm({ tenTinh: '', phiVanChuyen: '' }); setShowForm(true)
  }

  const totalPages = Math.ceil(fees.length / PAGE_SIZE)
  const paged = fees.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  useEffect(() => { setPage(0) }, [fees.length])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Phí vận chuyển</h1>
        <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Thêm tỉnh
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Tỉnh/Thành phố</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Phí vận chuyển</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.map((f) => (
                <tr key={f.maPhiVanChuyen} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{f.tenTinh}</td>
                  <td className="px-4 py-3 text-right font-mono">{VND(f.phiVanChuyen)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => openEdit(f)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setConfirmDelete(f.maPhiVanChuyen)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {paged.length === 0 && <p className="text-center text-gray-500 py-8">Chưa có dữ liệu phí vận chuyển</p>}
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

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => { setShowForm(false); setEditing(null) }}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-lg mb-4">{editing ? 'Cập nhật' : 'Thêm'} phí vận chuyển</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input value={form.tenTinh} onChange={(e) => setForm({ ...form, tenTinh: e.target.value })} placeholder="Tên tỉnh/thành phố" required
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="number" value={form.phiVanChuyen} onChange={(e) => setForm({ ...form, phiVanChuyen: e.target.value })} placeholder="Phí vận chuyển" required
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700">
                  {editing ? 'Cập nhật' : 'Thêm'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="flex-1 border py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Xác nhận</h3>
            <p className="text-sm text-gray-600 mb-4">Xóa phí vận chuyển này?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-gray-50">Hủy</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function VND(n) {
  try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) }
  catch { return n }
}
