export const MAX_OPEN_ORDERS = 10

export function sameQuantities(left, right) {
  const quantities = rows => {
    const counts = new Map()
    for (const row of rows) counts.set(Number(row.maBienThe), (counts.get(Number(row.maBienThe)) || 0) + Number(row.soLuong))
    return counts
  }
  const a = quantities(left), b = quantities(right)
  return a.size === b.size && [...a].every(([id, qty]) => b.get(id) === qty)
}

export function createDraft(id) {
  return { id, checkoutKey: crypto.randomUUID(), cart: [], customer: null, coupon: null,
    loaiDon: 'TAI_QUAY', shippingInfo: {}, shippingFee: null, mienPhiVanChuyen: false,
    customerPaid: 0, paymentMethod: 5, paymentConfirmedTotal: null }
}

export function isPaymentReady(customerPaid, confirmedTotal, currentTotal) {
  return confirmedTotal !== null
    && Number(confirmedTotal) === Number(currentTotal)
    && Number(customerPaid) >= Number(currentTotal)
}

export function appendDraft(orders) {
  if (orders.length >= MAX_OPEN_ORDERS) return { orders, index: -1 }
  const next = [...orders, createDraft(Math.max(0, ...orders.map(o => o.id)) + 1)]
  return { orders: next, index: next.length - 1 }
}

export function removeDraft(orders, currentIndex, removeIndex) {
  const next = orders.filter((_, i) => i !== removeIndex)
  if (!next.length) next.push(createDraft(Math.max(0, ...orders.map(o => o.id)) + 1))
  const index = removeIndex < currentIndex ? currentIndex - 1 : Math.min(currentIndex, next.length - 1)
  return { orders: next, index }
}
