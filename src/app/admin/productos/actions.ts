'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { currentAdmin } from '@/lib/auth/require-admin'
import { validateStockUpdate } from '@/lib/inventory/stock'
import { PRODUCT_STATUSES, type ProductStatus } from '@/lib/products/status'

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
