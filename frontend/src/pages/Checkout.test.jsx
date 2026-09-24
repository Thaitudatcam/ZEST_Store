import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Checkout from './Checkout'
import api from '../api/axios'
import { placeOrder } from '../api/orders'
import { calculateShippingFee } from '../api/ghn'
import { createVnPayPayment } from '../api/payment'
import { getCart } from '../api/cart'

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }))
vi.mock('../api/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
vi.mock('../api/orders', () => ({ placeOrder: vi.fn() }))
vi.mock('../api/cart', () => ({ getCart: vi.fn() }))
vi.mock('../api/users', () => ({
  getAddresses: vi.fn().mockResolvedValue([{
    maDiaChi: 1, tenNguoiNhan: 'Khách thử nghiệm', soDienThoai: '0901234567',
    chiTietDiaChi: '12 Đường thử nghiệm', tinhThanhPho: 'Hà Nội',
    quanHuyen: 'Ba Đình', phuongXa: 'Phúc Xá', provinceId: 1, districtId: 10, wardCode: '100', laMacDinh: true,
  }]),
  getProfile: vi.fn().mockResolvedValue({ email: 'checkout@example.test' }),
  addAddress: vi.fn(),
}))
vi.mock('../api/address', () => ({
  getProvinces: vi.fn().mockResolvedValue([{ ProvinceID: 1, ProvinceName: 'Hà Nội' }]),
  getDistricts: vi.fn().mockResolvedValue([{ DistrictID: 10, DistrictName: 'Ba Đình' }]),
  getWards: vi.fn().mockResolvedValue([{ WardCode: '100', WardName: 'Phúc Xá' }]),
}))
vi.mock('../api/ghn', () => ({
  getServices: vi.fn().mockResolvedValue([]),
  calculateShippingFee: vi.fn(),
}))
vi.mock('../api/payment', () => ({
  createVnPayPayment: vi.fn(), createVietQrPayment: vi.fn(), createZaloPayPayment: vi.fn(),
  confirmVietQrPayment: vi.fn(),
}))
vi.mock('../context/ToastContext', () => ({ useToast: () => ({ error: toastError }) }))
vi.mock('../context/CartContext', () => ({ useCart: () => ({ refreshCount: vi.fn() }) }))

const cart = [
  { maBienThe: 11, maSanPham: 1, tenSanPham: 'Polo trắng', donGia: 100000, soLuong: 2 },
  { maBienThe: 22, maSanPham: 2, tenSanPham: 'Polo đen', donGia: 400000, soLuong: 1 },
]
const sale = { maCode: 'SALE10', kieuGiamGia: 1, giaTriGiam: 10, soTienGiam: 60000, giaTriDonToiThieu: 100000, trangThaiThucTe: 2 }
const alternative = { maCode: 'SAVE30K', kieuGiamGia: 2, giaTriGiam: 30000, soTienGiam: 30000, giaTriDonToiThieu: 0, trangThaiThucTe: 2 }
const ship = { maCode: 'FREESHIP', kieuGiamGia: 3, giaTriGiam: '0', soTienGiam: 0, trangThaiThucTe: 2 }

function renderCheckout(state = { selectedItems: cart }) {
  return render(<MemoryRouter initialEntries={[{ pathname: '/checkout', state }]}><Checkout /></MemoryRouter>)
}

function summary() {
  return screen.getByRole('heading', { name: 'Tóm tắt đơn hàng' }).parentElement
}

function expectTotal(amount) {
  const totalRow = within(summary()).getByText('Tổng thanh toán').parentElement
  expect(totalRow.textContent.replace(/[\s.₫]/g, '')).toBe(`Tổngthanhtoán${amount}`)
}

async function chooseCoupon(user, code) {
  const chooser = screen.getByRole('button', { name: /^Chọn mã$/ })
  if (chooser.getAttribute('aria-expanded') === 'false') await user.click(chooser)
  await user.click(await screen.findByRole('button', { name: `Chọn mã ${code}` }))
}

async function selectShippingAddress(user) {
  await screen.findByRole('button', { name: 'Hà Nội' })
  await user.click(screen.getByRole('button', { name: /^(Quận\/Huyện|Ba Đình)$/ }))
  await user.click(screen.getAllByRole('button', { name: 'Ba Đình' }).at(-1))
  await user.click(screen.getByRole('button', { name: /^(Phường\/Xã|Phúc Xá)$/ }))
  await user.click(screen.getAllByRole('button', { name: 'Phúc Xá' }).at(-1))
  await waitFor(() => expect(screen.getByRole('button', { name: 'ĐẶT HÀNG' })).toBeEnabled())
}

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  getCart.mockResolvedValue(cart)
  calculateShippingFee.mockResolvedValue({ fee: 30000 })
  api.get.mockResolvedValue({ data: [sale, ship] })
  api.post.mockImplementation(async (url, body) => {
    if (url === '/coupons/best-offer') return { data: { found: false } }
    return { data: body.maCode === 'FREESHIP' ? ship : body.maCode === 'SAVE30K' ? alternative : sale }
  })
  placeOrder.mockResolvedValue({ maDonHang: 100, phuongThucThanhToan: 1, tongTien: 570000 })
})

describe('Online checkout coupons', () => {
  it('automatically applies the best offer and still lets the customer choose another code', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue({ data: [sale, alternative] })
    api.post.mockImplementation(async (url, body) => {
      if (url === '/coupons/best-offer') return { data: { ...sale, found: true, isBest: true } }
      return { data: body.maCode === 'SAVE30K' ? alternative : sale }
    })

    renderCheckout()

    expect(await screen.findByText('Tự động chọn mã tốt nhất')).toBeInTheDocument()
    expect(screen.getByText(/Đã tự động chọn mã tốt nhất SALE10/)).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/coupons/best-offer', { items: [
      { maSanPham: 1, thanhTien: 200000 },
      { maSanPham: 2, thanhTien: 400000 },
    ] }, { params: {
      tongTien: 600000, maSanPhamIds: '1,2', maNguoiDung: undefined, pos: false,
    } })
    expectTotal(570000)

    await user.click(screen.getByRole('button', { name: /^Chọn mã$/ }))
    await user.click(screen.getByRole('button', { name: 'Chọn mã SAVE30K' }))
    expect(await screen.findByRole('button', { name: 'Bỏ mã SAVE30K' })).toBeEnabled()
    expect(screen.queryByText('Tự động chọn mã tốt nhất')).not.toBeInTheDocument()
    expectTotal(600000)
  })

  it('loads coupons for the selected products and submits the server-validated discount with COD', async () => {
    const user = userEvent.setup()
    // The eligible products only receive 20,000, despite the list estimate of 60,000.
    api.post.mockResolvedValue({ data: { ...sale, soTienGiam: 20000 } })
    renderCheckout()
    await selectShippingAddress(user)
    await chooseCoupon(user, 'SALE10')
    expect(api.get).toHaveBeenCalledWith('/coupons/available', { params: { tongTien: 600000, maSanPhamIds: '1,2', maNguoiDung: undefined } })
    expect(api.post).toHaveBeenCalledWith('/coupons/validate', {
      maCode: 'SALE10', tongTien: 600000, maSanPhamIds: [1, 2],
      items: [{ maSanPham: 1, thanhTien: 200000 }, { maSanPham: 2, thanhTien: 400000 }],
    })
    expectTotal(610000)
    await user.click(screen.getByRole('button', { name: 'ĐẶT HÀNG' }))
    expect(toastError).not.toHaveBeenCalled()
    expect(screen.getAllByText('Giảm tiền hàng (SALE10)')).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'XÁC NHẬN ĐẶT HÀNG' }))
    expect(placeOrder).toHaveBeenCalledWith(expect.objectContaining({
      maCode: 'SALE10', maCodeFreeship: undefined, expectedTotal: 610000,
      phiVanChuyen: 30000, maBienTheList: [11, 22], phuongThucThanhToan: 1,
    }))
  })

  it('supports entering a code and removing it to restore the total', async () => {
    const user = userEvent.setup()
    renderCheckout()
    await waitFor(() => expect(screen.getByRole('button', { name: 'ĐẶT HÀNG' })).toBeEnabled())
    await user.type(screen.getByRole('textbox', { name: 'Nhập mã giảm giá' }), ' SALE10 ')
    await user.click(screen.getByRole('button', { name: 'Chọn mã' }))
    expectTotal(570000)
    await user.click(screen.getByRole('button', { name: 'Bỏ mã SALE10' }))
    expectTotal(630000)
    expect(screen.queryByText('Giảm tiền hàng (SALE10)')).not.toBeInTheDocument()
  })

  it('retains a previously applied discount when another code is rejected', async () => {
    const user = userEvent.setup()
    renderCheckout()
    await waitFor(() => expect(screen.getByRole('button', { name: 'ĐẶT HÀNG' })).toBeEnabled())
    await chooseCoupon(user, 'SALE10')
    api.post.mockRejectedValueOnce({ response: { data: { message: 'Mã giảm giá đã hết hạn' } } })
    await user.type(screen.getByRole('textbox', { name: 'Nhập mã giảm giá' }), 'EXPIRED')
    await user.click(screen.getByRole('button', { name: 'Chọn mã' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Mã giảm giá đã hết hạn')
    expect(screen.getByRole('button', { name: 'Bỏ mã SALE10' })).toBeEnabled()
    expectTotal(570000)
  })

  it('blocks order placement and duplicate validation while checking a coupon', async () => {
    const user = userEvent.setup()
    let resolveValidation
    renderCheckout()
    await waitFor(() => expect(screen.getByRole('button', { name: 'ĐẶT HÀNG' })).toBeEnabled())
    api.post.mockImplementationOnce(() => new Promise(resolve => { resolveValidation = resolve }))
    await user.type(screen.getByRole('textbox', { name: 'Nhập mã giảm giá' }), 'SALE10')
    await user.click(screen.getByRole('button', { name: 'Chọn mã' }))
    expect(screen.getByRole('button', { name: 'ĐẶT HÀNG' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Chọn mã' })).toBeDisabled()
    expect(api.post.mock.calls.filter(([url]) => url === '/coupons/validate')).toHaveLength(1)
    expect(placeOrder).not.toHaveBeenCalled()
    await act(async () => { resolveValidation({ data: sale }) })
    expect(screen.getByRole('button', { name: 'ĐẶT HÀNG' })).toBeEnabled()
    expectTotal(570000)
  })

  it('combines product and shipping discounts once and carries both codes into a VNPay order', async () => {
    const user = userEvent.setup()
    placeOrder.mockResolvedValueOnce({ maDonHang: 101, phuongThucThanhToan: 2, tongTien: 540000 })
    // Do not navigate to a payment provider from this test.
    createVnPayPayment.mockReturnValueOnce(new Promise(() => {}))
    renderCheckout()
    await selectShippingAddress(user)
    await chooseCoupon(user, 'SALE10')
    await chooseCoupon(user, 'FREESHIP')
    expectTotal(540000)
    await user.click(screen.getByRole('radio', { name: 'VNPay' }))
    await user.click(screen.getByRole('button', { name: 'ĐẶT HÀNG' }))
    expect(screen.getAllByText('Giảm phí vận chuyển (FREESHIP)')).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'XÁC NHẬN ĐẶT HÀNG' }))
    expect(placeOrder).toHaveBeenCalledWith(expect.objectContaining({
      maCode: 'SALE10', maCodeFreeship: 'FREESHIP', expectedTotal: 540000, phuongThucThanhToan: 2,
    }))
    expect(createVnPayPayment).toHaveBeenCalledWith(101)
  })

  it('rejects an exclusive combination even when the code was entered manually', async () => {
    const user = userEvent.setup()
    renderCheckout()
    await waitFor(() => expect(screen.getByRole('button', { name: 'ĐẶT HÀNG' })).toBeEnabled())
    await chooseCoupon(user, 'FREESHIP')
    api.post.mockResolvedValueOnce({ data: { ...sale, maCode: 'PRIVATE', exclusive: true } })
    await user.type(screen.getByRole('textbox', { name: 'Nhập mã giảm giá' }), 'PRIVATE')
    await user.click(screen.getByRole('button', { name: 'Chọn mã' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('không thể dùng cùng FREESHIP')
    expect(screen.queryByRole('button', { name: 'Bỏ mã PRIVATE' })).not.toBeInTheDocument()
    expectTotal(600000)
  })

  it('keeps manual entry usable when loading suggestions fails and allows retrying', async () => {
    const user = userEvent.setup()
    api.get.mockRejectedValueOnce(new Error('Network unavailable'))
    renderCheckout()
    await user.click(await screen.findByRole('button', { name: /^Chọn mã$/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Chưa tải được danh sách mã')
    expect(screen.getByRole('textbox', { name: 'Nhập mã giảm giá' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByRole('button', { name: 'Chọn mã SALE10' })).toBeEnabled()
  })

  it('disables vouchers whose minimum order or lifecycle requirements are not met', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValueOnce({ data: [
      { ...sale, maCode: 'MINIMUM', giaTriDonToiThieu: 1000000 },
      { ...sale, maCode: 'EXPIRED', trangThaiThucTe: 4, trangThaiThucTeText: 'Hết hạn' },
    ] })
    renderCheckout()
    await user.click(await screen.findByRole('button', { name: /^Chọn mã$/ }))
    expect(await screen.findByRole('button', { name: 'Chọn mã MINIMUM' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Chọn mã EXPIRED' })).toBeDisabled()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('uses server quantity and price after Buy Now merges with an existing cart item', async () => {
    const user = userEvent.setup()
    getCart.mockResolvedValueOnce([
      { ...cart[0], donGia: 122000, soLuong: 5, maSanPhamCode: 'SP0021', sku: 'SP0021-DEN-S' },
      cart[1],
    ])
    renderCheckout({ selectedItems: [{ ...cart[0], donGia: 100000, soLuong: 3 }] })
    await selectShippingAddress(user)
    expect(getCart).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Mã SP: SP0021')).toBeInTheDocument()
    expect(screen.queryByText('Polo đen')).not.toBeInTheDocument()
    expectTotal(640000)
    expect(calculateShippingFee).toHaveBeenLastCalledWith(expect.objectContaining({ weight: 2500 }))
    await user.click(screen.getByRole('button', { name: 'ĐẶT HÀNG' }))
    await user.click(screen.getByRole('button', { name: 'XÁC NHẬN ĐẶT HÀNG' }))
    expect(placeOrder).toHaveBeenCalledWith(expect.objectContaining({ expectedTotal: 640000, maBienTheList: [11] }))
  })

  it('loads only variant IDs passed by Buy Now and does not include unrelated cart items', async () => {
    const user = userEvent.setup()
    renderCheckout({ selectedVariantIds: [22] })
    await selectShippingAddress(user)
    expect(screen.queryByText('Polo trắng')).not.toBeInTheDocument()
    expectTotal(430000)
    await user.click(screen.getByRole('button', { name: 'ĐẶT HÀNG' }))
    await user.click(screen.getByRole('button', { name: 'XÁC NHẬN ĐẶT HÀNG' }))
    expect(placeOrder).toHaveBeenCalledWith(expect.objectContaining({ expectedTotal: 430000, maBienTheList: [22] }))
  })

  it('stops checkout if current cart data cannot be loaded instead of using a stale snapshot', async () => {
    const user = userEvent.setup()
    getCart.mockRejectedValueOnce(new Error('Không thể tải giỏ hàng'))
    renderCheckout()
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải giỏ hàng')
    expect(screen.queryByRole('button', { name: 'ĐẶT HÀNG' })).not.toBeInTheDocument()
    expect(placeOrder).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByRole('heading', { name: 'Tóm tắt đơn hàng' })).toBeInTheDocument()
  })

  it('does not order the entire cart if a selected variant no longer exists', async () => {
    getCart.mockResolvedValueOnce([cart[1]])
    renderCheckout({ selectedVariantIds: [11] })
    expect(await screen.findByRole('alert')).toHaveTextContent('không còn trong giỏ hàng')
    expect(placeOrder).not.toHaveBeenCalled()
  })

  it('keeps a rejected order message visible and reloads current totals without automatically ordering', async () => {
    const user = userEvent.setup()
    placeOrder.mockRejectedValueOnce({ response: { data: { message: 'Giá/khuyến mãi hoặc phí vận chuyển đã thay đổi' } } })
    renderCheckout()
    await selectShippingAddress(user)
    await chooseCoupon(user, 'SALE10')
    await user.click(screen.getByRole('button', { name: 'ĐẶT HÀNG' }))
    await user.click(screen.getByRole('button', { name: 'XÁC NHẬN ĐẶT HÀNG' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Giá/khuyến mãi hoặc phí vận chuyển đã thay đổi')
    getCart.mockResolvedValueOnce([{ ...cart[0], donGia: 150000 }, cart[1]])
    await user.click(screen.getByRole('button', { name: 'Tải lại thông tin đơn hàng' }))
    await selectShippingAddress(user)
    expectTotal(730000)
    expect(screen.queryByRole('button', { name: 'Bỏ mã SALE10' })).not.toBeInTheDocument()
    expect(placeOrder).toHaveBeenCalledTimes(1)
  })
})
