import { describe, it, expect } from 'vitest'
import { validateCoupon } from './coupon'

type CouponRow = {
  id: string
  code: string
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  min_order: number
  redeemed_count: number
  max_redemptions: number | null
  type: 'percent' | 'fixed'
  value: number
}

const baseCoupon: CouponRow = {
  id: '1',
  code: 'TEST10',
  is_active: true,
  starts_at: null,
  ends_at: null,
  min_order: 0,
  redeemed_count: 0,
  max_redemptions: null,
  type: 'percent',
  value: 10,
}

const now = new Date('2025-06-01T12:00:00Z')

describe('validateCoupon', () => {
  it('active coupon with no date constraints and sufficient subtotal is valid', () => {
    const result = validateCoupon(baseCoupon, 10000, now)
    expect(result.valid).toBe(true)
  })

  it('is_active=false is invalid', () => {
    const result = validateCoupon({ ...baseCoupon, is_active: false }, 10000, now)
    expect(result.valid).toBe(false)
    expect(result.reason).toBeDefined()
  })

  it('starts_at in the future is invalid', () => {
    const result = validateCoupon({ ...baseCoupon, starts_at: '2025-07-01T00:00:00Z' }, 10000, now)
    expect(result.valid).toBe(false)
    expect(result.reason).toBeDefined()
  })

  it('ends_at in the past is invalid', () => {
    const result = validateCoupon({ ...baseCoupon, ends_at: '2025-05-01T00:00:00Z' }, 10000, now)
    expect(result.valid).toBe(false)
    expect(result.reason).toBeDefined()
  })

  it('subtotal below min_order is invalid', () => {
    const result = validateCoupon({ ...baseCoupon, min_order: 20000 }, 10000, now)
    expect(result.valid).toBe(false)
    expect(result.reason).toBeDefined()
  })

  it('redeemed_count >= max_redemptions is invalid', () => {
    const result = validateCoupon({ ...baseCoupon, max_redemptions: 5, redeemed_count: 5 }, 10000, now)
    expect(result.valid).toBe(false)
    expect(result.reason).toBeDefined()
  })

  it('max_redemptions=null means unlimited, is valid', () => {
    const result = validateCoupon({ ...baseCoupon, max_redemptions: null, redeemed_count: 9999 }, 10000, now)
    expect(result.valid).toBe(true)
  })

  it('exactly at starts_at boundary is valid', () => {
    const result = validateCoupon({ ...baseCoupon, starts_at: '2025-06-01T12:00:00Z' }, 10000, now)
    expect(result.valid).toBe(true)
  })

  it('exactly at ends_at boundary is valid (still active)', () => {
    const result = validateCoupon({ ...baseCoupon, ends_at: '2025-06-01T12:00:00Z' }, 10000, now)
    expect(result.valid).toBe(true)
  })
})
