import { useState } from 'react'
import { X, ShoppingCart } from 'lucide-react'
import { VND } from './ProductCard'

export default function VariantModal({ variants, images, onConfirm, onClose }) {
  const [sel, setSel] = useState(null)
  const [qty, setQty] = useState(1)

  const selected = variants.find(v => v.maBienThe === sel) || variants[0]
  const selectedStock = selected?.tonKho ?? 0
  const isOutOfStock = selectedStock === 0
  const imgMap = {}
  images?.forEach(img => { if (img.maBienThe) { (imgMap[img.maBienThe] = imgMap[img.maBienThe] || []).push(img) } })

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-lg">Chọn phân loại</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {variants.map(v => {
              const active = (sel || variants[0]?.maBienThe) === v.maBienThe
              const vImg = imgMap[v.maBienThe]?.[0]?.urlAnh
              const stock = v.tonKho ?? 0
              const disabled = stock === 0
              return (
                <button key={v.maBienThe} onClick={() => { if (!disabled) { setSel(v.maBienThe); setQty(1) } }} disabled={disabled}
                  className={`text-left border rounded-xl p-3 transition ${active ? 'border-blue-700 ring-2 ring-blue-200' : disabled ? 'bg-gray-50 border-gray-200 cursor-not-allowed' : 'hover:border-gray-300'}`}>
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2 relative">
                    <img src={vImg || 'https://placehold.co/200x200/e2e8f0/475569?text=Polo'} alt="" className={`w-full h-full object-cover object-center ${disabled ? 'opacity-50 grayscale' : ''}`} />
                    {disabled && <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white font-bold text-sm">Hết hàng</span>}
                  </div>
                  <p className="text-sm font-semibold truncate">{v.kichCo?.kichCo} - {v.mauSac?.mauSac}</p>
                  <p className="text-blue-700 font-bold text-sm">{VND(v.gia || 0)}</p>
                  <p className={`text-xs ${disabled ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>{disabled ? 'Hết hàng' : `Kho: ${stock}`}</p>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-3 mt-4">
            <span className="font-semibold text-sm">Số lượng:</span>
            <div className="flex border rounded-lg">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-1.5 hover:bg-gray-100">-</button>
              <span className="px-4 py-1.5 border-x min-w-[2.5rem] text-center text-sm">{qty}</span>
              <button onClick={() => setQty(Math.min(selectedStock, qty + 1))} className="px-3 py-1.5 hover:bg-gray-100" disabled={qty >= selectedStock}>+</button>
            </div>
          </div>
        </div>

        <div className="border-t p-4">
          <button onClick={() => onConfirm(selected?.maBienThe, qty)} disabled={isOutOfStock}
            className={`w-full font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 ${isOutOfStock ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-700 text-white hover:bg-blue-800'}`}>
            <ShoppingCart className="h-5 w-5" /> {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
          </button>
        </div>
      </div>
    </div>
  )
}