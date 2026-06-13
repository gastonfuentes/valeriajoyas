// Pure pricing logic — the single source of truth for money math.
//
// Every amount is an integer number of centavos (ARS). No floats are stored,
// and NONE of these figures may ever come from the client: the server resolves
// unit prices from the database and runs them through here. This module is
// unit-tested (pricing.test.ts) because a bug here is money lost or a customer
// mischarged.

export type PricingLine = {
  variantId: string
  /** Unit price in centavos, resolved server-side from the DB (variant.price ?? product.base_price). */
  unitPrice: number
  quantity: number
}

export type PricingCoupon = {
  type: 'percent' | 'fixed'
  /** percent: 0..100 ; fixed: centavos */
  value: number
  /** Minimum subtotal (centavos) for the coupon to apply. */
  minOrder: number
}

export type PricingShipping = {
  /** Shipping cost in centavos. */
  cost: number
  /** Net subtotal (centavos) at/above which shipping is free; null disables free shipping. */
  freeThreshold: number | null
  /** Store pickup => no shipping charged. */
  pickup: boolean
}

export type Totals = {
  subtotal: number
  discountTotal: number
  shippingTotal: number
  total: number
}

export function computeSubtotal(lines: PricingLine[]): number {
  let subtotal = 0
  for (const item of lines) {
    if (!Number.isInteger(item.unitPrice) || item.unitPrice < 0) {
      throw new Error(`Invalid unitPrice for variant ${item.variantId}: ${item.unitPrice}`)
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error(`Invalid quantity for variant ${item.variantId}: ${item.quantity}`)
    }
    subtotal += item.unitPrice * item.quantity
  }
  return subtotal
}

export function computeDiscount(subtotal: number, coupon: PricingCoupon | null): number {
  if (!coupon) return 0
  if (subtotal < coupon.minOrder) return 0

  let discount: number
  if (coupon.type === 'percent') {
    const pct = Math.min(Math.max(coupon.value, 0), 100)
    discount = Math.round((subtotal * pct) / 100)
  } else {
    discount = coupon.value
  }

  // A discount can never exceed the subtotal — the total must stay >= 0.
  return Math.min(Math.max(discount, 0), subtotal)
}

export function computeShipping(netSubtotal: number, shipping: PricingShipping): number {
  if (shipping.pickup) return 0
  if (shipping.freeThreshold !== null && netSubtotal >= shipping.freeThreshold) return 0
  return Math.max(shipping.cost, 0)
}

export function computeTotals(
  lines: PricingLine[],
  coupon: PricingCoupon | null,
  shipping: PricingShipping,
): Totals {
  const subtotal = computeSubtotal(lines)
  const discountTotal = computeDiscount(subtotal, coupon)
  const netSubtotal = subtotal - discountTotal
  const shippingTotal = computeShipping(netSubtotal, shipping)
  const total = Math.max(netSubtotal + shippingTotal, 0)
  return { subtotal, discountTotal, shippingTotal, total }
}
