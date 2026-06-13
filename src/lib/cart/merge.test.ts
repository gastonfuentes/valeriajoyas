import { describe, it, expect } from 'vitest'
import { mergeCartItems } from './merge'

describe('mergeCartItems', () => {
  it('disjoint sets returns union', () => {
    const local = [{ variantId: 'a', quantity: 2, maxQty: 10 }]
    const remote = [{ variantId: 'b', quantity: 3, maxQty: 10 }]
    const result = mergeCartItems(local, remote)
    expect(result).toHaveLength(2)
    expect(result.find(i => i.variantId === 'a')?.quantity).toBe(2)
    expect(result.find(i => i.variantId === 'b')?.quantity).toBe(3)
  })

  it('same variantId sums quantities', () => {
    const local = [{ variantId: 'a', quantity: 2, maxQty: 10 }]
    const remote = [{ variantId: 'a', quantity: 3, maxQty: 10 }]
    const result = mergeCartItems(local, remote)
    expect(result).toHaveLength(1)
    expect(result[0].quantity).toBe(5)
  })

  it('sum exceeding maxQty is capped', () => {
    const local = [{ variantId: 'a', quantity: 7, maxQty: 10 }]
    const remote = [{ variantId: 'a', quantity: 5, maxQty: 10 }]
    const result = mergeCartItems(local, remote)
    expect(result[0].quantity).toBe(10)
  })

  it('empty local returns remote items', () => {
    const remote = [{ variantId: 'b', quantity: 3, maxQty: 10 }]
    const result = mergeCartItems([], remote)
    expect(result).toEqual(remote)
  })

  it('empty remote returns local items', () => {
    const local = [{ variantId: 'a', quantity: 2, maxQty: 10 }]
    const result = mergeCartItems(local, [])
    expect(result).toEqual(local)
  })
})
