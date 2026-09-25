import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import InvoicePrint from './InvoicePrint'

describe('Sales receipt', () => {
  it('identifies a cancelled order and keeps the order code', () => {
    render(<InvoicePrint data={{ maHoaDonCode: 'DH0154', nguoiTaoTen: 'Nhân viên A',
      donHang: { maDonHangCode: 'DH0154', trangThaiDon: 5, loaiDonHang: 2, tongTien: 100000 },
      chiTiet: [{ tenSanPham: 'Áo lúc bán', donGia: 100000, soLuong: 1, thanhTien: 100000 }],
      thanhToans: [] }} />)
    expect(screen.getByText('ĐÃ HỦY')).toBeInTheDocument()
    expect(screen.getByText('PHIẾU ĐƠN HÀNG')).toBeInTheDocument()
    expect(screen.getAllByText('DH0154')).toHaveLength(2)
    expect(screen.getByText('Áo lúc bán')).toBeInTheDocument()
    expect(screen.queryByText('Đã thanh toán')).not.toBeInTheDocument()
  })
  it('prints a separate invoice code and preserves the void notice', () => {
    render(<InvoicePrint data={{ documentType: 'INVOICE', maHoaDonCode: 'HD0001',
      invoice: { status: 'VOID', voidReason: 'Sai thông tin người mua' },
      donHang: { maDonHangCode: 'DH0154', tongTien: 100000 },
      chiTiet: [{ tenSanPham: 'Tên tại thời điểm lập', donGia: 100000, soLuong: 1, thanhTien: 100000 }] }} />)
    expect(screen.getByText('HÓA ĐƠN BÁN HÀNG NỘI BỘ')).toBeInTheDocument()
    expect(screen.getByText('HD0001')).toBeInTheDocument()
    expect(screen.getByText('DH0154')).toBeInTheDocument()
    expect(screen.getByText('HÓA ĐƠN ĐÃ HỦY')).toBeInTheDocument()
    expect(screen.getByText('Sai thông tin người mua')).toBeInTheDocument()
  })
})
