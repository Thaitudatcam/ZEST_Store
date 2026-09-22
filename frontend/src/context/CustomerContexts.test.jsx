import { render, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { CartProvider } from './CartContext'
import { VoucherProvider } from './VoucherContext'
import { getCart } from '../api/cart'
import { getUnclaimedCount } from '../api/userVoucher'
import { useAuth } from './AuthContext'

vi.mock('./AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('../api/cart', () => ({ getCart: vi.fn() }))
vi.mock('../api/userVoucher', () => ({ getUnclaimedCount: vi.fn() }))

describe('customer-only global counters', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not request customer cart or vouchers for an admin', async () => {
    useAuth.mockReturnValue({ user: { vaiTro: 'ADMIN' } })

    render(<CartProvider><VoucherProvider><div>admin</div></VoucherProvider></CartProvider>)

    await waitFor(() => {
      expect(getCart).not.toHaveBeenCalled()
      expect(getUnclaimedCount).not.toHaveBeenCalled()
    })
  })

  it('loads both counters for a customer', async () => {
    useAuth.mockReturnValue({ user: { vaiTro: 'CUSTOMER' } })
    getCart.mockResolvedValue([{ soLuong: 2 }])
    getUnclaimedCount.mockResolvedValue({ count: 1 })

    render(<CartProvider><VoucherProvider><div>customer</div></VoucherProvider></CartProvider>)

    await waitFor(() => {
      expect(getCart).toHaveBeenCalledTimes(1)
      expect(getUnclaimedCount).toHaveBeenCalledTimes(1)
    })
  })
})
