import type { Database } from '@/lib/database.types'

export type CouponRow = Database['public']['Tables']['coupons']['Row']

export function validateCoupon(
  coupon: CouponRow,
  subtotalCentavos: number,
  now: Date,
): { valid: boolean; reason?: string } {
  if (!coupon.is_active) {
    return { valid: false, reason: 'El cupón no está activo.' }
  }

  if (coupon.starts_at !== null && now < new Date(coupon.starts_at)) {
    return { valid: false, reason: 'El cupón aún no está vigente.' }
  }

  if (coupon.ends_at !== null && now > new Date(coupon.ends_at)) {
    return { valid: false, reason: 'El cupón ya expiró.' }
  }

  if (subtotalCentavos < coupon.min_order) {
    return { valid: false, reason: `El monto mínimo para este cupón es ${coupon.min_order / 100}.` }
  }

  if (coupon.max_redemptions !== null && coupon.redeemed_count >= coupon.max_redemptions) {
    return { valid: false, reason: 'El cupón alcanzó el límite de usos.' }
  }

  return { valid: true }
}
