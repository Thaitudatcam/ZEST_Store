import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { VND } from '../../components/ProductCard'
import { Search, Plus, Minus, Trash2, ShoppingCart, X, Check } from 'lucide-react'
import SafeImg from '../../components/SafeImg'

export default function AdminPOS() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState([])
  const [tenKhach, setTenKhach] = useState('')
  const [sdtKhach, setSdtKhach] = useState('')
  const [placing, setPlacing] = useState(false)
  const [msg, setMsg] = useState(null)
  const [variantModal, setVariantModal] = useState(null)
  const [selectedVar, setSelectedVar] = useState(null)
  const [vQty, setVQty] = useState(1)

  useEffect(() => {
    api.get('/products', { params: { size: 100 } })
      .then(r => setProducts(r.data.content || []))
      .catch(() => setMsg({ type: 'error', text: 'Không thể tải sản phẩm' }))
      .finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p =>
    !search || p.tenSanPham?.toLowerCase().includes(search.toLowerCase())
  )

  const openVariant = async (product) => {
    try {
      const detail = await api.get(`/products/${product.slug || product.maSanPham}`).then(r => r.data)
      setVariantModal(detail)
      setSelectedVar(detail.variants?.[0]?.maBienThe || null)
      setVQty(1)
    } catch {
      setMsg({ type: 'error', text: 'Không thể tải thông tin sản phẩm' })
    }
  }

  const addToCart = () => {
    if (!selectedVar) return
    const detail = variantModal
    const variant = detail.variants?.find(v => v.maBienThe === selectedVar)
    if (!variant) return
    if (vQty > (variant.tonKho || 0)) {
      setMsg({ type: 'error', text: 'Số lượng vượt quá tồn kho' })
      return
    }
    setCart(prev => {
      const existing = prev.findIndex(c => c.maBienThe === selectedVar)
      if (existing >= 0) {
        const next = [...prev]
        next[existing] = { ...next[existing], soLuong: next[existing].soLuong + vQty }
        return next
      }
      return [...prev, {
        maBienThe: variant.maBienThe,
        tenSanPham: detail.product?.tenSanPham || 'SP',
        kichCo: variant.kichCo?.kichCo || '',
        mauSac: variant.mauSac?.mauSac || '',
        gia: variant.gia || 0,
        soLuong: vQty,
        tonKho: variant.tonKho || 0,
        urlAnh: variant.urlAnh || detail.product?.urlAnhDaiDien || '',
      }]
    })
    setVariantModal(null)
  }

  const updateQty = (idx, delta) => {
    setCart(prev => prev.map((c, i) => {
      if (i !== idx) return c
      const newQty = Math.max(1, c.soLuong + delta)
      if (newQty > c.tonKho) {
        setMsg({ type: 'error', text: 'Vượt quá tồn kho' })
        return c
      }
      return { ...c, soLuong: newQty }
    }))
  }

  const removeItem = (idx) => setCart(prev => prev.filter((_, i) => i !== idx))

  const total = cart.reduce((s, c) => s + c.gia * c.soLuong, 0)

  const handlePlace = async () => {
    if (cart.length === 0) return
    setPlacing(true)
    try {
      const res = await api.post('/admin/pos/orders', {
        items: cart.map(c => ({ maBienThe: c.maBienThe, soLuong: c.soLuong })),
        tenKhachHang: tenKhach.trim() || undefined,
        sdtKhachHang: sdtKhach.trim() || undefined,
      }).then(r => r.data)
      navigate(`/admin/orders`)
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Tạo đơn thất bại' })
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-6rem)]">
      {msg && (
        <div className="fixed top-5 right-5 z-50 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm">{msg.text}</span>
            <button onClick={() => setMsg(null)}><X className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col bg-white rounded-xl border">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm sản phẩm..."
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Không tìm thấy sản phẩm</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map(p => (
                <button key={p.maSanPham} onClick={() => openVariant(p)}
                  className="text-left border rounded-xl p-3 hover:border-blue-400 hover:shadow-sm transition">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                    <SafeImg src={p.urlAnhDaiDien} alt="" className="w-full h-full object-cover object-center"
                      fallback="https://placehold.co/200x200/e2e8f0/475569?text=Polo" />
                  </div>
                  <p className="text-sm font-medium truncate">{p.tenSanPham}</p>
                  <p className="text-blue-700 font-bold text-sm">{VND(p.giaTrungBinh || 0)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-80 bg-white rounded-xl border flex flex-col">
        <div className="p-4 border-b flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-blue-700" />
          <span className="font-semibold">Giỏ hàng</span>
          <span className="ml-auto text-sm text-gray-500">{cart.length} món</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Chưa có sản phẩm</div>
          ) : (
            cart.map((c, i) => (
              <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-lg p-2.5">
                  <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden shrink-0">
                    <SafeImg src={c.urlAnh} alt="" className="w-full h-full object-cover"
                      fallback="https://placehold.co/100x100/e2e8f0/475569?text=P" />
                  </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{c.tenSanPham}</p>
                  <p className="text-xs text-gray-500">{[c.mauSac, c.kichCo].filter(Boolean).join(' - ') || '—'}</p>
                  <p className="text-xs text-blue-700 font-semibold">{VND(c.gia)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(i, -1)}
                    className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 text-xs">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-medium">{c.soLuong}</span>
                  <button onClick={() => updateQty(i, 1)}
                    className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 text-xs">
                    <Plus className="h-3 w-3" />
                  </button>
                  <button onClick={() => removeItem(i)}
                    className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:text-red-600 text-xs">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t p-4 space-y-3">
          <input value={tenKhach} onChange={e => setTenKhach(e.target.value)}
            placeholder="Tên khách (không bắt buộc)"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={sdtKhach} onChange={e => setSdtKhach(e.target.value)}
            placeholder="SĐT (không bắt buộc)"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Tổng cộng:</span>
            <span className="text-lg font-bold text-blue-700">{VND(total)}</span>
          </div>
          <button onClick={handlePlace} disabled={cart.length === 0 || placing}
            className="w-full bg-blue-700 text-white font-semibold py-3 rounded-xl hover:bg-blue-800 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {placing ? 'Đang xử lý...' : 'Thanh toán tiền mặt'}
          </button>
        </div>
      </div>

      {variantModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 animate-fade-in"
          onClick={() => setVariantModal(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto animate-scale-in"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg">Chọn phân loại</h3>
              <button onClick={() => setVariantModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {(variantModal.variants || []).map(v => {
                  const active = selectedVar === v.maBienThe
                  return (
                    <button key={v.maBienThe} onClick={() => { setSelectedVar(v.maBienThe); setVQty(1) }}
                      className={`text-left border rounded-xl p-3 transition ${active ? 'border-blue-700 ring-2 ring-blue-200' : 'hover:border-gray-300'}`}>
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                        <SafeImg src={v.urlAnh || variantModal.product?.urlAnhDaiDien} alt="" className="w-full h-full object-cover object-center"
                          fallback="https://placehold.co/200x200/e2e8f0/475569?text=Polo" />
                      </div>
                      <p className="text-sm font-semibold truncate">{v.kichCo?.kichCo} - {v.mauSac?.mauSac}</p>
                      <p className="text-blue-700 font-bold text-sm">{VND(v.gia || 0)}</p>
                      <p className="text-xs text-gray-400">Kho: {v.tonKho ?? 0}</p>
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center gap-3 mt-4">
                <span className="font-semibold text-sm">Số lượng:</span>
                <div className="flex border rounded-lg">
                  <button onClick={() => setVQty(Math.max(1, vQty - 1))}
                    className="px-3 py-1.5 hover:bg-gray-100">-</button>
                  <span className="px-4 py-1.5 border-x min-w-[2.5rem] text-center text-sm">{vQty}</span>
                  <button onClick={() => setVQty(vQty + 1)}
                    className="px-3 py-1.5 hover:bg-gray-100">+</button>
                </div>
              </div>
            </div>

            <div className="border-t p-4">
              <button onClick={addToCart}
                className="w-full bg-blue-700 text-white font-semibold py-3 rounded-xl hover:bg-blue-800 transition flex items-center justify-center gap-2">
                <Plus className="h-5 w-5" /> Thêm vào giỏ hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
