import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminThongKe from './AdminThongKe'
import {
  getBestSellingProducts,
  getOrderStats,
  getRevenueByYear,
  getSalesSummary,
  getStats,
} from '../../api/admin'

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'ADMIN' } }),
}))

vi.mock('../../api/admin', () => ({
  getStats: vi.fn(),
  getOrderStats: vi.fn(),
  getRevenueByMonth: vi.fn(),
  getRevenueByYear: vi.fn(),
  getBestSellingProducts: vi.fn(),
  getSalesSummary: vi.fn(),
}))

describe('AdminThongKe payment summary', () => {
  beforeEach(() => {
    getStats.mockResolvedValue({})
    getOrderStats.mockResolvedValue({ completed: 1 })
    getRevenueByYear.mockResolvedValue([])
    getBestSellingProducts.mockResolvedValue([])
    getSalesSummary.mockResolvedValue({
      doanhThu: 211000,
      soHoaDon: 2,
      soSanPham: 2,
      phuongThucThanhToan: {
        tienMat: 199000,
        chuyenKhoan: 0,
        vnPay: 0,
        zaloPay: 12000,
      },
      donHang: { completed: 2, cancelled: 0, failed: 0 },
    })
  })

  it('loads today payment totals immediately and renders ZaloPay next to other methods', async () => {
    render(<AdminThongKe />)

    const cashCards = await screen.findAllByText('TIỀN MẶT')
    const zaloPayCards = await screen.findAllByText('ZALOPAY')

    expect(cashCards[0].parentElement).toHaveTextContent(/199\.000/)
    expect(zaloPayCards[0].parentElement).toHaveTextContent(/12\.000/)
    expect(getSalesSummary).toHaveBeenCalledWith(
      expect.stringMatching(/T00:00:00$/),
      expect.stringMatching(/T23:59:59$/),
    )
  })
})
