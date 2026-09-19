import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import OrderCustomerNotes from './OrderCustomerNotes'

describe('OrderCustomerNotes', () => {
  it('renders nothing when history is empty', () => {
    const { container } = render(<OrderCustomerNotes history={[]} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when history has no notes with ghiChu', () => {
    const history = [
      { maLichSu: 1, trangThaiMoi: 2, ghiChu: null, khachHangXem: null },
      { maLichSu: 2, trangThaiMoi: 3, ghiChu: '', khachHangXem: true },
      { maLichSu: 3, trangThaiMoi: 4, ghiChu: '   ', khachHangXem: true },
    ]
    const { container } = render(<OrderCustomerNotes history={history} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders notes that are visible to customers (khachHangXem=true)', () => {
    const history = [
      { maLichSu: 1, trangThaiMoi: 2, ghiChu: 'Xac nhan don', khachHangXem: true },
    ]
    render(<OrderCustomerNotes history={history} />)
    expect(screen.getByText('Xac nhan don')).toBeInTheDocument()
  })

  it('renders legacy notes (khachHangXem=null)', () => {
    const history = [
      { maLichSu: 1, trangThaiMoi: 2, ghiChu: 'Legacy note', khachHangXem: null },
    ]
    render(<OrderCustomerNotes history={history} />)
    expect(screen.getByText('Legacy note')).toBeInTheDocument()
  })

  it('hides internal notes (khachHangXem=false)', () => {
    const history = [
      { maLichSu: 1, trangThaiMoi: 2, ghiChu: 'Internal note', khachHangXem: false },
      { maLichSu: 2, trangThaiMoi: 3, ghiChu: 'Visible note', khachHangXem: true },
    ]
    render(<OrderCustomerNotes history={history} />)
    expect(screen.queryByText('Internal note')).not.toBeInTheDocument()
    expect(screen.getByText('Visible note')).toBeInTheDocument()
  })

  it('filters mixed notes correctly', () => {
    const history = [
      { maLichSu: 1, trangThaiMoi: 2, ghiChu: 'Legacy', khachHangXem: null },
      { maLichSu: 2, trangThaiMoi: 3, ghiChu: 'Internal', khachHangXem: false },
      { maLichSu: 3, trangThaiMoi: 4, ghiChu: 'Customer', khachHangXem: true },
      { maLichSu: 4, trangThaiMoi: 5, ghiChu: 'Another internal', khachHangXem: false },
      { maLichSu: 5, trangThaiMoi: 6, ghiChu: 'Done', khachHangXem: true },
    ]
    render(<OrderCustomerNotes history={history} />)
    expect(screen.getByText('Legacy')).toBeInTheDocument()
    expect(screen.queryByText('Internal')).not.toBeInTheDocument()
    expect(screen.getByText('Customer')).toBeInTheDocument()
    expect(screen.queryByText('Another internal')).not.toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('displays status label for known statuses', () => {
    const history = [
      { maLichSu: 1, trangThaiMoi: 2, ghiChu: 'Note', khachHangXem: true },
    ]
    render(<OrderCustomerNotes history={history} />)
    expect(screen.getByText('Đã xác nhận')).toBeInTheDocument()
  })

  it('displays "Cập nhật đơn hàng" for unknown status', () => {
    const history = [
      { maLichSu: 1, trangThaiMoi: 99, ghiChu: 'Note', khachHangXem: true },
    ]
    render(<OrderCustomerNotes history={history} />)
    expect(screen.getByText('Cập nhật đơn hàng')).toBeInTheDocument()
  })

  it('renders notes in order provided (API already sorted)', () => {
    const history = [
      { maLichSu: 1, trangThaiMoi: 2, ghiChu: 'First', khachHangXem: true },
      { maLichSu: 2, trangThaiMoi: 3, ghiChu: 'Second', khachHangXem: true },
      { maLichSu: 3, trangThaiMoi: 4, ghiChu: 'Third', khachHangXem: true },
    ]
    render(<OrderCustomerNotes history={history} />)
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
    expect(screen.getByText('Third')).toBeInTheDocument()
  })

  it('renders header text', () => {
    const history = [
      { maLichSu: 1, trangThaiMoi: 2, ghiChu: 'Note', khachHangXem: true },
    ]
    render(<OrderCustomerNotes history={history} />)
    expect(screen.getByText(/CẬP NHẬT ĐƠN HÀNG/)).toBeInTheDocument()
  })

  it('does not render empty card when all notes are internal', () => {
    const history = [
      { maLichSu: 1, trangThaiMoi: 2, ghiChu: 'Internal', khachHangXem: false },
    ]
    const { container } = render(<OrderCustomerNotes history={history} />)
    expect(container.querySelector('section')).not.toBeInTheDocument()
  })

  it('handles null history gracefully', () => {
    const { container } = render(<OrderCustomerNotes history={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('handles undefined history gracefully', () => {
    const { container } = render(<OrderCustomerNotes history={undefined} />)
    expect(container.innerHTML).toBe('')
  })

  it('filters out entries with whitespace-only ghiChu', () => {
    const history = [
      { maLichSu: 1, trangThaiMoi: 2, ghiChu: '   \n\t  ', khachHangXem: true },
    ]
    const { container } = render(<OrderCustomerNotes history={history} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders long note content without truncation', () => {
    const longNote = 'A'.repeat(500)
    const history = [
      { maLichSu: 1, trangThaiMoi: 6, ghiChu: longNote, khachHangXem: true },
    ]
    render(<OrderCustomerNotes history={history} />)
    expect(screen.getByText(longNote)).toBeInTheDocument()
  })

  it('renders special characters in notes', () => {
    const specialNote = '<script>alert(1)</script> & "quotes" - 100%'
    const history = [
      { maLichSu: 1, trangThaiMoi: 6, ghiChu: specialNote, khachHangXem: true },
    ]
    render(<OrderCustomerNotes history={history} />)
    expect(screen.getByText(specialNote)).toBeInTheDocument()
  })

  it('renders Vietnamese characters correctly', () => {
    const vnNote = 'Đơn hàng đã giao lúc 14:30. Cảm ơn bạn!'
    const history = [
      { maLichSu: 1, trangThaiMoi: 6, ghiChu: vnNote, khachHangXem: true },
    ]
    render(<OrderCustomerNotes history={history} />)
    expect(screen.getByText(vnNote)).toBeInTheDocument()
  })

  it('displays correct status labels for all customer-visible statuses', () => {
    const statuses = {
      1: 'Chờ xác nhận',
      2: 'Đã xác nhận',
      3: 'Chờ lấy hàng',
      4: 'Chờ giao hàng',
      5: 'Đã hủy',
      6: 'Giao hàng thành công',
      7: 'Yêu cầu trả hàng',
      8: 'Đã trả hàng',
      9: 'Giao hàng không thành công',
    }
    for (const [code, label] of Object.entries(statuses)) {
      const history = [
        { maLichSu: 1, trangThaiMoi: Number(code), ghiChu: 'Note', khachHangXem: true },
      ]
      const { unmount } = render(<OrderCustomerNotes history={history} />)
      expect(screen.getByText(label)).toBeInTheDocument()
      unmount()
    }
  })
})
