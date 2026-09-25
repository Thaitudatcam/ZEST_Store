import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../../api/axios'
import InvoicePrint from '../../components/InvoicePrint'
import { useAuth } from '../../context/AuthContext'

export default function AdminInvoiceDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [voiding, setVoiding] = useState(false)
  const [reason, setReason] = useState('')
  const [printRequested, setPrintRequested] = useState(false)
  const load = () => api.get(`/admin/invoices/${id}`).then(r => setData(r.data))
  useEffect(() => {
    let active = true
    setData(null)
    setError('')
    setVoiding(false)
    setReason('')
    api.get(`/admin/invoices/${id}`)
      .then(r => { if (active) setData(r.data) })
      .catch(() => { if (active) setError('Không tải được hóa đơn') })
    return () => { active = false }
  }, [id])
  useEffect(() => {
    if (!printRequested) return
    const timer = setTimeout(() => { window.print(); setPrintRequested(false) }, 100)
    return () => clearTimeout(timer)
  }, [printRequested])
  const print = async () => {
    setBusy(true)
    try { const r = await api.post(`/admin/invoices/${id}/print`); setData(r.data); setPrintRequested(true); setError('') }
    catch (e) { setError(e.response?.data?.message || 'Không thể in hóa đơn') }
    finally { setBusy(false) }
  }
  const voidInvoice = async () => {
    setBusy(true)
    try { await api.post(`/admin/invoices/${id}/void`, { reason }); await load(); setVoiding(false); setError('') }
    catch (e) { setError(e.response?.data?.message || 'Không thể hủy hóa đơn') }
    finally { setBusy(false) }
  }
  const invoice = data?.invoice
  const isAdmin = user?.vaiTro === 'ADMIN' || user?.vaiTro?.tenVaiTro === 'ADMIN' || user?.role === 'ADMIN'
  return <div className="max-w-4xl mx-auto space-y-4 pb-8">
    <div className="flex flex-wrap gap-3 items-center print:hidden">
      <Link to="/admin/invoices" className="underline">← Danh sách hóa đơn</Link>
      {invoice && <><Link to={`/admin/orders/${invoice.orderId}`} className="underline">Xem đơn {invoice.orderCode}</Link>
        <button disabled={busy} onClick={print} className="bg-gold rounded-lg px-4 py-2 disabled:opacity-40">In hóa đơn</button>
        {isAdmin && invoice.status !== 'VOID' && <button disabled={busy} onClick={() => setVoiding(true)} className="text-bordeaux border rounded-lg px-4 py-2">Hủy hóa đơn</button>}</>}
    </div>
    {error && <p role="alert" className="text-bordeaux">{error}</p>}
    {!data ? !error && <p>Đang tải…</p> : <><div className="text-sm text-stone print:hidden">Ngày lập: {new Date(invoice.issuedAt).toLocaleString('vi-VN')} · Người lập: {invoice.issuedBy} · Số lần yêu cầu in: {invoice.printCount}</div>
      {invoice.status === 'VOID' && <p className="text-bordeaux print:hidden">Hủy bởi {invoice.voidedBy} lúc {new Date(invoice.voidedAt).toLocaleString('vi-VN')}: {invoice.voidReason}</p>}
      <div className="bg-white rounded-xl border"><InvoicePrint data={data} /></div></>}
    {voiding && <div role="dialog" aria-modal="true" aria-labelledby="void-title" className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center p-4 print:hidden"><div className="bg-white rounded-xl p-6 w-full max-w-md space-y-3">
      <h2 id="void-title" className="font-bold text-lg">Hủy hóa đơn {invoice.code}?</h2>
      {error && <p role="alert" className="text-bordeaux">{error}</p>}
      <p className="text-sm">Thao tác này lưu lịch sử hủy chứng từ, không tự hoàn tiền hoặc thay đổi đơn hàng.</p>
      <label className="block text-sm">Lý do hủy<textarea maxLength={500} value={reason} onChange={e => setReason(e.target.value)} className="mt-1 w-full border rounded-lg p-2" /></label>
      <div className="flex gap-3"><button disabled={busy} onClick={() => setVoiding(false)} className="border rounded-lg p-2">Quay lại</button><button disabled={busy || !reason.trim()} onClick={voidInvoice} className="bg-bordeaux text-white rounded-lg p-2 disabled:opacity-40">{busy ? 'Đang xử lý…' : 'Xác nhận hủy'}</button></div>
    </div></div>}
  </div>
}
