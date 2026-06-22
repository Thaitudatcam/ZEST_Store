import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { getCart } from '../api/cart'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [count, setCount] = useState(0)

  const refreshCount = useCallback(async () => {
    try {
      const items = await getCart()
      const total = items.reduce((s, i) => s + (i.soLuong || 0), 0)
      setCount(total)
    } catch { setCount(0) }
  }, [])

  useEffect(() => { refreshCount() }, [refreshCount])

  return (
    <CartContext.Provider value={{ count, refreshCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
