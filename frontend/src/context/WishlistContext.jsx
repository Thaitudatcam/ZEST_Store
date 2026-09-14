import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { getWishlist } from '../api/wishlist'
import { useAuth } from './AuthContext'

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { user } = useAuth()
  const [wishlistCount, setWishlistCount] = useState(0)

  const refreshWishlistCount = useCallback(async () => {
    try {
      const items = await getWishlist()
      setWishlistCount(Array.isArray(items) ? items.length : 0)
    } catch { setWishlistCount(0) }
  }, [])

  useEffect(() => { refreshWishlistCount() }, [user, refreshWishlistCount])

  return (
    <WishlistContext.Provider value={{ wishlistCount, refreshWishlistCount }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
