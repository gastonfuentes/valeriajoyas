import { describe, it, expect } from 'vitest'
import { applyAdd, applySetQty, applyRemove } from './reducers'

// Richer line than CartLine to prove the generics preserve all fields.
type Line = { variantId: string; quantity: number; maxQty: number; name: string }

const line = (variantId: string, quantity: number, maxQty = 10, name = variantId): Line => ({
  variantId,
  quantity,
  maxQty,
  name,
})

describe('applyAdd', () => {
  it('appends a new line when the variant is not present', () => {
    const prev = [line('a', 1)]
    const result = applyAdd(prev, line('b', 2))
    expect(result).toHaveLength(2)
    expect(result[1]).toMatchObject({ variantId: 'b', quantity: 2 })
  })

  it('merges quantity into an existing line', () => {
    const prev = [line('a', 1)]
    const result = applyAdd(prev, line('a', 3))
    expect(result).toHaveLength(1)
    expect(result[0].quantity).toBe(4)
  })

  it('clamps the merged quantity to maxQty', () => {
    const prev = [line('a', 8, 10)]
    const result = applyAdd(prev, line('a', 5, 10))
    expect(result[0].quantity).toBe(10)
  })

  it('preserves extra fields on the line (generic over the item shape)', () => {
    const result = applyAdd([], line('a', 1, 10, 'Anillo'))
    expect(result[0].name).toBe('Anillo')
  })

  it('does not mutate the previous array', () => {
    const prev = [line('a', 1)]
    applyAdd(prev, line('a', 1))
    expect(prev[0].quantity).toBe(1)
  })
})

describe('applySetQty', () => {
  it('sets the quantity of the matching line', () => {
    const prev = [line('a', 1), line('b', 1)]
    const result = applySetQty(prev, 'a', 5)
    expect(result.find((i) => i.variantId === 'a')?.quantity).toBe(5)
    expect(result.find((i) => i.variantId === 'b')?.quantity).toBe(1)
  })

  it('clamps above maxQty', () => {
    const result = applySetQty([line('a', 1, 3)], 'a', 99)
    expect(result[0].quantity).toBe(3)
  })

  it('clamps to a minimum of 1 (never drops to 0)', () => {
    const result = applySetQty([line('a', 2)], 'a', 0)
    expect(result[0].quantity).toBe(1)
  })

  it('is a no-op for an unknown variant', () => {
    const prev = [line('a', 1)]
    expect(applySetQty(prev, 'zzz', 5)).toEqual(prev)
  })
})

describe('applyRemove', () => {
  it('removes the matching line', () => {
    const result = applyRemove([line('a', 1), line('b', 1)], 'a')
    expect(result.map((i) => i.variantId)).toEqual(['b'])
  })

  it('is a no-op for an unknown variant', () => {
    const prev = [line('a', 1)]
    expect(applyRemove(prev, 'zzz')).toEqual(prev)
  })
})
