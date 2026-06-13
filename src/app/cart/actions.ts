'use server'
import { createClient } from '@/lib/supabase/server'
import { mergeCartItems, type MergeItem } from '@/lib/cart/merge'

export type ServerCartItem = {
  variantId: string
  productSlug: string
  name: string
  variantName: string
  unitPrice: number
  quantity: number
  maxQty: number
  sku: string | null
}

// SECURITY: every cart operation uses the AUTHENTICATED client so RLS enforces
// ownership (a user can only ever touch their own cart). The cart id is always
// resolved server-side from auth.getUser() — it is never accepted from the
// client — so there is no way to address another user's cart.

async function getUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function getOrCreateCart(): Promise<string | null> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return null

  const { data: existing } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) return existing.id

  // RLS carts_insert_own requires user_id = auth.uid().
  const { data: inserted } = await supabase
    .from('carts')
    .insert({ user_id: userId })
    .select('id')
    .single()

  return inserted?.id ?? null
}

type RawCartItem = {
  quantity: number
  variant_id: string
  product_variants: {
    price: number | null
    name: string | null
    sku: string | null
    products: { name: string; slug: string; base_price: number } | null
  } | null
  inventory: { quantity: number; reserved: number } | null
}

export async function getServerCart(): Promise<ServerCartItem[]> {
  const supabase = await createClient()
  const cartId = await getOrCreateCart()
  if (!cartId) return []

  const { data } = await supabase
    .from('cart_items')
    .select(`
      quantity,
      variant_id,
      product_variants(price, name, sku, products(name, slug, base_price)),
      inventory(quantity, reserved)
    `)
    .eq('cart_id', cartId)

  const rows = (data ?? []) as unknown as RawCartItem[]

  return rows
    .filter(row => row.product_variants?.products != null)
    .map(row => {
      const variant = row.product_variants!
      const product = variant.products!
      const inv = row.inventory
      return {
        variantId: row.variant_id,
        productSlug: product.slug,
        name: product.name,
        variantName: variant.name ?? '',
        unitPrice: variant.price ?? product.base_price, // server-resolved price
        quantity: row.quantity,
        maxQty: inv ? Math.max(0, inv.quantity - inv.reserved) : 0,
        sku: variant.sku,
      }
    })
}

async function availableStock(variantId: string): Promise<number> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('inventory')
    .select('quantity, reserved')
    .eq('variant_id', variantId)
    .maybeSingle()
  return data ? Math.max(0, data.quantity - data.reserved) : 0
}

export async function addItem(variantId: string, qty: number): Promise<void> {
  const supabase = await createClient()
  const cartId = await getOrCreateCart()
  if (!cartId) return

  const maxQty = await availableStock(variantId)
  if (maxQty <= 0) return

  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cartId)
    .eq('variant_id', variantId)
    .maybeSingle()

  if (existing) {
    const newQty = Math.min(existing.quantity + qty, maxQty)
    await supabase.from('cart_items').update({ quantity: newQty }).eq('id', existing.id)
  } else {
    await supabase
      .from('cart_items')
      .insert({ cart_id: cartId, variant_id: variantId, quantity: Math.min(qty, maxQty) })
  }
}

export async function setItemQty(variantId: string, qty: number): Promise<void> {
  const supabase = await createClient()
  const cartId = await getOrCreateCart()
  if (!cartId) return

  if (qty <= 0) {
    await supabase.from('cart_items').delete().eq('cart_id', cartId).eq('variant_id', variantId)
    return
  }

  const maxQty = await availableStock(variantId)
  await supabase
    .from('cart_items')
    .update({ quantity: Math.min(qty, Math.max(maxQty, 1)) })
    .eq('cart_id', cartId)
    .eq('variant_id', variantId)
}

export async function removeItem(variantId: string): Promise<void> {
  const supabase = await createClient()
  const cartId = await getOrCreateCart()
  if (!cartId) return
  await supabase.from('cart_items').delete().eq('cart_id', cartId).eq('variant_id', variantId)
}

export async function clearServerCart(): Promise<void> {
  const supabase = await createClient()
  const cartId = await getOrCreateCart()
  if (!cartId) return
  await supabase.from('cart_items').delete().eq('cart_id', cartId)
}

export async function mergeGuestCart(
  localItems: Array<{ variantId: string; quantity: number; maxQty: number }>,
): Promise<void> {
  const supabase = await createClient()
  const cartId = await getOrCreateCart()
  if (!cartId) return

  const serverItems = await getServerCart()
  const remoteForMerge: MergeItem[] = serverItems.map(i => ({
    variantId: i.variantId,
    quantity: i.quantity,
    maxQty: i.maxQty,
  }))

  const merged = mergeCartItems(localItems, remoteForMerge)

  await supabase.from('cart_items').delete().eq('cart_id', cartId)
  if (merged.length > 0) {
    await supabase.from('cart_items').insert(
      merged.map(item => ({
        cart_id: cartId,
        variant_id: item.variantId,
        quantity: item.quantity,
      })),
    )
  }
}
