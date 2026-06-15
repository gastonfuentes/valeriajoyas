import { describe, it, expect } from 'vitest'
import {
  validateImageUpload,
  extensionForType,
  shouldBePrimaryOnUpload,
  pickPrimaryAfterRemoval,
  MAX_IMAGE_BYTES,
  MAX_IMAGES_PER_PRODUCT,
} from './image-input'

describe('validateImageUpload', () => {
  it('accepts a JPEG under the size limit with room for more', () => {
    expect(validateImageUpload({ type: 'image/jpeg', size: 1024, currentCount: 0 })).toEqual({ ok: true })
  })

  it('accepts PNG and WebP', () => {
    expect(validateImageUpload({ type: 'image/png', size: 1024, currentCount: 1 }).ok).toBe(true)
    expect(validateImageUpload({ type: 'image/webp', size: 1024, currentCount: 1 }).ok).toBe(true)
  })

  it('rejects a disallowed type', () => {
    const result = validateImageUpload({ type: 'image/gif', size: 1024, currentCount: 0 })
    expect(result.ok).toBe(false)
  })

  it('rejects a zero-byte file', () => {
    const result = validateImageUpload({ type: 'image/jpeg', size: 0, currentCount: 0 })
    expect(result.ok).toBe(false)
  })

  it('rejects a file over the size limit', () => {
    const result = validateImageUpload({ type: 'image/jpeg', size: MAX_IMAGE_BYTES + 1, currentCount: 0 })
    expect(result.ok).toBe(false)
  })

  it('accepts a file exactly at the size limit', () => {
    expect(validateImageUpload({ type: 'image/jpeg', size: MAX_IMAGE_BYTES, currentCount: 0 }).ok).toBe(true)
  })

  it('rejects when the product already has the maximum number of images', () => {
    const result = validateImageUpload({ type: 'image/jpeg', size: 1024, currentCount: MAX_IMAGES_PER_PRODUCT })
    expect(result.ok).toBe(false)
  })

  it('accepts when the product has one slot left', () => {
    expect(
      validateImageUpload({ type: 'image/jpeg', size: 1024, currentCount: MAX_IMAGES_PER_PRODUCT - 1 }).ok,
    ).toBe(true)
  })
})

describe('extensionForType', () => {
  it('maps allowed mime types to extensions', () => {
    expect(extensionForType('image/jpeg')).toBe('jpg')
    expect(extensionForType('image/png')).toBe('png')
    expect(extensionForType('image/webp')).toBe('webp')
  })

  it('returns null for an unknown type', () => {
    expect(extensionForType('image/gif')).toBeNull()
  })
})

describe('shouldBePrimaryOnUpload', () => {
  it('makes the first image primary', () => {
    expect(shouldBePrimaryOnUpload(0)).toBe(true)
  })

  it('does not make subsequent images primary', () => {
    expect(shouldBePrimaryOnUpload(1)).toBe(false)
    expect(shouldBePrimaryOnUpload(3)).toBe(false)
  })
})

describe('pickPrimaryAfterRemoval', () => {
  it('returns null when no images remain', () => {
    expect(pickPrimaryAfterRemoval([])).toBeNull()
  })

  it('picks the lowest-position remaining image', () => {
    const remaining = [
      { id: 'b', position: 2 },
      { id: 'a', position: 0 },
      { id: 'c', position: 1 },
    ]
    expect(pickPrimaryAfterRemoval(remaining)).toBe('a')
  })

  it('breaks position ties deterministically by id', () => {
    const remaining = [
      { id: 'z', position: 0 },
      { id: 'a', position: 0 },
    ]
    expect(pickPrimaryAfterRemoval(remaining)).toBe('a')
  })
})
