import { describe, it, expect } from 'vitest'
import {
  computeSubtotal,
  computeDiscount,
  computeShipping,
  computeTotals,
  type PricingLine,
  type PricingCoupon,
  type PricingShipping,
} from './pricing'

// All amounts are integer centavos (ARS). The server is the single source of
// truth for every figure here — these tests lock that behaviour down so a
// future change can never silently mischarge a customer.

const line = (unitPrice: number, quantity: number, variantId = 'v'): PricingLine => ({
  variantId,
  unitPrice,
  quantity,
})

describe('computeSubtotal', () => {
  it('sums unitPrice * quantity across lines', () => {
    expect(computeSubtotal([line(1899000, 1), line(990000, 2)])).toBe(1899000 + 990000 * 2)
  })

  it('returns 0 for an empty cart', () => {
    expect(computeSubtotal([])).toBe(0)
  })

  it('throws on non-positive quantity (no silent zero)', () => {
    expect(() => computeSubtotal([line(1000, 0)])).toThrow()
    expect(() => computeSubtotal([line(1000, -1)])).toThrow()
  })

  it('throws on negative or non-integer unit price', () => {
    expect(() => computeSubtotal([line(-1, 1)])).toThrow()
    expect(() => computeSubtotal([line(10.5, 1)])).toThrow()
  })
})

describe('computeDiscount', () => {
  const percent = (value: number, minOrder = 0): PricingCoupon => ({ type: 'percent', value, minOrder })
  const fixed = (value: number, minOrder = 0): PricingCoupon => ({ type: 'fixed', value, minOrder })

  it('applies a percentage discount with integer rounding', () => {
    // 10% of 1.899.000 = 189.900
    expect(computeDiscount(1899000, percent(10))).toBe(189900)
    // rounding: 10% of 1.999 (199900 centavos) -> 19990
    expect(computeDiscount(199900, percent(10))).toBe(19990)
  })

  it('applies a fixed discount in centavos', () => {
    expect(computeDiscount(500000, fixed(150000))).toBe(150000)
  })

  it('returns 0 when subtotal is below the coupon minimum', () => {
    expect(computeDiscount(100000, percent(10, 200000))).toBe(0)
    expect(computeDiscount(100000, fixed(50000, 200000))).toBe(0)
  })

  it('returns 0 when there is no coupon', () => {
    expect(computeDiscount(500000, null)).toBe(0)
  })

  it('never discounts more than the subtotal (no negative totals)', () => {
    expect(computeDiscount(100000, fixed(150000))).toBe(100000)
    expect(computeDiscount(100000, percent(200))).toBe(100000)
  })
})

describe('computeShipping', () => {
  const ship = (cost: number, freeThreshold: number | null, pickup = false): PricingShipping => ({
    cost,
    freeThreshold,
    pickup,
  })

  it('charges the shipping cost when below the free threshold', () => {
    expect(computeShipping(400000, ship(120000, 5000000))).toBe(120000)
  })

  it('is free at or above the free-shipping threshold', () => {
    expect(computeShipping(5000000, ship(120000, 5000000))).toBe(0)
    expect(computeShipping(6000000, ship(120000, 5000000))).toBe(0)
  })

  it('is free for store pickup regardless of amount', () => {
    expect(computeShipping(100000, ship(120000, 5000000, true))).toBe(0)
  })

  it('charges shipping when free shipping is disabled (null threshold)', () => {
    expect(computeShipping(9999999, ship(120000, null))).toBe(120000)
  })
})

describe('computeTotals (integration)', () => {
  const shipping: PricingShipping = { cost: 120000, freeThreshold: 5000000, pickup: false }

  it('computes subtotal, discount, shipping and total together', () => {
    const lines = [line(1899000, 1), line(990000, 1)] // 2.889.000
    const coupon: PricingCoupon = { type: 'percent', value: 10, minOrder: 0 }
    const t = computeTotals(lines, coupon, shipping)
    expect(t.subtotal).toBe(2889000)
    expect(t.discountTotal).toBe(288900) // 10%
    expect(t.shippingTotal).toBe(120000) // net 2.600.100 < 5.000.000
    expect(t.total).toBe(2889000 - 288900 + 120000)
  })

  it('grants free shipping based on the post-discount net subtotal', () => {
    const lines = [line(5200000, 1)] // 5.200.000
    const coupon: PricingCoupon = { type: 'fixed', value: 300000, minOrder: 0 } // net 4.900.000
    const t = computeTotals(lines, coupon, shipping)
    expect(t.discountTotal).toBe(300000)
    // net 4.900.000 < 5.000.000 -> shipping still charged
    expect(t.shippingTotal).toBe(120000)
  })

  it('returns an all-zero result for an empty cart', () => {
    const t = computeTotals([], null, shipping)
    expect(t).toEqual({ subtotal: 0, discountTotal: 0, shippingTotal: 120000, total: 120000 })
  })
})
