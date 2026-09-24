import { describe, expect, it } from 'vitest'
import { getAdminNextStatuses } from './orderStatus'

describe('order status transitions', () => {
  it('allows a paid POS delivery order to continue through fulfilment', () => {
    expect(getAdminNextStatuses(
      { loaiDonHang: 2, trangThaiDon: 2, stockState: 'DEDUCTED' },
      [{ phuongThuc: 5, trangThaiThanhToan: 2 }],
    )).toEqual([3])
  })

  it('allows paid deliveries to be marked failed but not cancelled', () => {
    expect(getAdminNextStatuses(
      { loaiDonHang: 1, trangThaiDon: 4, stockState: 'DEDUCTED' },
      [{ phuongThuc: 2, trangThaiThanhToan: 2 }],
    )).toEqual([6, 9])
  })

  it('supports cancellation before shipping and the full return lifecycle', () => {
    expect(getAdminNextStatuses({ trangThaiDon: 3, stockState: 'DEDUCTED' }, [])).toEqual([4, 5])
    expect(getAdminNextStatuses({ trangThaiDon: 6, stockState: 'DEDUCTED' }, [])).toEqual([7])
    expect(getAdminNextStatuses({ trangThaiDon: 7, stockState: 'DEDUCTED' }, [])).toEqual([8, 6])
  })

  it('blocks fulfilment for unpaid online payments and legacy stock', () => {
    expect(getAdminNextStatuses(
      { trangThaiDon: 2, stockState: 'DEDUCTED' },
      [{ phuongThuc: 2, trangThaiThanhToan: 1 }],
    )).toEqual([5])
    expect(getAdminNextStatuses({ trangThaiDon: 2, stockState: 'LEGACY' }, [])).toEqual([])
  })
})
