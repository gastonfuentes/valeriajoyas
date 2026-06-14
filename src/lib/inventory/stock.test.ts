import { describe, it, expect } from 'vitest'
import { availableToSell, stockLevel, validateStockUpdate } from './stock'

// Stock is set ABSOLUTELY by the admin (a stock count), so validateStockUpdate
// checks the target value. availableToSell/stockLevel work off "available"
// (quantity - reserved), which is what the storefront can actually sell.

describe('availableToSell', () => {
  it('subtracts reserved from quantity', () => {
    expect(availableToSell(10, 0)).toBe(10)
    expect(availableToSell(10, 3)).toBe(7)
  })

  it('never goes below zero when reserved exceeds quantity', () => {
    expect(availableToSell(3, 5)).toBe(0)
  })

  it('clamps negative inputs to zero', () => {
    expect(availableToSell(-5, 0)).toBe(0)
    expect(availableToSell(10, -2)).toBe(10)
  })

  it('floors non-integer inputs', () => {
    expect(availableToSell(10.9, 2.9)).toBe(8) // floor(10.9)=10, floor(2.9)=2 -> 8
  })
})

describe('stockLevel', () => {
  it('is "out" when nothing is available', () => {
    expect(stockLevel(0, 0, 3)).toBe('out')
    expect(stockLevel(5, 5, 3)).toBe('out') // all reserved
  })

  it('is "low" when available is at or below the threshold', () => {
    expect(stockLevel(3, 0, 3)).toBe('low') // exactly at threshold
    expect(stockLevel(2, 0, 3)).toBe('low')
  })

  it('is "ok" when available is above the threshold', () => {
    expect(stockLevel(4, 0, 3)).toBe('ok')
  })

  it('treats threshold 0 as "never low" (only out when empty)', () => {
    expect(stockLevel(1, 0, 0)).toBe('ok')
    expect(stockLevel(0, 0, 0)).toBe('out')
  })

  it('flags low based on available, not raw quantity', () => {
    // raw quantity is high but reserved pushes available down to the threshold
    expect(stockLevel(100, 98, 3)).toBe('low') // available 2 <= 3
  })
})

describe('validateStockUpdate', () => {
  it('accepts a valid non-negative integer at or above reserved', () => {
    expect(validateStockUpdate({ newQuantity: 10, reserved: 0 })).toEqual({ valid: true })
    expect(validateStockUpdate({ newQuantity: 5, reserved: 5 })).toEqual({ valid: true })
  })

  it('rejects non-integer quantities', () => {
    const r = validateStockUpdate({ newQuantity: 3.5, reserved: 0 })
    expect(r.valid).toBe(false)
    expect(r.reason).toBeTruthy()
  })

  it('rejects negative quantities', () => {
    const r = validateStockUpdate({ newQuantity: -1, reserved: 0 })
    expect(r.valid).toBe(false)
    expect(r.reason).toBeTruthy()
  })

  it('rejects setting quantity below what is reserved', () => {
    const r = validateStockUpdate({ newQuantity: 2, reserved: 5 })
    expect(r.valid).toBe(false)
    expect(r.reason).toBeTruthy()
  })
})
