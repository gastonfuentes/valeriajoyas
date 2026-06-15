import { describe, it, expect } from 'vitest'
import { validateStoreSettings } from './settings-input'

const base = {
  freeShippingThresholdInput: '50000',
  itemWeightInput: '30',
  packagingWeightInput: '100',
  originPostalCode: '1425',
  contactEmail: 'hola@valeriajoyas.com',
  contactPhone: '+54 9 11 5555-0000',
}

describe('validateStoreSettings', () => {
  it('accepts a full valid input and normalizes it', () => {
    const result = validateStoreSettings(base)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual({
      free_shipping_threshold: 5000000,
      default_item_weight_grams: 30,
      packaging_weight_grams: 100,
      origin_postal_code: '1425',
      contact_email: 'hola@valeriajoyas.com',
      contact_phone: '+54 9 11 5555-0000',
    })
  })

  it('treats an empty free-shipping threshold as null (no free shipping)', () => {
    const result = validateStoreSettings({ ...base, freeShippingThresholdInput: '  ' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.free_shipping_threshold).toBeNull()
  })

  it('parses es-AR comma decimals on the threshold without truncation', () => {
    const result = validateStoreSettings({ ...base, freeShippingThresholdInput: '50000,50' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.free_shipping_threshold).toBe(5000050)
  })

  it('allows a zero threshold (always free shipping)', () => {
    const result = validateStoreSettings({ ...base, freeShippingThresholdInput: '0' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.free_shipping_threshold).toBe(0)
  })

  it('rejects a negative threshold', () => {
    const result = validateStoreSettings({ ...base, freeShippingThresholdInput: '-5' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.freeShipping).toBeTruthy()
  })

  it('rejects a non-numeric threshold', () => {
    const result = validateStoreSettings({ ...base, freeShippingThresholdInput: 'abc' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.freeShipping).toBeTruthy()
  })

  it('requires the item weight', () => {
    const result = validateStoreSettings({ ...base, itemWeightInput: '' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.itemWeight).toBeTruthy()
  })

  it('rejects a non-integer item weight', () => {
    const result = validateStoreSettings({ ...base, itemWeightInput: '30.5' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.itemWeight).toBeTruthy()
  })

  it('rejects a negative item weight', () => {
    const result = validateStoreSettings({ ...base, itemWeightInput: '-1' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.itemWeight).toBeTruthy()
  })

  it('accepts a zero packaging weight', () => {
    const result = validateStoreSettings({ ...base, packagingWeightInput: '0' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.packaging_weight_grams).toBe(0)
  })

  it('rejects a non-integer packaging weight', () => {
    const result = validateStoreSettings({ ...base, packagingWeightInput: '10,5' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.packagingWeight).toBeTruthy()
  })

  it('treats an empty origin postal code as null', () => {
    const result = validateStoreSettings({ ...base, originPostalCode: '   ' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.origin_postal_code).toBeNull()
  })

  it('trims the origin postal code', () => {
    const result = validateStoreSettings({ ...base, originPostalCode: '  1425  ' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.origin_postal_code).toBe('1425')
  })

  it('treats an empty contact email as null', () => {
    const result = validateStoreSettings({ ...base, contactEmail: '' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.contact_email).toBeNull()
  })

  it('rejects an invalid contact email', () => {
    const result = validateStoreSettings({ ...base, contactEmail: 'notanemail' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.contactEmail).toBeTruthy()
  })

  it('trims and accepts a valid contact email', () => {
    const result = validateStoreSettings({ ...base, contactEmail: '  hola@x.com  ' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.contact_email).toBe('hola@x.com')
  })

  it('treats an empty contact phone as null', () => {
    const result = validateStoreSettings({ ...base, contactPhone: '   ' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.contact_phone).toBeNull()
  })

  it('accepts an es-AR thousands-dotted threshold (50.000 = fifty thousand)', () => {
    const result = validateStoreSettings({ ...base, freeShippingThresholdInput: '50.000' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.free_shipping_threshold).toBe(5000000)
  })

  it('accepts es-AR thousands grouping with a comma decimal (1.000,50)', () => {
    const result = validateStoreSettings({ ...base, freeShippingThresholdInput: '1.000,50' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.free_shipping_threshold).toBe(100050)
  })

  it('accepts a fully grouped threshold with decimals (50.000,50)', () => {
    const result = validateStoreSettings({ ...base, freeShippingThresholdInput: '50.000,50' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.free_shipping_threshold).toBe(5000050)
  })

  it('rejects a phone with non-tel characters', () => {
    const result = validateStoreSettings({ ...base, contactPhone: 'llamame ya' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.contactPhone).toBeTruthy()
  })

  it('accepts a normally-formatted AR phone', () => {
    const result = validateStoreSettings({ ...base, contactPhone: '+54 9 11 5555-0000' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.contact_phone).toBe('+54 9 11 5555-0000')
  })

  it('aggregates multiple field errors', () => {
    const result = validateStoreSettings({
      ...base,
      freeShippingThresholdInput: 'abc',
      itemWeightInput: '',
      contactEmail: 'bad',
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.freeShipping).toBeTruthy()
    expect(result.errors.itemWeight).toBeTruthy()
    expect(result.errors.contactEmail).toBeTruthy()
  })
})
