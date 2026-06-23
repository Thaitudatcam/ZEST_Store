import { useState, useEffect } from 'react'
import { getCart, removeCartItem, updateCartItem, clearCart } from '../api/cart'
import { useCart } from '../context/CartContext'
import LoadingSpinner from '../components/LoadingSpinner'
import Toast from '../components/Toast'
import { Trash2, ShoppingBag, ArrowLeft, Plus, Minus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { VND } from '../components/ProductCard'
import SafeImg from '../components/SafeImg'

export default function Cart() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const { refreshCount } = useCart()

  const load = () => getCart().then(setItems).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleQty = async (vid, delta) => {
    const item = items.find((i) => i.maBienThe === vid)
    const newQty = Math.max(1, (item.soLuong || 1) + delta)
    try {
      await updateCartItem(vid, { soLuong: newQty })
      setItems(prev => prev.map(i => i.maBienThe === vid ? { ...i, soLuong: newQty } : i))
      refreshCount()
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Không thể cập nhật số lượng', type: 'error' })
    }
  }

  const handleRemove = async (vid) => {
    try {
      await removeCartItem(vid)
      setItems(prev => prev.filter(i => i.maBienThe !== vid))
      refreshCount()
    } catch { setToast({ message: 'Không thể xóa sản phẩm', type: 'error' }) }
  }

  const handleClear = async () => {
    try {
      await clearCart()
      setItems([])
      refreshCount()
    } catch { setToast({ message: 'Không thể xóa giỏ hàng', type: 'error' }) }
  }

  const total = items.reduce((s, i) => s + ((i.donGia || 0) * (i.soLuong || 1)), 0)

  if (loading) return <LoadingSpinner className="py-20" />

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Giỏ hàng</h1>
        {items.length > 0 && <button onClick={handleClear} className="text-sm text-red-500 hover:underline">Xóa tất cả</button>}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 text-gray-500 animate-fade-in">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="mb-4">Giỏ hàng trống</p>
          <Link to="/products" className="text-blue-700 font-semibold hover:underline">Mua sắm ngay</Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((i, idx) => (
              <div key={i.maBienThe}
                className="bg-white rounded-xl border p-4 flex items-center gap-4 transition-all duration-300 hover:shadow-md animate-fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                  <SafeImg src={i.urlAnh} alt="" className="w-full h-full object-cover object-center" fallback="https://placehold.co/100x100/e2e8f0/475569?text=Polo" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{i.tenSanPham || `Sản phẩm #${i.maSanPham}`}</p>
                  <p className="text-sm text-gray-500">{[i.kichCo, i.mauSac].filter(Boolean).join(' - ')}</p>
                  <p className="text-blue-700 font-bold">{VND(i.donGia || 0)}</p>
                </div>
                <div className="flex items-center border rounded-lg">
                  <button onClick={() => handleQty(i.maBienThe, -1)} className="px-2 py-1 hover:bg-gray-100 transition active:scale-90"><Minus className="h-4 w-4" /></button>
                  <span className="px-3 py-1 border-x min-w-[2rem] text-center text-sm">{i.soLuong || 1}</span>
                  <button onClick={() => handleQty(i.maBienThe, 1)} className="px-2 py-1 hover:bg-gray-100 transition active:scale-90"><Plus className="h-4 w-4" /></button>
                </div>
                <button onClick={() => handleRemove(i.maBienThe)} className="text-red-400 hover:text-red-600 transition active:scale-90"><Trash2 className="h-5 w-5" /></button>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-white rounded-xl border p-6 transition-all duration-300 hover:shadow-md">
            <div className="flex justify-between text-lg font-bold">
              <span>Tổng cộng:</span>
              <span className="text-blue-700">{VND(total)}</span>
            </div>
            <Link to="/checkout" className="mt-4 block w-full bg-blue-700 text-white text-center font-semibold py-3 rounded-lg hover:bg-blue-800 transition active:scale-[0.98]">
              Thanh toán
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
