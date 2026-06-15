import { describe, it, expect } from 'vitest'
import { parseArsAmount } from './format'

describe('parseArsAmount', () => {
  it('parses a plain integer', () => {
    expect(parseArsAmount('50000')).toBe(50000)
  })

  it('treats the dot as a thousands separator (es-AR)', () => {
    expect(parseArsAmount('50.000')).toBe(50000)
    expect(parseArsAmount('1.234.567')).toBe(1234567)
  })

  it('treats the comma as the decimal separator', () => {
    expect(parseArsAmount('50000,50')).toBe(50000.5)
    expect(parseArsAmount('10,5')).toBe(10.5)
  })

  it('handles thousands grouping AND a decimal comma together', () => {
    expect(parseArsAmount('1.000,50')).toBe(1000.5)
    expect(parseArsAmount('50.000,50')).toBe(50000.5)
  })

  it('parses zero', () => {
    expect(parseArsAmount('0')).toBe(0)
  })

  it('trims surrounding whitespace', () => {
    expect(parseArsAmount('  50.000  ')).toBe(50000)
  })

  it('returns NaN for non-numeric input', () => {
    expect(parseArsAmount('abc')).toBeNaN()
  })

  it('parses a negative amount', () => {
    expect(parseArsAmount('-5')).toBe(-5)
  })

  it('treats a single dot with 1-2 trailing digits as a decimal (common habit)', () => {
    expect(parseArsAmount('2.50')).toBe(2.5)
    expect(parseArsAmount('50.00')).toBe(50)
    expect(parseArsAmount('1.5')).toBe(1.5)
    expect(parseArsAmount('99.99')).toBe(99.99)
  })

  it('still treats a 3-digit dot group as thousands (disambiguation)', () => {
    expect(parseArsAmount('50.000')).toBe(50000)
    expect(parseArsAmount('1.500')).toBe(1500)
  })

  it('rejects non-money numeric forms (hex, scientific, stray sign)', () => {
    expect(parseArsAmount('0x10')).toBeNaN()
    expect(parseArsAmount('1e3')).toBeNaN()
    expect(parseArsAmount('+5')).toBeNaN()
  })

  it('returns NaN for an empty string', () => {
    expect(parseArsAmount('')).toBeNaN()
    expect(parseArsAmount('   ')).toBeNaN()
  })
})
