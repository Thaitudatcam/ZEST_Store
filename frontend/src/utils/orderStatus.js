export const ORDER_TRANSITIONS = {
  1: [2, 5],
  2: [3, 5],
  3: [4, 5],
  4: [6, 9],
  6: [7],
  7: [8, 6],
}

export function getAdminNextStatuses(order, payments = []) {
  if (!order || order.stockState === 'LEGACY') return []
  const hasUnpaidOnline = payments.some(payment => (
    payment.phuongThuc > 1 && payment.trangThaiThanhToan !== 2
  ))
  const hasSuccessfulPayment = payments.some(payment => payment.trangThaiThanhToan === 2)
  return (ORDER_TRANSITIONS[order.trangThaiDon] || []).filter(status => {
    if (hasUnpaidOnline && [2, 3, 4, 6].includes(status)) return false
    if (hasSuccessfulPayment && status === 5) return false
    return true
  })
}
