// Pure rules for product image uploads (Stage 6, Productos parte 2).
// Transport-agnostic: the browser uploads directly to Storage and a server action
// records the product_images row, but every size/type/count rule lives here so it
// can be enforced identically on both sides and unit-tested.

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number]

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB
export const MAX_IMAGES_PER_PRODUCT = 8

export type ImageUploadInput = {
  type: string
  size: number
  /** Number of images the product already has, before this upload. */
  currentCount: number
}

export type ValidateImageResult = { ok: true } | { ok: false; error: string }

export function validateImageUpload({ type, size, currentCount }: ImageUploadInput): ValidateImageResult {
  if (currentCount >= MAX_IMAGES_PER_PRODUCT) {
    return { ok: false, error: `Máximo ${MAX_IMAGES_PER_PRODUCT} imágenes por producto.` }
  }
  if (!ALLOWED_IMAGE_TYPES.includes(type as AllowedImageType)) {
    return { ok: false, error: 'Formato no permitido. Usá JPEG, PNG o WebP.' }
  }
  if (!Number.isFinite(size) || size <= 0) {
    return { ok: false, error: 'Archivo inválido.' }
  }
  if (size > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'La imagen supera los 5 MB.' }
  }
  return { ok: true }
}

/** File extension to use in the storage_path for an allowed mime type. */
export function extensionForType(type: string): string | null {
  switch (type) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    default:
      return null
  }
}

/** The first image uploaded to a product becomes its primary automatically. */
export function shouldBePrimaryOnUpload(currentCount: number): boolean {
  return currentCount === 0
}

/**
 * After removing an image, choose the new primary: the lowest-position image that
 * remains (ties broken deterministically by id). Returns null if none remain.
 */
export function pickPrimaryAfterRemoval(
  remaining: { id: string; position: number }[],
): string | null {
  if (remaining.length === 0) return null
  const sorted = [...remaining].sort(
    (a, b) => a.position - b.position || a.id.localeCompare(b.id),
  )
  return sorted[0].id
}
