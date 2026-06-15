// Presentation helpers for product images (distinct from image-input.ts, which
// validates uploads). Shared by the storefront gallery, the catalog/home cards
// and the admin images manager so the public-URL shape lives in ONE place.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

/** Public URL for an object in the (public) 'product-images' bucket. */
export function buildProductImageUrl(storagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${storagePath}`
}

export type CardImageInput = {
  storage_path: string
  is_primary: boolean
  position: number
}

/**
 * Choose the images a catalog/home card shows: the primary (is_primary, else the
 * lowest position) and the next one as the hover image. Ties are broken
 * deterministically by storage_path. Returns nulls when there are no images.
 */
export function pickCardImages(
  images: CardImageInput[],
): { primary: string | null; secondary: string | null } {
  if (images.length === 0) return { primary: null, secondary: null }
  const sorted = [...images].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1
    return a.position - b.position || a.storage_path.localeCompare(b.storage_path)
  })
  return {
    primary: sorted[0].storage_path,
    secondary: sorted[1]?.storage_path ?? null,
  }
}
