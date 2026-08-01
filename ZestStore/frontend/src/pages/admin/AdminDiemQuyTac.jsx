import { useState, useEffect } from 'react'
import { getDiemQuyTacAdmin, updateDiemQuyTac } from '../../api/admin'
import { Save, Coins, Loader2 } from 'lucide-react'

export default function AdminDiemQuyTac() {
  const [rules, setRules] = useState(null)
  const [form, setForm] = useState({ tiLeTich: '', tiLeDoi: '', thoiHanThang: '', diemToiThieu: '', giamToiDaPhanTram: '', tichTienMat: true })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const load = () => getDiemQuyTacAdmin()
    .then((r) => {
      setRules(r)
      setForm({
        tiLeTich: String(r.tiLeTich),
        tiLeDoi: String(r.tiLeDoi),
        thoiHanThang: String(r.thoiHanThang),
        diemToiThieu: String(r.diemToiThieu),
        giamToiDaPhanTram: String(r.giamToiDaPhanTram),
        tichTienMat: !!r.tichTienMat,
      })
    })
    .catch(() => setMessage({ type: 'error', text: 'Không tải được quy tắc điểm' }))

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const data = {
        tiLeTich: Number(form.tiLeTich),
        tiLeDoi: Number(form.tiLeDoi),
        thoiHanThang: Number(form.thoiHanThang),
        diemToiThieu: Number(form.diemToiThieu),
        giamToiDaPhanTram: Number(form.giamToiDaPhanTram),
        tichTienMat: !!form.tichTienMat,
      }
      const saved = await updateDiemQuyTac(data)
      setRules(saved)
      setMessage({ type: 'success', text: 'Đã lưu quy tắc sử dụng điểm' })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lưu thất bại' })
    } finally {
      setSaving(false)
    }
  }

  const field = (label, key, hint = '', min = 0, max) => (
    <label className="block">
      <span className="text-sm font-semibold text-stone">{label}</span>
      <input
        type="number"
        min={min}
        {...(max !== undefined ? { max } : {})}
        required
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="mt-1 w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold"
      />
      {hint && <span className="block text-xs text-stone mt-1">{hint}</span>}
    </label>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Quy tắc sử dụng điểm tích lũy</h1>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-gold text-noir px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gold-hover flex items-center gap-2 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Lưu quy tắc
        </button>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-bordeaux/10 text-bordeaux'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-ivory rounded-2xl shadow-sm border p-6 max-w-2xl">
        <div className="flex items-center gap-2 mb-5 text-gold">
          <Coins className="h-5 w-5" />
          <h2 className="font-bold text-lg text-noir">Thiết lập chung</h2>
        </div>
        {rules && (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {field('Tiền tích 1 điểm (VNĐ)', 'tiLeTich', 'Cứ mỗi X VNĐ giá trị đơn hàng hợp lệ, khách được 1 điểm', 1)}
            {field('Giá trị 1 điểm (VNĐ)', 'tiLeDoi', '1 điểm quy đổi thành X VNĐ khi thanh toán', 1)}
            {field('Thời hạn điểm (tháng)', 'thoiHanThang', 'Điểm hết hạn sau X tháng kể từ khi tích lũy', 1)}
            {field('Số điểm tối thiểu để sử dụng', 'diemToiThieu', 'Khách cần tối thiểu X điểm mới được trừ vào đơn', 0)}
            {field('Giảm tối đa (% giá trị hàng)', 'giamToiDaPhanTram', 'Điểm chỉ được giảm tối đa X% giá trị hàng hóa (sau khi trừ mã giảm giá)', 0, 100)}
            <div className="flex items-end pb-1">
              <button
                type="button"
                onClick={() => setForm({ ...form, tichTienMat: !form.tichTienMat })}
                className={`w-full flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium ${form.tichTienMat ? 'border-gold bg-gold/10 text-noir' : 'border-stone/30 text-stone'}`}
              >
                <span className="text-left">
                  <span className="block font-semibold">Tích điểm trên tiền mặt</span>
                  <span className="block text-xs text-stone mt-0.5">Không tích điểm trên phần thanh toán bằng điểm</span>
                </span>
                <span className={`ml-3 relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${form.tichTienMat ? 'bg-gold' : 'bg-stone/30'}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${form.tichTienMat ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </span>
              </button>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="flex-1 bg-gold text-noir py-3 rounded-xl text-sm font-semibold hover:bg-gold-hover disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Lưu quy tắc
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
