import { useState, useEffect, useRef, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import api from '../../api/axios'
import SafeImg from '../../components/SafeImg'
import { Search, Printer, X, Eye, ChevronLeft, ChevronRight, QrCode, Download, SlidersHorizontal } from 'lucide-react'
import QRCode from 'qrcode'
import * as XLSX from 'xlsx'

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
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterColor, setFilterColor] = useState('')
  const [filterSize, setFilterSize] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [colors, setColors] = useState([])
  const [sizes, setSizes] = useState([])
  const [printItems, setPrintItems] = useState([])
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [showDetail, setShowDetail] = useState(null)
  const [priceRange, setPriceRange] = useState([0, 0])
  const [maxPrice, setMaxPrice] = useState(0)
  const printRef = useRef(null)

  useEffect(() => {
    Promise.all([
      api.get('/products/admin/variant-list').then(r => r.data),
      api.get('/colors').then(r => r.data),
      api.get('/sizes').then(r => r.data),
    ]).then(([rowsData, cl, sz]) => {
      setColors(Array.isArray(cl) ? cl : [])
      setSizes(Array.isArray(sz) ? sz : [])
      const data = Array.isArray(rowsData) ? rowsData : []
      setRows(data)
      const prices = data.map(r => Number(r.gia) || 0)
      const mp = Math.max(...prices, 0)
      setMaxPrice(mp)
      setPriceRange([0, mp])
    }).catch(() => {})
    .finally(() => setLoading(false))
  }, [])

  const filtered = rows.filter(r => {
    if (search) {
      const q = search.toLowerCase()
      if (!(r.sku || '').toLowerCase().includes(q) && !(r.tenSanPham || '').toLowerCase().includes(q)) return false
    }
    if (filterColor && r.mauSac !== filterColor) return false
    if (filterSize && r.kichCo !== filterSize) return false
    if (filterStatus === 'active' && r.trangThai !== 1) return false
    if (filterStatus === 'hidden' && r.trangThai !== 0) return false
    const price = Number(r.gia) || 0
    if (price < priceRange[0] || price > priceRange[1]) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / rowsPerPage)
  const paged = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage)

  const togglePrintItem = (r) => {
    setPrintItems(prev => {
      const idx = prev.findIndex(p => p.sku === r.sku)
      if (idx >= 0) return prev.filter((_, i) => i !== idx)
      return [...prev, r]
    })
  }

  const handleToggleStatus = async (r) => {
    if (!r.maBienThe) { toast.warn('Biến thể chưa có mã'); return }
    try {
      const res = await api.patch(`/products/admin/variants/${r.maBienThe}/toggle-status`)
      setRows(prev => prev.map(row =>
        row.sku === r.sku ? { ...row, trangThai: res.data.trangThai } : row
      ))
      toast.success('Đã cập nhật trạng thái')
    } catch { toast.error('Lỗi cập nhật trạng thái') }
  }

  const handleExportExcel = () => {
    const data = filtered.map((r, i) => ({
      'STT': i + 1,
      'Mã SP': r.sku || '-',
      'Tên SP': r.tenSanPham,
      'Màu sắc': r.mauSac || '-',
      'Kích cỡ': r.kichCo || '-',
      'Giá bán': Number(r.gia) || 0,
      'Giá nhập': Number(r.giaNhap) || 0,
      'Tồn kho': r.tonKho || 0,
      'Trạng thái': r.trangThai === 1 ? 'Hoạt động' : 'Ẩn',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Bien the')
    XLSX.writeFile(wb, `danh-sach-bien-the-${new Date().toISOString().slice(0, 10)}.xlsx`)
    toast.success('Đã xuất file Excel')
  }

  const handleScanQR = useCallback(() => {
    const { Html5QrcodeScanner } = require('html5-qrcode')
    const scanWindow = document.createElement('div')
    scanWindow.id = 'qr-scan-container'
    Object.assign(scanWindow.style, {
      position: 'fixed', inset: '0', zIndex: '9999', background: 'white', display: 'flex', flexDirection: 'column',
    })
    document.body.appendChild(scanWindow)

    const header = document.createElement('div')
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #e5e5e5;'
    header.innerHTML = '<strong style="font-size:16px">Quét mã QR</strong>'
    const closeBtn = document.createElement('button')
    closeBtn.textContent = 'Đóng'
    closeBtn.style.cssText = 'padding:6px 12px;border:1px solid #ccc;border-radius:8px;cursor:pointer;font-size:13px;'
    header.appendChild(closeBtn)
    scanWindow.appendChild(header)

    const reader = document.createElement('div')
    reader.id = 'qr-reader'
    reader.style.cssText = 'flex:1;'
    scanWindow.appendChild(reader)

    const cleanup = () => { try { scanner.clear() } catch {} document.body.removeChild(scanWindow) }
    closeBtn.onclick = cleanup

    const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 250 }, false)
    scanner.render(
      (decodedText) => {
        setSearch(decodedText)
        cleanup()
        toast.success(`Tìm thấy: ${decodedText}`)
      },
      () => {}
    )
  }, [])

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
        <h1 className="text-2xl font-bold">Quản lý biến thể sản phẩm</h1>
        <div className="flex items-center gap-3">
          {printItems.length > 0 && (
            <span className="text-sm text-stone">Đã chọn {printItems.length}</span>
          )}
          <button onClick={handleScanQR}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary-color)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition">
            <QrCode className="h-4 w-4" /> Quét QR
          </button>
          <button onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 border border-[var(--primary-color)] text-[var(--primary-color)] text-sm font-semibold rounded-lg hover:bg-[var(--primary-bg)] transition">
            <Download className="h-4 w-4" /> Tải Excel
          </button>
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
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }}
                placeholder="Tìm theo mã SP hoặc tên..."
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
            </div>
          </div>
          <div>
            <label className="text-xs text-stone font-medium">Màu sắc</label>
            <select value={filterColor} onChange={(e) => { setFilterColor(e.target.value); setPage(0) }}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-gold">
              <option value="">Tất cả màu</option>
              {colors.map(c => <option key={c.maMauSac} value={c.mauSac}>{c.mauSac}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-stone font-medium">Kích cỡ</label>
            <select value={filterSize} onChange={(e) => { setFilterSize(e.target.value); setPage(0) }}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-gold">
              <option value="">Tất cả size</option>
              {sizes.map(s => <option key={s.maKichCo} value={s.kichCo}>{s.kichCo}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-stone font-medium">Trạng thái</label>
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(0) }}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-gold">
              <option value="">Tất cả</option>
              <option value="active">Hoạt động</option>
              <option value="hidden">Ẩn</option>
            </select>
          </div>
          {maxPrice > 0 && (
            <div className="min-w-[220px]">
              <label className="text-xs text-stone font-medium flex items-center gap-1">
                <SlidersHorizontal className="h-3 w-3" /> Khoảng giá: {VND(priceRange[0])} — {VND(priceRange[1])}
              </label>
              <div className="flex gap-2 mt-1 items-center">
                <input type="range" min="0" max={maxPrice} value={priceRange[0]}
                  onChange={e => { const v = Number(e.target.value); setPriceRange(p => [Math.min(v, p[1]), p[1]]); setPage(0) }}
                  className="flex-1 accent-gold h-1.5" />
                <input type="range" min="0" max={maxPrice} value={priceRange[1]}
                  onChange={e => { const v = Number(e.target.value); setPriceRange(p => [p[0], Math.max(v, p[0])]); setPage(0) }}
                  className="flex-1 accent-gold h-1.5" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-ivory rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-ivory-100">
              <th className="text-center px-3 py-2 font-semibold text-stone w-10">STT</th>
              <th className="text-center px-3 py-2 font-semibold text-stone w-12">Ảnh</th>
              <th className="text-left px-3 py-2 font-semibold text-stone">Mã SP</th>
              <th className="text-left px-3 py-2 font-semibold text-stone">Mã CTSP</th>
              <th className="text-left px-3 py-2 font-semibold text-stone">Tên SP</th>
              <th className="text-center px-3 py-2 font-semibold text-stone">Kích cỡ</th>
              <th className="text-center px-3 py-2 font-semibold text-stone">Màu sắc</th>
              <th className="text-center px-3 py-2 font-semibold text-stone">SL tồn</th>
              <th className="text-right px-3 py-2 font-semibold text-stone">Giá nhập</th>
              <th className="text-right px-3 py-2 font-semibold text-stone">Giá bán</th>
              <th className="text-center px-3 py-2 font-semibold text-stone">Trạng thái</th>
              <th className="text-center px-3 py-2 font-semibold text-stone">Hành động</th>
            </tr></thead>
            <tbody className="divide-y">
              {paged.map((r, i) => {
                const selected = printItems.some(p => p.sku === r.sku)
                const stt = page * rowsPerPage + i + 1
                return (
                  <tr key={i} className={`hover:bg-ivory-100 transition ${selected ? 'bg-gold/10' : ''}`}>
                    <td className="px-3 py-2 text-center text-xs text-stone">{stt}</td>
                    <td className="px-3 py-2 text-center">
                      <SafeImg src={r.urlAnhDaiDien} className="w-10 h-10 rounded-lg object-cover bg-ivory-100 mx-auto"
                        fallback="https://placehold.co/40x40/e2e8f0/475569?text=P" />
                    </td>
                    <td className="px-3 py-2 text-xs text-stone font-mono">SP{String(r.maSanPham).padStart(3, '0')}</td>
                    <td className="px-3 py-2 text-xs font-mono font-semibold">{r.sku || '-'}</td>
                    <td className="px-3 py-2 font-medium truncate max-w-[180px]">{r.tenSanPham}</td>
                    <td className="px-3 py-2 text-center">{r.kichCo}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {r.maMauHex && <span className="w-3.5 h-3.5 rounded-full border shrink-0" style={{ backgroundColor: r.maMauHex }} />}
                        <span className="text-xs">{r.mauSac}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.tonKho > 0 ? 'bg-emerald-deep/20 text-emerald-deep' : 'bg-bordeaux/20 text-bordeaux'}`}>
                        {r.tonKho}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-xs">{VND(r.giaNhap)}</td>
                    <td className="px-3 py-2 text-right font-semibold">{VND(r.gia)}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.trangThai === 1 ? 'bg-emerald-deep/20 text-emerald-deep' : 'bg-ivory-100 text-stone'}`}>
                        {r.trangThai === 1 ? 'Hoạt động' : 'Ẩn'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => togglePrintItem(r)}
                          className={`p-1.5 rounded-lg transition ${selected ? 'bg-gold/20 text-gold' : 'text-stone hover:text-gold hover:bg-gold/10'}`}
                          title="Chọn in">
                          <Printer className="h-4 w-4" />
                        </button>
                        {r.maBienThe && (
                          <button onClick={() => setShowDetail(r)}
                            className="p-1.5 rounded-lg text-stone hover:text-blue-600 hover:bg-blue-50 transition" title="Xem chi tiết">
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        {r.maBienThe && (
                          <button onClick={() => handleToggleStatus(r)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${r.trangThai === 1 ? 'bg-emerald-deep' : 'bg-stone/30'}`}
                            title={r.trangThai === 1 ? 'Ẩn' : 'Hiện'}>
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${r.trangThai === 1 ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={12} className="text-center py-10 text-stone">Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="flex items-center gap-2 text-sm text-stone">
            <span>Hiển thị</span>
            <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(0) }}
              className="border rounded px-2 py-1 text-sm">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>/{filtered.length} kết quả</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-stone mr-2">Trang {totalPages > 0 ? page + 1 : 0} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="p-1.5 rounded-lg border hover:bg-ivory-100 disabled:opacity-40 transition">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg border hover:bg-ivory-100 disabled:opacity-40 transition">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in"
          onClick={() => setShowDetail(null)}>
          <div className="bg-ivory rounded-2xl max-w-md w-full mx-4 p-6 shadow-2xl animate-scale-in"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Chi tiết biến thể</h3>
              <button onClick={() => setShowDetail(null)} className="text-stone hover:text-noir"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <SafeImg src={showDetail.urlAnhDaiDien} className="w-20 h-20 rounded-xl object-cover bg-ivory-100"
                fallback="https://placehold.co/80x80/e2e8f0/475569?text=P" />
              <div>
                <p className="font-semibold">{showDetail.tenSanPham}</p>
                <p className="text-xs text-stone mt-0.5">Mã SP: <span className="font-mono">SP{String(showDetail.maSanPham).padStart(3, '0')}</span></p>
                <p className="text-xs text-stone">Mã CTSP: <span className="font-mono font-semibold">{showDetail.sku}</span></p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-ivory-100 rounded-xl p-3">
                <p className="text-xs text-stone">Màu sắc</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {showDetail.maMauHex && <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: showDetail.maMauHex }} />}
                  <span className="font-semibold">{showDetail.mauSac}</span>
                </div>
              </div>
              <div className="bg-ivory-100 rounded-xl p-3">
                <p className="text-xs text-stone">Kích cỡ</p>
                <p className="font-semibold mt-0.5">{showDetail.kichCo}</p>
              </div>
              <div className="bg-ivory-100 rounded-xl p-3">
                <p className="text-xs text-stone">Giá nhập</p>
                <p className="font-semibold mt-0.5">{VND(showDetail.giaNhap)}</p>
              </div>
              <div className="bg-ivory-100 rounded-xl p-3">
                <p className="text-xs text-stone">Giá bán</p>
                <p className="font-semibold mt-0.5">{VND(showDetail.gia)}</p>
              </div>
              <div className="bg-ivory-100 rounded-xl p-3">
                <p className="text-xs text-stone">Tồn kho</p>
                <p className="font-semibold mt-0.5">{showDetail.tonKho}</p>
              </div>
              <div className="bg-ivory-100 rounded-xl p-3">
                <p className="text-xs text-stone">Trạng thái</p>
                <p className="mt-0.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${showDetail.trangThai === 1 ? 'bg-emerald-deep/20 text-emerald-deep' : 'bg-ivory-100 text-stone'}`}>
                    {showDetail.trangThai === 1 ? 'Hoạt động' : 'Ẩn'}
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <QRCodeImg sku={showDetail.sku} />
            </div>
          </div>
        </div>
      )}

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
