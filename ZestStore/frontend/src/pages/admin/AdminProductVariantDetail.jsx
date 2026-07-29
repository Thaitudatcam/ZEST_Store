import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../../api/axios'
import SafeImg from '../../components/SafeImg'
import { Search, Printer, X } from 'lucide-react'
import QRCode from 'qrcode'

const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

function QRCodeImg({ sku }) {
  const [dataUrl, setDataUrl] = useState(null)
  useEffect(() => {
    if (sku && sku !== '-') {
      QRCode.toDataURL(sku, { width: 160, margin: 1, color: { dark: '#000', light: '#fff' } }).then(setDataUrl).catch(() => {})
    }
  }, [sku])
  return dataUrl ? <img src={dataUrl} alt={sku} className="w-10 h-10" /> : <span className="text-xs text-stone">—</span>
}

export default function AdminProductVariantDetail() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterColor, setFilterColor] = useState('')
  const [filterSize, setFilterSize] = useState('')
  const [colors, setColors] = useState([])
  const [sizes, setSizes] = useState([])
  const [printItems, setPrintItems] = useState([])
  const [showPrintModal, setShowPrintModal] = useState(false)
  const printRef = useRef(null)

  useEffect(() => {
    Promise.all([
      api.get('/products/admin/variant-list').then(r => r.data),
      api.get('/colors').then(r => r.data),
      api.get('/sizes').then(r => r.data),
    ]).then(([rowsData, cl, sz]) => {
      setColors(Array.isArray(cl) ? cl : [])
      setSizes(Array.isArray(sz) ? sz : [])
      setRows(Array.isArray(rowsData) ? rowsData : [])
    }).catch(() => {})
    .finally(() => setLoading(false))
  }, [])

  const filtered = rows.filter(r => {
    if (search && !r.tenSanPham.toLowerCase().includes(search.toLowerCase())) return false
    if (filterColor && r.mauSac !== filterColor) return false
    if (filterSize && r.kichCo !== filterSize) return false
    return true
  })

  const togglePrintItem = (r) => {
    setPrintItems(prev => {
      const idx = prev.findIndex(p => p.sku === r.sku)
      if (idx >= 0) return prev.filter((_, i) => i !== idx)
      return [...prev, r]
    })
  }

  const handlePrintLabels = useCallback(() => {
    if (printItems.length === 0) return
    setShowPrintModal(true)
    setTimeout(async () => {
      const win = window.open('', '', 'width=500,height=400')
      if (!win) return
      win.document.write(`<html><head><title>In nhãn</title><style>
        body { margin: 0; padding: 10px; font-family: Arial, sans-serif; }
        .labels { display: flex; flex-wrap: wrap; gap: 8px; }
        .label { width: 220px; border: 1px solid #ccc; padding: 10px; text-align: center; page-break-inside: avoid; }
        .label img { display: block; margin: 0 auto; }
        .label p { margin: 2px 0; font-size: 11px; }
        .label .name { font-weight: bold; font-size: 12px; }
        .label .price { color: #2563eb; font-weight: bold; font-size: 12px; }
        .label .sku { font-size: 10px; color: #666; margin-top: 4px; }
        @media print { @page { margin: 5mm; } }
      </style></head><body><div class="labels">`)
      for (const item of printItems) {
        const url = await QRCode.toDataURL(item.sku, { width: 160, margin: 1, color: { dark: '#000', light: '#fff' } }).catch(() => null)
        win.document.write(`<div class="label">${url ? `<img src="${url}" alt="${item.sku}" />` : `<p>${item.sku}</p>`}<p class="name">${item.tenSanPham}</p><p>${item.mauSac || ''} ${item.kichCo || ''}</p><p class="price">${VND(item.gia)}</p><p class="sku">${item.sku}</p></div>`)
      }
      win.document.write('</div></body></html>')
      win.document.close()
      setTimeout(() => win.print(), 500)
    }, 100)
  }, [printItems])

  if (loading) return <div className="animate-pulse h-96 bg-ivory-100 rounded-2xl" />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sản phẩm chi tiết</h1>
        <div className="flex items-center gap-3">
          {printItems.length > 0 && (
            <span className="text-sm text-stone">Đã chọn {printItems.length}</span>
          )}
          <button onClick={handlePrintLabels} disabled={printItems.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gold text-noir text-sm font-semibold rounded-lg hover:bg-gold-hover transition disabled:opacity-50">
            <Printer className="h-4 w-4" /> In nhãn
          </button>
        </div>
      </div>

      <div className="bg-ivory rounded-2xl border p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-stone font-medium">Tìm kiếm</label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên sản phẩm..."
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
            </div>
          </div>
          <div>
            <label className="text-xs text-stone font-medium">Màu sắc</label>
            <select value={filterColor} onChange={(e) => setFilterColor(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-gold">
              <option value="">Tất cả màu</option>
              {colors.map(c => <option key={c.maMauSac} value={c.mauSac}>{c.mauSac}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-stone font-medium">Kích cỡ</label>
            <select value={filterSize} onChange={(e) => setFilterSize(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-gold">
              <option value="">Tất cả size</option>
              {sizes.map(s => <option key={s.maKichCo} value={s.kichCo}>{s.kichCo}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-ivory rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-ivory-100">
              <th className="text-left px-3 py-2 font-semibold text-stone">Sản phẩm</th>
              <th className="text-left px-3 py-2 font-semibold text-stone">Màu</th>
              <th className="text-left px-3 py-2 font-semibold text-stone">Size</th>
              <th className="text-center px-3 py-2 font-semibold text-stone">QR</th>
              <th className="text-right px-3 py-2 font-semibold text-stone">Giá</th>
              <th className="text-center px-3 py-2 font-semibold text-stone">Tồn kho</th>
              <th className="text-center px-3 py-2 font-semibold text-stone">Trạng thái</th>
              <th className="text-center px-3 py-2 font-semibold text-stone">In</th>
            </tr></thead>
            <tbody className="divide-y">
              {filtered.map((r, i) => {
                const selected = printItems.some(p => p.sku === r.sku)
                return (
                  <tr key={i} className={`hover:bg-ivory-100 transition ${selected ? 'bg-gold/10' : ''}`}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <SafeImg src={r.urlAnhDaiDien} className="w-10 h-10 rounded-lg object-cover bg-ivory-100 shrink-0"
                          fallback="https://placehold.co/40x40/e2e8f0/475569?text=P" />
                        <span className="font-medium truncate max-w-[200px]">{r.tenSanPham}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {r.maMauHex && <span className="w-4 h-4 rounded-full border shrink-0" style={{ backgroundColor: r.maMauHex }} />}
                        <span>{r.mauSac}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">{r.kichCo}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex justify-center">
                        <QRCodeImg sku={r.sku} />
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">{VND(r.gia)}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.tonKho > 0 ? 'bg-emerald-deep/20 text-emerald-deep' : 'bg-bordeaux/20 text-bordeaux'}`}>
                        {r.tonKho}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.trangThai === 1 ? 'bg-emerald-deep/20 text-emerald-deep' : 'bg-ivory-100 text-stone'}`}>
                        {r.trangThai === 1 ? 'Hoạt động' : 'Ẩn'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => togglePrintItem(r)}
                        className={`p-1.5 rounded-lg transition ${selected ? 'bg-gold/20 text-gold' : 'text-stone hover:text-gold hover:bg-gold/10'}`}>
                        <Printer className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-stone">Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPrintModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 animate-fade-in"
          onClick={() => setShowPrintModal(false)}>
          <div className="bg-ivory rounded-2xl max-w-lg w-full mx-4 animate-scale-in"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg">In nhãn mã vạch</h3>
              <button onClick={() => setShowPrintModal(false)} className="text-stone hover:text-stone">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 text-sm text-stone">
              <p>Đã chọn <strong>{printItems.length}</strong> biến thể. Trang in sẽ mở ra, bạn chọn máy in và in nhãn.</p>
            </div>
            <div className="border-t p-4 flex gap-3">
              <button onClick={() => setShowPrintModal(false)}
                className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-ivory-100">Hủy</button>
              <button onClick={() => { setShowPrintModal(false); setTimeout(handlePrintLabels, 200) }}
                className="flex-1 py-2.5 bg-gold text-noir rounded-xl text-sm font-semibold hover:bg-gold-hover">In ngay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
