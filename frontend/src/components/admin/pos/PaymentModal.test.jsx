import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import PaymentModal from './PaymentModal'

describe('PaymentModal', () => {
  it('does not show change and only confirms after enough cash is entered', () => {
    const onConfirmPaid = vi.fn()
    const onClose = vi.fn()
    render(
      <PaymentModal
        open
        onClose={onClose}
        thanhTien={180000}
        placing={false}
        onConfirmPaid={onConfirmPaid}
      />,
    )

    expect(screen.queryByText('Tiền thừa')).not.toBeInTheDocument()
    const confirm = screen.getByRole('button', { name: 'XÁC NHẬN' })
    expect(confirm).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Tiền khách đưa'), { target: { value: '200000' } })
    expect(confirm).toBeEnabled()
    fireEvent.click(confirm)

    expect(onConfirmPaid).toHaveBeenCalledWith(200000)
    expect(onClose).toHaveBeenCalledOnce()
  })
})
