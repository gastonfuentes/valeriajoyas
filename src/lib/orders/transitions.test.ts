import { describe, it, expect } from 'vitest'
import { canTransition, nextStatuses, type OrderStatus } from './transitions'

// Slice 1 (admin) is FORWARD-ONLY over an already-paid order:
//   paid -> fulfilled -> shipped -> delivered.
// Entry into 'paid' is payment-driven (apply_mp_payment RPC) and cancel/refund
// are deferred (they need server-side stock restoration), so neither is an
// allowed admin transition here. These tests encode exactly that contract.

describe('nextStatuses', () => {
  it('offers the single forward step for each fulfillable status', () => {
    expect(nextStatuses('paid')).toEqual(['fulfilled'])
    expect(nextStatuses('fulfilled')).toEqual(['shipped'])
    expect(nextStatuses('shipped')).toEqual(['delivered'])
  })

  it('offers nothing for unpaid, terminal, or non-admin states', () => {
    expect(nextStatuses('pending')).toEqual([])
    expect(nextStatuses('delivered')).toEqual([])
    expect(nextStatuses('cancelled')).toEqual([])
    expect(nextStatuses('refunded')).toEqual([])
  })
})

describe('canTransition', () => {
  it('allows each legal forward step with no reason', () => {
    for (const [from, to] of [
      ['paid', 'fulfilled'],
      ['fulfilled', 'shipped'],
      ['shipped', 'delivered'],
    ] as [OrderStatus, OrderStatus][]) {
      const r = canTransition(from, to)
      expect(r.allowed).toBe(true)
      expect(r.reason).toBeUndefined()
    }
  })

  it('rejects a no-op self-transition', () => {
    const r = canTransition('paid', 'paid')
    expect(r.allowed).toBe(false)
    expect(r.reason).toBeTruthy()
  })

  it('rejects skipping a step', () => {
    expect(canTransition('paid', 'shipped').allowed).toBe(false)
    expect(canTransition('pending', 'shipped').allowed).toBe(false)
    expect(canTransition('paid', 'delivered').allowed).toBe(false)
  })

  it('rejects reverse transitions', () => {
    expect(canTransition('shipped', 'fulfilled').allowed).toBe(false)
    expect(canTransition('fulfilled', 'paid').allowed).toBe(false)
    expect(canTransition('delivered', 'shipped').allowed).toBe(false)
  })

  it('treats delivered as terminal', () => {
    for (const to of ['paid', 'fulfilled', 'shipped', 'cancelled', 'refunded'] as OrderStatus[]) {
      expect(canTransition('delivered', to).allowed).toBe(false)
    }
  })

  it('refuses manual entry into paid (payment-driven) with an explanatory reason', () => {
    const r = canTransition('pending', 'paid')
    expect(r.allowed).toBe(false)
    expect(r.reason).toMatch(/pago/i)
  })

  it('refuses cancel/refund in slice 1 with a "not available yet" reason', () => {
    const cancel = canTransition('paid', 'cancelled')
    const refund = canTransition('shipped', 'refunded')
    expect(cancel.allowed).toBe(false)
    expect(cancel.reason).toMatch(/cancelar|reembols/i)
    expect(refund.allowed).toBe(false)
    expect(refund.reason).toMatch(/cancelar|reembols/i)
  })

  it('every disallowed transition carries a non-empty reason', () => {
    const all: OrderStatus[] = ['pending', 'paid', 'fulfilled', 'shipped', 'delivered', 'cancelled', 'refunded']
    for (const from of all) {
      for (const to of all) {
        const r = canTransition(from, to)
        if (!r.allowed) expect(typeof r.reason === 'string' && r.reason.length > 0).toBe(true)
      }
    }
  })
})
