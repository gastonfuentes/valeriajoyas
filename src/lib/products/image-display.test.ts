import { describe, it, expect } from 'vitest'
import { pickCardImages, buildProductImageUrl } from './image-display'

describe('pickCardImages', () => {
  it('returns nulls when there are no images', () => {
    expect(pickCardImages([])).toEqual({ primary: null, secondary: null })
  })

  it('returns the only image as primary and null secondary', () => {
    expect(pickCardImages([{ storage_path: 'a.jpg', is_primary: true, position: 0 }])).toEqual({
      primary: 'a.jpg',
      secondary: null,
    })
  })

  it('prefers the is_primary image over a lower position', () => {
    const result = pickCardImages([
      { storage_path: 'a.jpg', is_primary: false, position: 0 },
      { storage_path: 'b.jpg', is_primary: true, position: 5 },
    ])
    expect(result).toEqual({ primary: 'b.jpg', secondary: 'a.jpg' })
  })

  it('falls back to the lowest position when no image is primary', () => {
    const result = pickCardImages([
      { storage_path: 'c.jpg', is_primary: false, position: 2 },
      { storage_path: 'a.jpg', is_primary: false, position: 0 },
      { storage_path: 'b.jpg', is_primary: false, position: 1 },
    ])
    expect(result).toEqual({ primary: 'a.jpg', secondary: 'b.jpg' })
  })

  it('breaks position ties deterministically by storage_path', () => {
    const result = pickCardImages([
      { storage_path: 'z.jpg', is_primary: false, position: 0 },
      { storage_path: 'a.jpg', is_primary: false, position: 0 },
    ])
    expect(result).toEqual({ primary: 'a.jpg', secondary: 'z.jpg' })
  })

  it('picks the primary, then the next by position, as the hover image', () => {
    const result = pickCardImages([
      { storage_path: 'x.jpg', is_primary: true, position: 3 },
      { storage_path: 'a.jpg', is_primary: false, position: 0 },
      { storage_path: 'b.jpg', is_primary: false, position: 1 },
    ])
    expect(result).toEqual({ primary: 'x.jpg', secondary: 'a.jpg' })
  })
})

describe('buildProductImageUrl', () => {
  it('builds the public storage URL for a path', () => {
    expect(buildProductImageUrl('abc/def.jpg')).toContain(
      '/storage/v1/object/public/product-images/abc/def.jpg',
    )
  })
})
