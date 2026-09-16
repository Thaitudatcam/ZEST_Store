import test from 'node:test'
import assert from 'node:assert/strict'
import { createDraft, appendDraft, removeDraft, sameQuantities } from './drafts.js'

test('restored draft must match server quantities, not just product IDs', () => {
  assert.equal(sameQuantities([{ maBienThe: 1, soLuong: 2 }], [{ maBienThe: 1, soLuong: 1 }]), false)
  assert.equal(sameQuantities([{ maBienThe: 1, soLuong: 2 }], []), false)
  assert.equal(sameQuantities([{ maBienThe: 1, soLuong: 2 }, { maBienThe: 2, soLuong: 1 }],
    [{ maBienThe: 2, soLuong: 1 }, { maBienThe: 1, soLuong: 2 }]), true)
})

test('opens the new tab and assigns different retry keys', () => {
  const first = createDraft(1)
  const next = appendDraft([first])
  assert.equal(next.index, 1)
  assert.notEqual(next.orders[0].checkoutKey, next.orders[1].checkoutKey)
})
test('limits concurrent drafts to ten, permits more sales after checkout', () => {
  let orders = [createDraft(1)]
  for (let i = 1; i < 10; i++) orders = appendDraft(orders).orders
  assert.equal(appendDraft(orders).index, -1)
  for (let sale = 0; sale < 25; sale++) {
    orders = removeDraft(orders, 0, 0).orders
    const next = appendDraft(orders)
    assert.equal(next.orders.length, 10)
    assert.equal(next.index, 9)
    orders = next.orders
  }
})
test('closing a different tab preserves the active customer and shipment', () => {
  const orders = [createDraft(1), { ...createDraft(2), customer: { maNguoiDung: 9 }, shippingInfo: { diaChi: '123 ABC' } }]
  const next = removeDraft(orders, 1, 0)
  assert.equal(next.index, 0)
  assert.deepEqual(next.orders[0], orders[1])
})
test('completing last draft creates a fresh checkout key', () => {
  const old = createDraft(1)
  const next = removeDraft([old], 0, 0)
  assert.equal(next.orders.length, 1)
  assert.notEqual(next.orders[0].checkoutKey, old.checkoutKey)
})
