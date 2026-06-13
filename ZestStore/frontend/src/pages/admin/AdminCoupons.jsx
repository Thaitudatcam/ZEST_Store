import { useState, useEffect } from 'react'
import { getCoupons, createCoupon, deleteCoupon } from '../../api/admin'
import { Plus, Trash2 } from 'lucide-react'

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ maCode: '', kieuGiamGia: 'PERCENT', giaTriGiam: '', giaTriDonToiThieu: '', ngayBatDau: '', ngayKetThuc: '' })

  const load = () => getCoupons().then(setCoupons).catch(() => {})
  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createCoupon({
        maCode: form.maCode,
        kieuGiamGia: form.kieuGiamGia,
        giaTriGiam: Number(form.giaTriGiam),
        giaTriDonToiThieu: form.giaTriDonToiThieu ? Number(form.giaTriDonToiThieu) : null,
        ngayBatDau: form.ngayBatDau || null,
        ngayKetThuc: form.ngayKetThuc || null,
      })
      setShowForm(false); setForm({ maCode: '', kieuGiamGia: 'PERCENT', giaTriGiam: '', giaTriDonToiThieu: '', ngayBatDau: '', ngayKetThuc: '' }); load()
    } catch { alert('Lỗi tạo coupon') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Xóa mã này?')) return
    try { await deleteCoupon(id); load() } catch {}
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mã giảm giá</h1>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Thêm mã
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Mã</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Giảm</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {coupons.map((c) => (
                  <tr key={c.maPhieuGiamGia} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-semibold text-blue-700">{c.maCode}</td>
                    <td className="px-4 py-3 text-center">
                      {c.kieuGiamGia === 'PERCENT' ? `${c.giaTriGiam}%` : VND(c.giaTriGiam)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${c.trangThai === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                        {c.trangThai === 'active' ? 'Đang chạy' : 'Tắt'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleDelete(c.maPhieuGiamGia)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {coupons.length === 0 && <p className="text-center text-gray-500 py-8">Chưa có mã giảm giá</p>}
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 h-fit">
            <h2 className="font-semibold mb-4">Thêm mã giảm giá</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input value={form.maCode} onChange={(e) => setForm({ ...form, maCode: e.target.value.toUpperCase() })} placeholder="Mã code" required className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <select value={form.kieuGiamGia} onChange={(e) => setForm({ ...form, kieuGiamGia: e.target.value })} className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="PERCENT">Giảm theo %</option>
                <option value="FIXED">Giảm tiền mặt</option>
              </select>
              <input type="number" value={form.giaTriGiam} onChange={(e) => setForm({ ...form, giaTriGiam: e.target.value })} placeholder={form.kieuGiamGia === 'PERCENT' ? 'Phần trăm giảm (vd: 10)' : 'Số tiền giảm'} required className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="number" value={form.giaTriDonToiThieu} onChange={(e) => setForm({ ...form, giaTriDonToiThieu: e.target.value })} placeholder="Giá trị đơn tối thiểu" className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-500">Ngày bắt đầu</label><input type="date" value={form.ngayBatDau} onChange={(e) => setForm({ ...form, ngayBatDau: e.target.value })} className="w-full border rounded-lg px-4 py-2 mt-1" /></div>
                <div><label className="text-xs text-gray-500">Ngày kết thúc</label><input type="date" value={form.ngayKetThuc} onChange={(e) => setForm({ ...form, ngayKetThuc: e.target.value })} className="w-full border rounded-lg px-4 py-2 mt-1" /></div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">Tạo</button>
                <button type="button" onClick={() => setShowForm(false)} className="border px-6 py-2 rounded-lg font-semibold hover:bg-gray-50">Hủy</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

function VND(n) { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }
