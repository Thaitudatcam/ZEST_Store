import { http, HttpResponse } from 'msw'
import { variants, categories, colors, sizes, coupons, customers, pointsRule } from './data'

let orderCounter = 100

export const handlers = [
  http.get('/api/products/admin/variant-list', () => {
    return HttpResponse.json(variants)
  }),

  http.get('/api/categories/active', () => {
    return HttpResponse.json(categories)
  }),

  http.get('/api/colors', () => {
    return HttpResponse.json(colors)
  }),

  http.get('/api/sizes', () => {
    return HttpResponse.json(sizes)
  }),

  http.get('/api/admin/pos/scan', ({ request }) => {
    const url = new URL(request.url)
    const sku = url.searchParams.get('sku')
    const found = variants.find(v => v.sku === sku || v.maCTSP === sku)
    if (found) return HttpResponse.json(found)
    return HttpResponse.json({ message: 'Không tìm thấy sản phẩm' }, { status: 404 })
  }),

  http.get('/api/admin/customers/search', ({ request }) => {
    const url = new URL(request.url)
    const q = url.searchParams.get('q')?.toLowerCase() || ''
    const results = customers.filter(c =>
      c.hoTen.toLowerCase().includes(q) || c.soDienThoai.includes(q) || c.email.includes(q)
    )
    return HttpResponse.json(results)
  }),

  http.post('/api/admin/customers', async ({ request }) => {
    const body = await request.json()
    const newCustomer = { maNguoiDung: customers.length + 1, ...body }
    customers.push(newCustomer)
    return HttpResponse.json(newCustomer)
  }),

  http.post('/api/admin/pos/validate-coupon', async ({ request }) => {
    const body = await request.json()
    const coupon = coupons.find(c => c.maCode === body.maCode?.toUpperCase())
    if (coupon) return HttpResponse.json(coupon)
    return HttpResponse.json({ hopLe: false, lyDoTuChoi: 'Mã giảm giá không hợp lệ' })
  }),

  http.get('/api/coupons/available', () => {
    return HttpResponse.json(coupons)
  }),

  http.get('/api/vi-zeststore/diem/:userId', ({ params }) => {
    return HttpResponse.json({ soDiem: 150 })
  }),

  http.get('/api/diem-quy-tac', () => {
    return HttpResponse.json(pointsRule)
  }),

  http.post('/api/admin/pos/orders', async ({ request }) => {
    const body = await request.json()
    orderCounter++
    return HttpResponse.json({
      maDonHang: orderCounter,
      maDonHangCode: `POS-${orderCounter}`,
      tongTien: 350000,
      soTienGiam: 0,
      thanhToan: 350000,
      message: 'Tạo đơn hàng thành công',
    })
  }),

  http.post('/api/admin/pos/vietqr/preview', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      qrUrl: 'https://placehold.co/400x400/ffffff/000000?text=VietQR',
      bankName: 'Vietcombank',
      accountNumber: '1234567890',
      accountName: 'CONG TY ZESTSTORE',
      amount: body.amount,
    })
  }),

  http.get('/api/shipping/provinces', () => {
    return HttpResponse.json([
      { ma: '01', ten: 'Hà Nội' },
      { ma: '79', ten: 'Hồ Chí Minh' },
      { ma: '48', ten: 'Đà Nẵng' },
    ])
  }),

  http.get('/api/shipping/districts/:provinceId', () => {
    return HttpResponse.json([
      { ma: '001', ten: 'Hoàn Kiếm' },
      { ma: '002', ten: 'Ba Đình' },
      { ma: '003', ten: 'Đống Đa' },
    ])
  }),

  http.get('/api/shipping/wards/:districtId', () => {
    return HttpResponse.json([
      { ma: '00001', ten: 'Phúc Xá' },
      { ma: '00002', ten: 'Trúc Bạch' },
    ])
  }),

  http.get('/api/shipping/calc', () => {
    return HttpResponse.json({ fee: 30000 })
  }),

  http.get('/api/products', () => {
    return HttpResponse.json({ content: variants, totalElements: variants.length })
  }),

  http.post('/api/auth/login', () => {
    return HttpResponse.json({ token: 'mock-jwt-token', user: { hoTen: 'Admin', vaiTro: 'ADMIN', email: 'admin@zeststore.vn' } })
  }),

  http.get('/api/auth/me', () => {
    return HttpResponse.json({ hoTen: 'Admin', vaiTro: 'ADMIN', email: 'admin@zeststore.vn' })
  }),
]
