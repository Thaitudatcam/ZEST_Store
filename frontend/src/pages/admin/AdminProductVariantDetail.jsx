import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import api from '../../api/axios'
import SafeImg from '../../components/SafeImg'
import { Search, X, Eye, ChevronLeft, ChevronRight, QrCode, Download, SlidersHorizontal } from 'lucide-react'
import QRCode from 'qrcode'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import CameraScanner from '../../components/CameraScanner'

const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

const loadImage = (src) => new Promise((resolve, reject) => {
  const image = new Image()
  image.onload = () => resolve(image)
  image.onerror = reject
  image.src = src
})

const createLabelImage = async (item) => {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 720
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = '#b9a66b'
  ctx.lineWidth = 5
  ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24)

  const qrUrl = await QRCode.toDataURL(item.sku || '', {
    width: 360, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#111111', light: '#ffffff' },
  })
  const qr = await loadImage(qrUrl)
  ctx.drawImage(qr, 55, 175, 360, 360)

  const textX = 465
  const maxWidth = 675
  ctx.fillStyle = '#171717'
  ctx.font = 'bold 38px Arial'
  const productName = item.tenSanPham || 'Sản phẩm'
  const words = productName.split(/\s+/)
  let line = ''
  let y = 165
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, textX, y)
      y += 50
      line = word
    } else line = next
  }
  if (line) ctx.fillText(line, textX, y)

  ctx.font = '30px Arial'
  ctx.fillStyle = '#555555'
  ctx.fillText(`Màu: ${item.mauSac || '-'}`, textX, y + 80)
  ctx.fillText(`Kích cỡ: ${item.kichCo || '-'}`, textX, y + 125)
  ctx.font = 'bold 38px Arial'
  ctx.fillStyle = '#a57c00'
  ctx.fillText(VND(item.gia), textX, y + 195)
  ctx.font = 'bold 32px monospace'
  ctx.fillStyle = '#171717'
  ctx.fillText(item.sku || '-', textX, y + 270)
  return canvas.toDataURL('image/png')
}

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
  const [downloadingLabels, setDownloadingLabels] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [showDetail, setShowDetail] = useState(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [filterPriceMin, setFilterPriceMin] = useState('')
  const [filterPriceMax, setFilterPriceMax] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const hasFilter = filterColor || filterSize || filterStatus || filterPriceMin || filterPriceMax

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
    }).catch(() => {})
    .finally(() => setLoading(false))
  }, [])

  const filtered = rows.filter(r => {
    const compactSearch = search.toLowerCase().replace(/\s+/g, '')
    if (compactSearch) {
      const compactSku = (r.sku || '').toLowerCase().replace(/\s+/g, '')
      const compactName = (r.tenSanPham || '').toLowerCase().replace(/\s+/g, '')
      if (!compactSku.includes(compactSearch) && !compactName.includes(compactSearch)) return false
    }
    if (filterColor && r.mauSac !== filterColor) return false
    if (filterSize && r.kichCo !== filterSize) return false
    if (filterStatus === 'active' && r.trangThai !== 1) return false
    if (filterStatus === 'hidden' && r.trangThai !== 0) return false
    const price = Number(r.gia) || 0
    if (filterPriceMin && price < Number(filterPriceMin)) return false
    if (filterPriceMax && price > Number(filterPriceMax)) return false
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

  const allFilteredSelected = filtered.length > 0 && filtered.every(r =>
    printItems.some(item => item.sku === r.sku)
  )

  const toggleAllFilteredLabels = () => {
    if (allFilteredSelected) {
      const filteredSkus = new Set(filtered.map(r => r.sku))
      setPrintItems(prev => prev.filter(item => !filteredSkus.has(item.sku)))
      return
    }
    setPrintItems(prev => {
      const selectedSkus = new Set(prev.map(item => item.sku))
      return [...prev, ...filtered.filter(item => !selectedSkus.has(item.sku))]
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

  const handleScannedSku = useCallback((sku) => {
    setCameraOpen(false)
    setSearch(sku)
    setPage(0)
    toast.success(`Tìm thấy: ${sku}`)
  }, [toast])

  const handleDownloadLabelsPdf = useCallback(async () => {
    if (printItems.length === 0 || downloadingLabels) return
    setDownloadingLabels(true)
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const labelWidth = 90
      const labelHeight = 54
      const labelsPerPage = 8
      for (let index = 0; index < printItems.length; index += 1) {
        if (index > 0 && index % labelsPerPage === 0) pdf.addPage()
        const position = index % labelsPerPage
        const column = position % 2
        const row = Math.floor(position / 2)
        const x = 10 + column * 95
        const y = 10 + row * 67
        const labelImage = await createLabelImage(printItems[index])
        pdf.addImage(labelImage, 'PNG', x, y, labelWidth, labelHeight)
      }
      pdf.save(`nhan-sku-${new Date().toISOString().slice(0, 10)}.pdf`)
      toast.success(`Đã tải PDF ${printItems.length} nhãn QR/SKU`)
    } catch {
      toast.error('Không thể tạo file PDF nhãn')
    } finally {
      setDownloadingLabels(false)
    }
  }, [downloadingLabels, printItems, toast])

  if (loading) return <div className="animate-pulse h-96 bg-ivory-100 rounded-2xl" />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý biến thể sản phẩm</h1>
        <div className="flex items-center gap-3">
          {printItems.length > 0 && (
            <span className="text-sm text-stone">Đã chọn {printItems.length}</span>
          )}
          <button onClick={() => setCameraOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary-color)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition">
            <QrCode className="h-4 w-4" /> Quét QR
          </button>
          <button onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 border border-[var(--primary-color)] text-[var(--primary-color)] text-sm font-semibold rounded-lg hover:bg-[var(--primary-bg)] transition">
            <Download className="h-4 w-4" /> Tải Excel
          </button>
          <button onClick={toggleAllFilteredLabels} disabled={filtered.length === 0}
            className="px-4 py-2 border border-gold text-gold text-sm font-semibold rounded-lg hover:bg-gold/10 transition disabled:opacity-50">
            {allFilteredSelected ? 'Bỏ chọn tất cả' : `Chọn tất cả (${filtered.length})`}
          </button>
          <button onClick={handleDownloadLabelsPdf} disabled={printItems.length === 0 || downloadingLabels}
            className="flex items-center gap-2 px-4 py-2 bg-gold text-noir text-sm font-semibold rounded-lg hover:bg-gold-hover transition disabled:opacity-50">
            <Download className="h-4 w-4" /> {downloadingLabels ? 'Đang tạo PDF…' : 'Tải nhãn PDF'}
          </button>
        </div>
      </div>

      <div className="bg-ivory rounded-2xl border overflow-hidden mb-6">
        <div className="p-4 border-b space-y-3">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }} placeholder="Tìm theo SKU hoặc tên..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
            </div>
            <button onClick={() => setShowFilters(value => !value)} className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition ${showFilters ? 'bg-gold/10 border-gold text-gold' : 'hover:bg-ivory-100'}`}><SlidersHorizontal className="h-4 w-4" /> Bộ lọc{hasFilter && <span className="w-2 h-2 bg-gold rounded-full" />}</button>
          </div>
          {showFilters && <div className="flex flex-wrap gap-3 items-end pt-2 border-t">
          <div><label className="text-xs text-stone font-medium">Màu sắc</label><select value={filterColor} onChange={(e) => { setFilterColor(e.target.value); setPage(0) }} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-gold"><option value="">Tất cả màu</option>{colors.map(c => <option key={c.maMauSac} value={c.mauSac}>{c.mauSac}</option>)}</select></div>
          <div><label className="text-xs text-stone font-medium">Kích cỡ</label><select value={filterSize} onChange={(e) => { setFilterSize(e.target.value); setPage(0) }} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-gold"><option value="">Tất cả size</option>{sizes.map(s => <option key={s.maKichCo} value={s.kichCo}>{s.kichCo}</option>)}</select></div>
          <div><label className="text-xs text-stone font-medium">Trạng thái</label><select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(0) }} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-gold"><option value="">Tất cả</option><option value="active">Hoạt động</option><option value="hidden">Ẩn</option></select></div>
          <div><label className="text-xs text-stone font-medium">Giá từ</label><input type="number" min="0" value={filterPriceMin} onChange={e => { setFilterPriceMin(e.target.value); setPage(0) }} placeholder="0" className="w-28 border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-gold" /></div>
          <div><label className="text-xs text-stone font-medium">đến</label><input type="number" min="0" value={filterPriceMax} onChange={e => { setFilterPriceMax(e.target.value); setPage(0) }} placeholder="∞" className="w-28 border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-gold" /></div>
          {hasFilter && <button onClick={() => { setFilterColor(''); setFilterSize(''); setFilterStatus(''); setFilterPriceMin(''); setFilterPriceMax(''); setPage(0) }} className="flex items-center gap-1 px-3 py-2 text-xs text-stone hover:text-bordeaux border rounded-lg hover:bg-ivory-100 transition"><X className="h-3 w-3" /> Xóa lọc</button>}
          </div>}
        </div>
      </div>

      <div className="bg-ivory rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-ivory-100">
              <th className="text-center px-3 py-2 font-semibold text-stone w-10">STT</th>
              <th className="text-center px-3 py-2 font-semibold text-stone w-12">Ảnh</th>
              <th className="text-left px-3 py-2 font-semibold text-stone">Mã SP</th>
              <th className="text-left px-3 py-2 font-semibold text-stone">SKU</th>
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
                          title="Chọn tải nhãn PDF">
                          <QrCode className="h-4 w-4" />
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
                <p className="text-xs text-stone">SKU: <span className="font-mono font-semibold">{showDetail.sku}</span></p>
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

      {cameraOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 animate-fade-in" onClick={() => setCameraOpen(false)}>
          <div className="bg-ivory rounded-2xl max-w-lg w-full mx-4 overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-stone/10">
              <h3 className="font-bold text-lg">Quét mã vạch</h3>
              <button onClick={() => setCameraOpen(false)} className="text-stone hover:text-noir"><X className="h-5 w-5" /></button>
            </div>
            <CameraScanner onScan={handleScannedSku} onClose={() => setCameraOpen(false)} />
          </div>
        </div>
      )}

    </div>
  )
}
