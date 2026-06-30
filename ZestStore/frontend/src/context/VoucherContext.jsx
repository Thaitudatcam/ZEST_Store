import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { getVoucherCount } from '../api/userVoucher'

const VoucherContext = createContext(null)

export function VoucherProvider({ children }) {
  const [voucherCount, setVoucherCount] = useState(0)

  const refreshVoucherCount = useCallback(async () => {
    try {
      const res = await getVoucherCount()
      setVoucherCount(res?.count || 0)
    } catch { setVoucherCount(0) }
  }, [])

  useEffect(() => { refreshVoucherCount() }, [refreshVoucherCount])

  return (
    <VoucherContext.Provider value={{ voucherCount, refreshVoucherCount }}>
      {children}
    </VoucherContext.Provider>
  )
}

export function useVoucher() {
  const ctx = useContext(VoucherContext)
  if (!ctx) throw new Error('useVoucher must be used within VoucherProvider')
  return ctx
}
