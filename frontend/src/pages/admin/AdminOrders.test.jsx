import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminOrders from './AdminOrders'
import { getAllOrders } from '../../api/admin'

vi.mock('../../api/admin', () => ({ getAllOrders: vi.fn() }))
vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

describe('AdminOrders detail access', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAllOrders.mockResolvedValue({
      content: [{
        maDonHang: 166,
        maDonHangCode: 'DH0166',
        nguoiTaoTen: 'Admin',
        tenNguoiNhan: 'Trần Thị B',
        sdtNguoiNhan: '0779270877',
        ngayDat: '2026-09-25T22:17:00',
        tongTien: 273925,
        loaiDonHang: 1,
        trangThaiDon: 1,
        thanhToans: [],
      }],
      totalPages: 1,
      number: 0,
    })
  })

  it('links both the order code and the visible action to order details', async () => {
    render(<MemoryRouter initialEntries={['/admin/orders']}><AdminOrders /></MemoryRouter>)

    const codeLink = await screen.findByRole('link', { name: 'DH0166' })
    const actionLink = screen.getByRole('link', { name: /Chi tiết/ })
    expect(codeLink).toHaveAttribute('href', '/admin/orders/166')
    expect(actionLink).toHaveAttribute('href', '/admin/orders/166')
  })
})
