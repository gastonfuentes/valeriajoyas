import { describe, it, expect } from 'vitest'
import { normalizeCouponCode, validateCouponInput, type CouponInput } from './coupon-input'

// validateCouponInput validates an ADMIN create/edit (distinct from the
// redemption-time validateCoupon in coupon.ts). It checks the NORMALIZED shape:
// percent value is 1-100; fixed value + minOrder are integer centavos. The UI
// converts pesos->centavos and normalizes the code before calling.

const base: CouponInput = {
  code: 'VERANO10',
  type: 'percent',
  value: 10,
  minOrder: 0,
  maxRedemptions: null,
  startsAt: null,
  endsAt: null,
}

describe('normalizeCouponCode', () => {
  it('trims and uppercases', () => {
    expect(normalizeCouponCode('  save10 ')).toBe('SAVE10')
    expect(normalizeCouponCode('Bienvenida-5')).toBe('BIENVENIDA-5')
  })
})

describe('validateCouponInput', () => {
  it('accepts a valid percent coupon', () => {
    const r = validateCouponInput(base)
    expect(r.valid).toBe(true)
    expect(r.errors).toEqual({})
  })

  it('accepts a valid fixed coupon (value in centavos)', () => {
    const r = validateCouponInput({ ...base, type: 'fixed', value: 50000 })
    expect(r.valid).toBe(true)
  })

  it('rejects an empty or whitespace code', () => {
    expect(validateCouponInput({ ...base, code: '   ' }).errors.code).toBeTruthy()
    expect(validateCouponInput({ ...base, code: '' }).errors.code).toBeTruthy()
  })

  it('rejects a code with spaces or invalid characters', () => {
    expect(validateCouponInput({ ...base, code: 'SAVE 10' }).errors.code).toBeTruthy()
    expect(validateCouponInput({ ...base, code: 'SAVE$10' }).errors.code).toBeTruthy()
  })

  it('rejects an invalid type', () => {
    expect(validateCouponInput({ ...base, type: 'bogus' as unknown as CouponInput['type'] }).errors.type).toBeTruthy()
  })

  it('enforces percent value within 1..100', () => {
    expect(validateCouponInput({ ...base, value: 0 }).errors.value).toBeTruthy()
    expect(validateCouponInput({ ...base, value: 101 }).errors.value).toBeTruthy()
    expect(validateCouponInput({ ...base, value: 1 }).valid).toBe(true)
    expect(validateCouponInput({ ...base, value: 100 }).valid).toBe(true)
  })

  it('enforces fixed value as a positive integer (centavos)', () => {
    expect(validateCouponInput({ ...base, type: 'fixed', value: 0 }).errors.value).toBeTruthy()
    expect(validateCouponInput({ ...base, type: 'fixed', value: -100 }).errors.value).toBeTruthy()
    expect(validateCouponInput({ ...base, type: 'fixed', value: 1 }).valid).toBe(true)
  })

  it('rejects a non-integer value', () => {
    expect(validateCouponInput({ ...base, value: 10.5 }).errors.value).toBeTruthy()
  })

  it('enforces minOrder as a non-negative integer', () => {
    expect(validateCouponInput({ ...base, minOrder: -1 }).errors.minOrder).toBeTruthy()
    expect(validateCouponInput({ ...base, minOrder: 1.5 }).errors.minOrder).toBeTruthy()
    expect(validateCouponInput({ ...base, minOrder: 0 }).valid).toBe(true)
  })

  it('treats null maxRedemptions as unlimited, rejects <= 0 or non-integer', () => {
    expect(validateCouponInput({ ...base, maxRedemptions: null }).valid).toBe(true)
    expect(validateCouponInput({ ...base, maxRedemptions: 0 }).errors.maxRedemptions).toBeTruthy()
    expect(validateCouponInput({ ...base, maxRedemptions: -3 }).errors.maxRedemptions).toBeTruthy()
    expect(validateCouponInput({ ...base, maxRedemptions: 2.5 }).errors.maxRedemptions).toBeTruthy()
    expect(validateCouponInput({ ...base, maxRedemptions: 100 }).valid).toBe(true)
  })

  it('rejects a validity window where starts_at is after ends_at', () => {
    const bad = validateCouponInput({
      ...base,
      startsAt: '2026-12-31T00:00:00Z',
      endsAt: '2026-01-01T00:00:00Z',
    })
    expect(bad.errors.dates).toBeTruthy()
  })

  it('accepts equal or ordered dates, and a single open-ended bound', () => {
    expect(
      validateCouponInput({ ...base, startsAt: '2026-01-01T00:00:00Z', endsAt: '2026-12-31T00:00:00Z' }).valid,
    ).toBe(true)
    expect(validateCouponInput({ ...base, startsAt: '2026-01-01T00:00:00Z', endsAt: null }).valid).toBe(true)
    expect(validateCouponInput({ ...base, startsAt: null, endsAt: '2026-12-31T00:00:00Z' }).valid).toBe(true)
  })

  it('aggregates multiple errors at once', () => {
    const r = validateCouponInput({ ...base, code: '', value: 0, minOrder: -5 })
    expect(r.valid).toBe(false)
    expect(Object.keys(r.errors).length).toBeGreaterThanOrEqual(3)
  })
})
