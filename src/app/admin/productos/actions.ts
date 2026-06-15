'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { currentAdmin } from '@/lib/auth/require-admin'
import { validateStockUpdate } from '@/lib/inventory/stock'
import { PRODUCT_STATUSES, type ProductStatus } from '@/lib/products/status'
import { validateProductFields, type ProductFieldErrors } from '@/lib/products/product-input'
import {
  shouldBePrimaryOnUpload,
  pickPrimaryAfterRemoval,
  MAX_IMAGES_PER_PRODUCT,
} from '@/lib/products/image-input'

const PRODUCT_IMAGES_BUCKET = 'product-images'

type SupabaseRls = Awaited<ReturnType<typeof createClient>>

/** Revalidate every surface that shows a product, given its id (slug fetched here). */
async function revalidateProductPaths(supabase: SupabaseRls, productId: string): Promise<void> {
  const { data } = await supabase.from('products').select('slug').eq('id', productId).maybeSingle()
  revalidatePath('/admin/productos')
  revalidatePath(`/admin/productos/${productId}`)
  revalidatePath('/productos')
  if (data?.slug) revalidatePath(`/productos/${data.slug}`)
}

type ReservedEmbed = { reserved: number }
type SlugEmbed = { slug: string }

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v
}

/**
 * Set a variant's stock to an ABSOLUTE quantity (a stock count). Independent of
 * apply_mp_payment (which decrements on the paid boundary) — this is a manual
 * override, not a delta. Validates against the pure rules + current reserved.
 */
export async function updateVariantStock(input: {
  variantId: string
  newQuantity: number
}): Promise<{ error?: string; ok?: true }> {
  const admin = await currentAdmin()
  if (!admin) return { error: 'No autorizado.' }

  const supabase = await createClient()

  // Read current reserved (for validation) + the owning product (for revalidation).
  const { data: variant } = await supabase
    .from('product_variants')
    .select('id, product_id, inventory(reserved), products(slug)')
    .eq('id', input.variantId)
    .maybeSingle()

  if (!variant) return { error: 'Variante no encontrada.' }

  const v = variant as {
    product_id: string
    inventory: ReservedEmbed | ReservedEmbed[] | null
    products: SlugEmbed | SlugEmbed[] | null
  }
  const reserved = one(v.inventory)?.reserved ?? 0

  // Pre-check against a snapshot of `reserved`. Today `reserved` is always 0
  // (nothing writes it yet), so quantity >= reserved == quantity >= 0, which the
  // DB already enforces. If a reservation system is added, move this guard into
  // the DB (CHECK quantity >= reserved, or a row-locking RPC) — a JS pre-check
  // alone is racy under concurrency with the payment path.
  const check = validateStockUpdate({ newQuantity: input.newQuantity, reserved })
  if (!check.valid) return { error: check.reason ?? 'Cantidad inválida.' }

  // Upsert the inventory row (PK variant_id). On update only quantity changes;
  // on insert, reserved/low_stock_threshold take their DB defaults.
  const { error: upsertError } = await supabase
    .from('inventory')
    .upsert({ variant_id: input.variantId, quantity: input.newQuantity }, { onConflict: 'variant_id' })

  if (upsertError) return { error: 'No se pudo actualizar el stock.' }

  const slug = one(v.products)?.slug
  revalidatePath('/admin/productos')
  revalidatePath(`/admin/productos/${v.product_id}`)
  revalidatePath('/productos')
  if (slug) revalidatePath(`/productos/${slug}`)

  return { ok: true }
}

/** Set a product's publish status (draft / active / archived). */
export async function setProductStatus(input: {
  productId: string
  status: ProductStatus
}): Promise<{ error?: string; ok?: true }> {
  const admin = await currentAdmin()
  if (!admin) return { error: 'No autorizado.' }
  if (!PRODUCT_STATUSES.includes(input.status)) return { error: 'Estado inválido.' }

  const supabase = await createClient()
  const { data: updated, error } = await supabase
    .from('products')
    .update({ status: input.status })
    .eq('id', input.productId)
    .select('slug')
    .maybeSingle()

  if (error || !updated) return { error: 'No se pudo actualizar el estado.' }

  revalidatePath('/admin/productos')
  revalidatePath(`/admin/productos/${input.productId}`)
  revalidatePath('/productos')
  revalidatePath(`/productos/${updated.slug}`)

  return { ok: true }
}

/**
 * Edit a product's core fields. Money arrives as pesos strings (es-AR) and is
 * validated + normalized to centavos by validateProductFields server-side. The
 * slug is intentionally NOT touched here — it is the public URL.
 */
export async function updateProductFields(input: {
  productId: string
  name: string
  priceInput: string
  description: string
  compareAtPriceInput: string
  isFeatured: boolean
}): Promise<{ error?: string; fieldErrors?: ProductFieldErrors; ok?: true }> {
  const admin = await currentAdmin()
  if (!admin) return { error: 'No autorizado.' }

  const validation = validateProductFields({
    name: input.name,
    priceInput: input.priceInput,
    description: input.description,
    compareAtPriceInput: input.compareAtPriceInput,
    isFeatured: input.isFeatured,
  })
  if (!validation.ok) return { fieldErrors: validation.errors }
  const v = validation.value

  const supabase = await createClient()
  const { data: updated, error } = await supabase
    .from('products')
    .update({
      name: v.name,
      base_price: v.basePriceCentavos,
      compare_at_price: v.compareAtPriceCentavos,
      description: v.description,
      is_featured: v.isFeatured,
    })
    .eq('id', input.productId)
    .select('slug')
    .maybeSingle()

  if (error || !updated) return { error: 'No se pudo guardar el producto.' }

  revalidatePath('/admin/productos')
  revalidatePath(`/admin/productos/${input.productId}`)
  revalidatePath('/productos')
  revalidatePath(`/productos/${updated.slug}`)

  return { ok: true }
}

/**
 * Record a product_images row AFTER the browser has uploaded the object directly
 * to Storage. The count limit and primary flag are decided server-side (the client
 * may be stale). If the row insert fails, the just-uploaded object is removed so we
 * never leave an orphan.
 */
export async function recordProductImage(input: {
  productId: string
  storagePath: string
  alt: string
}): Promise<{ error?: string; ok?: true }> {
  const admin = await currentAdmin()
  if (!admin) return { error: 'No autorizado.' }

  const supabase = await createClient()

  // Path hygiene: the object must live under this product's folder. A path
  // outside it was never legitimately uploaded by this flow, so we MUST NOT
  // remove it — the Storage DELETE policy is bucket-wide, so removing it would
  // delete another product's object. Reject without touching Storage.
  if (!input.storagePath.startsWith(`${input.productId}/`)) {
    return { error: 'Ruta de imagen inválida.' }
  }

  // From here on the path is proven in-folder, so cleaning it up is safe.
  const removeOrphan = () =>
    supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([input.storagePath])

  const { data: existing, error: readErr } = await supabase
    .from('product_images')
    .select('id, position')
    .eq('product_id', input.productId)

  if (readErr) {
    await removeOrphan()
    return { error: 'No se pudo registrar la imagen.' }
  }

  const count = existing?.length ?? 0
  if (count >= MAX_IMAGES_PER_PRODUCT) {
    await removeOrphan()
    return { error: `Máximo ${MAX_IMAGES_PER_PRODUCT} imágenes por producto.` }
  }

  const maxPosition = (existing ?? []).reduce((m, r) => Math.max(m, r.position), -1)
  const alt = input.alt.trim()

  // NOTE: this read-then-insert is not atomic. Two uploads racing on a product
  // with 0 images would both compute count=0 and insert is_primary=true, leaving
  // two primaries. A pure JS pre-check cannot close that window; the robust fix
  // is a DB-level partial unique index `(product_id) where is_primary` (a
  // migration — deferred, same posture as the updateVariantStock caveat above).
  // For a single admin this is inert, and a double-primary is recoverable via
  // setPrimaryImage; the storefront orders images by position, not is_primary.
  const { error: insertErr } = await supabase.from('product_images').insert({
    product_id: input.productId,
    storage_path: input.storagePath,
    alt: alt.length > 0 ? alt : null,
    position: maxPosition + 1,
    is_primary: shouldBePrimaryOnUpload(count),
  })

  if (insertErr) {
    await removeOrphan()
    return { error: 'No se pudo registrar la imagen.' }
  }

  await revalidateProductPaths(supabase, input.productId)
  return { ok: true }
}

/**
 * Delete a product image. The row is removed first (source of truth), then the
 * Storage object best-effort. If the deleted image was primary, the lowest-position
 * remaining image is promoted.
 */
export async function deleteProductImage(input: {
  imageId: string
}): Promise<{ error?: string; ok?: true }> {
  const admin = await currentAdmin()
  if (!admin) return { error: 'No autorizado.' }

  const supabase = await createClient()
  const { data: img } = await supabase
    .from('product_images')
    .select('id, product_id, storage_path, is_primary')
    .eq('id', input.imageId)
    .maybeSingle()
  if (!img) return { error: 'Imagen no encontrada.' }

  const { error: delErr } = await supabase.from('product_images').delete().eq('id', img.id)
  if (delErr) return { error: 'No se pudo borrar la imagen.' }

  // Best-effort object removal. A leftover object is a harmless orphan; a row
  // pointing at a missing object would be a broken image, so the row goes first.
  await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([img.storage_path])

  if (img.is_primary) {
    const { data: remaining } = await supabase
      .from('product_images')
      .select('id, position')
      .eq('product_id', img.product_id)
    const newPrimaryId = pickPrimaryAfterRemoval(remaining ?? [])
    if (newPrimaryId) {
      const { error: promoteErr } = await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', newPrimaryId)
      // The image is already gone; if the promotion failed the product is left
      // without a primary. Tell the admin so they can re-pick it, but still
      // revalidate so the deleted image disappears from the UI.
      if (promoteErr) {
        await revalidateProductPaths(supabase, img.product_id)
        return { error: 'Imagen borrada, pero no se pudo asignar una nueva principal.' }
      }
    }
  }

  await revalidateProductPaths(supabase, img.product_id)
  return { ok: true }
}

/** Make one image the product's primary, demoting any previous primary. */
export async function setPrimaryImage(input: {
  imageId: string
}): Promise<{ error?: string; ok?: true }> {
  const admin = await currentAdmin()
  if (!admin) return { error: 'No autorizado.' }

  const supabase = await createClient()
  const { data: img } = await supabase
    .from('product_images')
    .select('id, product_id')
    .eq('id', input.imageId)
    .maybeSingle()
  if (!img) return { error: 'Imagen no encontrada.' }

  // Set the new primary FIRST, then demote the others. If the second statement
  // fails mid-way, the product is left with an EXTRA primary (recoverable by
  // re-picking) rather than ZERO primaries. These are two non-transactional
  // updates; a DB-level "one primary per product" invariant is deferred (needs a
  // migration) — see the note in recordProductImage.
  const { error: setErr } = await supabase
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', img.id)
  if (setErr) return { error: 'No se pudo actualizar la imagen principal.' }

  const { error: unsetErr } = await supabase
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', img.product_id)
    .eq('is_primary', true)
    .neq('id', img.id)
  if (unsetErr) return { error: 'No se pudo actualizar la imagen principal.' }

  await revalidateProductPaths(supabase, img.product_id)
  return { ok: true }
}
