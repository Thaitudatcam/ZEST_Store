import { render, screen, act, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, it, expect, afterEach } from 'vitest'
import { getOrderDetail } from '../api/orders'
import PaymentResult from './PaymentResult'
vi.mock('../api/orders', () => ({ getOrderDetail: vi.fn() }))
afterEach(() => { vi.useRealTimers(); vi.resetAllMocks() })
const show = () => render(<MemoryRouter initialEntries={['/payment/result?orderId=160']}><PaymentResult /></MemoryRouter>)
it('stops loading after 15 seconds even when the request never resolves', async () => {
  vi.useFakeTimers()
  getOrderDetail.mockImplementation(() => new Promise(() => {}))
  show()
  await act(async () => { await vi.advanceTimersByTimeAsync(15001) })
  expect(screen.getByText('Đang chờ xác nhận thanh toán')).toBeInTheDocument()
  expect(screen.queryByText('Thanh toán thất bại')).not.toBeInTheDocument()
})
it('manual success is not overwritten by the old poll deadline', async () => {
  vi.useFakeTimers()
  getOrderDetail.mockImplementationOnce(() => new Promise(() => {}))
    .mockResolvedValue({ payments: [{ trangThaiThanhToan: 2 }] })
  show()
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' })) })
  await act(async () => { await vi.advanceTimersByTimeAsync(16000) })
  expect(screen.getByText('Thanh toán thành công')).toBeInTheDocument()
})
