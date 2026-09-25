import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import api from '../api/axios'
import OrderInvoiceLink from './OrderInvoiceLink'

vi.mock('../api/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
beforeEach(() => vi.resetAllMocks())
const show = status => render(<MemoryRouter><OrderInvoiceLink orderId={12} status={status} /></MemoryRouter>)
describe('Order invoice link', () => {
  it('links an existing invoice without reissuing it', async () => {
    api.get.mockResolvedValue({ data: { invoice: { id: 3, code: 'HD0003', status: 'ISSUED' } } })
    show(6)
    expect(await screen.findByRole('link', { name: /HD0003/ })).toHaveAttribute('href', '/admin/invoices/3')
    expect(api.post).not.toHaveBeenCalled()
  })
  it('allows explicitly issuing an old completed order', async () => {
    api.get.mockResolvedValue({ data: {} })
    api.post.mockResolvedValue({ data: { id: 4, code: 'HD0004' } })
    show(6)
    fireEvent.click(await screen.findByRole('button', { name: /Lập hóa đơn/ }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admin/invoices/order/12'))
    expect(await screen.findByRole('link', { name: /HD0004/ })).toBeInTheDocument()
  })
  it('does not offer issuance for an unfinished order', async () => {
    api.get.mockResolvedValue({ data: {} })
    show(2)
    expect(await screen.findByText('Hóa đơn được tự động lập khi đơn hoàn thành.')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
