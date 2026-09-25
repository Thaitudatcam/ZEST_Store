import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

export default function OrderInvoiceLink({ orderId, status }) {
  const [invoice, setInvoice] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    setLoading(true)
    api.get(`/admin/invoices/order/${orderId}`).then(r => { if (active) { setInvoice(r.data.invoice || null); setError('') } })
      .catch(() => { if (active) setError('Không tải được thông tin hóa đơn. Vui lòng tải lại trang.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [orderId, status])
  const issue = async () => {
    setLoading(true)
    try { const r = await api.post(`/admin/invoices/order/${orderId}`); setInvoice(r.data); setError('') }
    catch (e) { setError(e.response?.data?.message || 'Không thể lập hóa đơn') }
    finally { setLoading(false) }
  }
  return <div className="my-4 rounded-xl border border-stone/20 bg-white p-4 text-sm">
    <p className="font-semibold mb-1">Hóa đơn bán hàng</p>
    {loading ? <p>Đang tải…</p> : invoice ? <Link className="text-gold font-semibold underline" to={`/admin/invoices/${invoice.id}`}>
      Xem hóa đơn {invoice.code}{invoice.status === 'VOID' ? ' (Đã hủy)' : ''}
    </Link> : status === 6 ? <button onClick={issue} className="bg-gold rounded-lg px-4 py-2">Lập hóa đơn cho đơn đã hoàn thành</button>
      : <p className="text-stone">Hóa đơn được tự động lập khi đơn hoàn thành.</p>}
    {error && <p role="alert" className="text-bordeaux mt-2">{error}</p>}
  </div>
}
