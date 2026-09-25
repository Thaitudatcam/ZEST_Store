import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { VND } from '../../components/ProductCard'

export default function AdminInvoices() {
  const [filters, setFilters] = useState({ q: '', status: '', from: '', to: '' })
  const [page, setPage] = useState(0)
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    setLoading(true)
    const timer = setTimeout(() => api.get('/admin/invoices', { params: { ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)), page, size: 20 } })
      .then(r => { if (active) { setData(r.data); setError('') } })
      .catch(e => { if (active) setError(e.response?.data?.message || 'Không tải được hóa đơn') })
      .finally(() => { if (active) setLoading(false) }), 250)
    return () => { active = false; clearTimeout(timer) }
  }, [filters, page])
  const change = (key, value) => { setFilters(old => ({ ...old, [key]: value })); setPage(0) }
  return <div className="max-w-7xl mx-auto space-y-5 pb-8">
    <header className="bg-noir text-ivory rounded-2xl p-6"><h1 className="text-2xl font-bold">Hóa đơn bán hàng</h1>
      <p className="text-sm mt-2">Chứng từ nội bộ đã lập cho đơn hoàn thành · Tra cứu và in lại</p></header>
    <div className="bg-white border rounded-xl p-4 grid sm:grid-cols-4 gap-3">
      <label className="text-sm">Tìm hóa đơn<input className="w-full border rounded-lg p-2 mt-1" placeholder="Mã HĐ, mã đơn, khách, người lập" value={filters.q} onChange={e => change('q', e.target.value)} /></label>
      <label className="text-sm">Trạng thái<select className="w-full border rounded-lg p-2 mt-1" value={filters.status} onChange={e => change('status', e.target.value)}><option value="">Tất cả</option><option value="ISSUED">Đã lập</option><option value="VOID">Đã hủy</option></select></label>
      <label className="text-sm">Lập từ ngày<input className="w-full border rounded-lg p-2 mt-1" type="date" value={filters.from} onChange={e => change('from', e.target.value)} /></label>
      <label className="text-sm">Đến ngày<input className="w-full border rounded-lg p-2 mt-1" type="date" value={filters.to} onChange={e => change('to', e.target.value)} /></label>
    </div>
    {error && <p role="alert" className="text-bordeaux">{error}</p>}
    <div className="bg-white rounded-xl border overflow-x-auto">
      <table className="w-full text-sm text-left"><thead className="bg-ivory"><tr>{['Mã hóa đơn', 'Đơn hàng', 'Ngày lập', 'Người lập', 'Khách hàng', 'Tổng tiền', 'Trạng thái'].map(t => <th key={t} className="p-4 whitespace-nowrap">{t}</th>)}</tr></thead>
        <tbody>{loading ? <tr><td colSpan={7} className="p-8 text-center">Đang tải…</td></tr> : error ? null : data.content.length ? data.content.map(i => <tr key={i.id} className="border-t">
          <td className="p-4"><Link className="font-bold text-gold underline" to={`/admin/invoices/${i.id}`}>{i.code}</Link></td>
          <td className="p-4"><Link to={`/admin/orders/${i.orderId}`} className="underline">{i.orderCode || `#${i.orderId}`}</Link></td>
          <td className="p-4 whitespace-nowrap">{new Date(i.issuedAt).toLocaleString('vi-VN')}</td><td className="p-4">{i.issuedBy}</td><td className="p-4">{i.customerName}</td>
          <td className="p-4 whitespace-nowrap">{VND(i.total)}</td><td className="p-4"><span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 ${i.status === 'VOID' ? 'bg-bordeaux/10 text-bordeaux' : 'bg-emerald-deep/10 text-emerald-deep'}`}>{i.status === 'VOID' ? 'Đã hủy' : 'Đã lập'}</span></td>
        </tr>) : <tr><td colSpan={7} className="p-8 text-center text-stone">Chưa có hóa đơn phù hợp.</td></tr>}</tbody></table>
    </div>
    <div className="flex justify-between items-center text-sm"><span>{data.totalElements} hóa đơn</span><div className="flex items-center gap-3">
      <button disabled={page === 0 || loading} onClick={() => setPage(p => p - 1)} className="border rounded-lg px-3 py-2 disabled:opacity-40">Trước</button>
      <span>Trang {page + 1} / {Math.max(1, data.totalPages)}</span>
      <button disabled={page + 1 >= data.totalPages || loading} onClick={() => setPage(p => p + 1)} className="border rounded-lg px-3 py-2 disabled:opacity-40">Sau</button>
    </div></div>
  </div>
}
