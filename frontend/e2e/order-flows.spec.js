import { test, expect } from '@playwright/test'

const customerEmail = process.env.E2E_CUSTOMER_EMAIL
const customerPassword = process.env.E2E_CUSTOMER_PASSWORD
const adminEmail = process.env.E2E_ADMIN_EMAIL
const adminPassword = process.env.E2E_ADMIN_PASSWORD
const orderId = process.env.E2E_ORDER_ID
const hasAccounts = customerEmail && customerPassword && adminEmail && adminPassword

test.describe('ZestStore order flows', () => {
  test.skip(!hasAccounts, 'Set E2E_CUSTOMER_EMAIL/PASSWORD and E2E_ADMIN_EMAIL/PASSWORD to run against a real environment')

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  async function login(page, email, password) {
    await page.getByPlaceholder(/email hoặc số điện thoại/i).fill(email)
    await page.getByPlaceholder(/mật khẩu/i).fill(password)
    await page.getByRole('button', { name: /đăng nhập/i }).click()
    await expect(page).not.toHaveURL(/\/login$/)
  }

  test('mua hàng online bằng COD', async ({ page }) => {
    await login(page, customerEmail, customerPassword)
    await page.goto('/products')
    await page.locator('a[href^="/products/"]').first().click()
    await page.getByRole('button', { name: /thêm giỏ hàng/i }).click()
    await page.goto('/cart')
    await page.getByRole('button', { name: /tiếp tục thanh toán/i }).click()
    await expect(page).toHaveURL(/\/checkout$/)
    await page.getByRole('button', { name: /đặt hàng/i }).click()
    await page.getByRole('button', { name: /xác nhận đặt hàng/i }).click()
    await expect(page).toHaveURL(/\/order-success|\/orders\//)
  })

  test('thanh toán POS', async ({ page }) => {
    await login(page, adminEmail, adminPassword)
    await page.goto('/admin/pos')
    await expect(page.getByText(/sản phẩm giỏ hàng/i)).toBeVisible()
    await page.getByRole('button', { name: /thêm sản phẩm/i }).click()
    const productDialog = page.getByRole('dialog', { name: /thêm sản phẩm vào giỏ hàng/i })
    await productDialog.getByRole('button', { name: /thêm vào giỏ/i }).first().click()
    await productDialog.getByRole('button', { name: /đóng lại/i }).click()
    await page.getByRole('button', { name: /khách thanh toán/i }).click()
    const paymentDialog = page.getByRole('dialog', { name: 'Thanh toán' })
    await paymentDialog.getByRole('button', { name: 'Trả đúng' }).click()
    await paymentDialog.getByRole('button', { name: 'XÁC NHẬN' }).click()
    await page.getByRole('button', { name: /xác nhận thanh toán/i }).click()
    await page.getByRole('button', { name: 'XÁC NHẬN' }).last().click()
    await expect(page.getByText(/thanh toán thành công/i)).toBeVisible()
  })

  test('admin cập nhật trạng thái có và không thông báo khách hàng', async ({ page }) => {
    test.skip(!orderId, 'Set E2E_ORDER_ID to an existing order id')
    await login(page, adminEmail, adminPassword)
    await page.goto(`/admin/orders/${orderId}`)
    await page.getByRole('button', { name: /cập nhật trạng thái/i }).click()
    await page.getByLabel(/ghi chú/i).fill('Thông báo công khai từ E2E')
    await page.getByLabel(/thông báo cho khách hàng/i).check()
    await page.getByRole('button', { name: /lưu thay đổi/i }).click()
    await page.getByRole('button', { name: /xác nhận/i }).click()
    await expect(page.getByText(/đã cập nhật sang/i)).toBeVisible()

    await page.getByRole('button', { name: /cập nhật trạng thái/i }).click()
    await page.getByLabel(/ghi chú/i).fill('Ghi chú nội bộ từ E2E')
    await page.getByRole('button', { name: /lưu thay đổi/i }).click()
    await page.getByRole('button', { name: /xác nhận/i }).click()
    await expect(page.getByText(/đã cập nhật sang/i)).toBeVisible()
  })
})
