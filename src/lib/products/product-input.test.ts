import { describe, it, expect } from 'vitest'
import { validateProductFields } from './product-input'

const base = {
  name: 'Anillo Solitario',
  priceInput: '18990',
  description: '',
  compareAtPriceInput: '',
  isFeatured: false,
}

describe('validateProductFields', () => {
  it('accepts a minimal valid product and converts pesos to centavos', () => {
    const result = validateProductFields(base)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual({
      name: 'Anillo Solitario',
      basePriceCentavos: 1899000,
      compareAtPriceCentavos: null,
      description: null,
      isFeatured: false,
    })
  })

  it('parses es-AR comma decimals without truncation (never parseFloat)', () => {
    const result = validateProductFields({ ...base, priceInput: '500,50' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.basePriceCentavos).toBe(50050)
  })

  it('reads an es-AR thousands-dotted price (50.000 = fifty thousand, not 50)', () => {
    const result = validateProductFields({ ...base, priceInput: '50.000' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.basePriceCentavos).toBe(5000000)
  })

  it('trims the name', () => {
    const result = validateProductFields({ ...base, name: '  Aro Luna  ' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.name).toBe('Aro Luna')
  })

  it('rejects an empty name', () => {
    const result = validateProductFields({ ...base, name: '' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.name).toBeTruthy()
  })

  it('rejects a whitespace-only name', () => {
    const result = validateProductFields({ ...base, name: '   ' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.name).toBeTruthy()
  })

  it('rejects a name longer than 120 chars', () => {
    const result = validateProductFields({ ...base, name: 'x'.repeat(121) })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.name).toBeTruthy()
  })

  it('rejects a zero price', () => {
    const result = validateProductFields({ ...base, priceInput: '0' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.price).toBeTruthy()
  })

  it('rejects a negative price', () => {
    const result = validateProductFields({ ...base, priceInput: '-5' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.price).toBeTruthy()
  })

  it('rejects a non-numeric price', () => {
    const result = validateProductFields({ ...base, priceInput: 'abc' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.price).toBeTruthy()
  })

  it('accepts a compare_at_price strictly greater than base', () => {
    const result = validateProductFields({ ...base, priceInput: '18990', compareAtPriceInput: '24990' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.compareAtPriceCentavos).toBe(2499000)
  })

  it('rejects a compare_at_price equal to base', () => {
    const result = validateProductFields({ ...base, priceInput: '18990', compareAtPriceInput: '18990' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.compareAtPrice).toBeTruthy()
  })

  it('rejects a compare_at_price lower than base', () => {
    const result = validateProductFields({ ...base, priceInput: '18990', compareAtPriceInput: '10000' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.compareAtPrice).toBeTruthy()
  })

  it('treats an empty compare_at_price as null', () => {
    const result = validateProductFields({ ...base, compareAtPriceInput: '   ' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.compareAtPriceCentavos).toBeNull()
  })

  it('rejects an invalid compare_at_price', () => {
    const result = validateProductFields({ ...base, compareAtPriceInput: 'xx' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.compareAtPrice).toBeTruthy()
  })

  it('does NOT flag compareAtPrice for the "> base" rule when the base price itself is invalid', () => {
    const result = validateProductFields({ ...base, priceInput: 'abc', compareAtPriceInput: '100' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.price).toBeTruthy()
    expect(result.errors.compareAtPrice).toBeFalsy()
  })

  it('trims description and stores empty as null', () => {
    const result = validateProductFields({ ...base, description: '   ' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.description).toBeNull()
  })

  it('keeps a non-empty trimmed description', () => {
    const result = validateProductFields({ ...base, description: '  Plata 925 pulida  ' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.description).toBe('Plata 925 pulida')
  })

  it('rejects a description longer than 5000 chars', () => {
    const result = validateProductFields({ ...base, description: 'x'.repeat(5001) })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.description).toBeTruthy()
  })

  it('passes isFeatured through', () => {
    const result = validateProductFields({ ...base, isFeatured: true })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.isFeatured).toBe(true)
  })

  it('aggregates multiple field errors', () => {
    const result = validateProductFields({ ...base, name: '', priceInput: '0' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.name).toBeTruthy()
    expect(result.errors.price).toBeTruthy()
  })
})
