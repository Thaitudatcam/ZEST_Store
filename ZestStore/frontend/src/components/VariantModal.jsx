import { useState } from 'react'
import { X, ShoppingCart } from 'lucide-react'
import { VND } from './ProductCard'

export default function VariantModal({ variants, images, onConfirm, onClose }) {
  const [sel, setSel] = useState(null)
  const [qty, setQty] = useState(1)

  const selected = variants.find(v => v.maBienThe === sel) || variants[0]
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
              return (
                <button key={v.maBienThe} onClick={() => { setSel(v.maBienThe); setQty(1) }}
                  className={`text-left border rounded-xl p-3 transition ${active ? 'border-blue-700 ring-2 ring-blue-200' : 'hover:border-gray-300'}`}>
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                    <img src={vImg || 'https://placehold.co/200x200/e2e8f0/475569?text=Polo'} alt="" className="w-full h-full object-cover object-center" />
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
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-1.5 hover:bg-gray-100">-</button>
              <span className="px-4 py-1.5 border-x min-w-[2.5rem] text-center text-sm">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-3 py-1.5 hover:bg-gray-100">+</button>
            </div>
          </div>
        </div>

        <div className="border-t p-4">
          <button onClick={() => onConfirm(selected?.maBienThe, qty)}
            className="w-full bg-blue-700 text-white font-semibold py-3 rounded-xl hover:bg-blue-800 transition flex items-center justify-center gap-2">
            <ShoppingCart className="h-5 w-5" /> Thêm vào giỏ hàng
          </button>
        </div>
      </div>
    </div>
  )
}
