import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminOrderDetail from './AdminOrderDetail'
import api from '../../api/axios'
import { confirmVietQrPayment } from '../../api/payment'

const { toastSuccess, toastError } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock('../../api/axios', () => ({ default: { get: vi.fn(), put: vi.fn() } }))
vi.mock('../../api/payment', () => ({ confirmVietQrPayment: vi.fn() }))
vi.mock('../../api/admin', () => ({ registerOrderPrint: vi.fn() }))
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { vaiTro: 'ADMIN' } }) }))
vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ success: toastSuccess, error: toastError }),
}))
vi.mock('../../components/OrderInvoiceLink', () => ({ default: () => null }))

const pendingOrder = {
  order: {
    maDonHang: 166,
    maDonHangCode: 'DH0166',
    ngayDat: '2026-09-25T22:17:00',
    loaiDonHang: 1,
    trangThaiDon: 1,
    stockState: 'RESERVED',
    tongTien: 273925,
    soTienGiam: 0,
    phiVanChuyen: 0,
    tenNguoiNhan: 'Trần Thị B',
  },
  items: [],
  payments: [{
    maThanhToan: 77,
    phuongThuc: 3,
    trangThaiThanhToan: 1,
    soTien: 273925,
  }],
  history: [],
}

describe('AdminOrderDetail VietQR confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockResolvedValue({ data: pendingOrder })
    confirmVietQrPayment.mockResolvedValue({ message: 'Payment confirmed' })
  })

  it('lets admin confirm a pending VietQR transfer after an explicit warning', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/admin/orders/166']}>
        <Routes><Route path="/admin/orders/:id" element={<AdminOrderDetail />} /></Routes>
      </MemoryRouter>,
    )

    await user.click(await screen.findByRole('button', { name: 'Xác nhận đã nhận tiền' }))
    expect(screen.getByText(/Chỉ xác nhận khi bạn đã kiểm tra tài khoản ngân hàng/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Đã nhận đủ tiền' }))

    await waitFor(() => expect(confirmVietQrPayment).toHaveBeenCalledWith(77))
    expect(api.get).toHaveBeenCalledTimes(2)
    expect(toastSuccess).toHaveBeenCalledWith(expect.stringContaining('Đã xác nhận nhận tiền VietQR'))
    expect(toastError).not.toHaveBeenCalled()
  })
})
