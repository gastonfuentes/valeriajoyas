'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateCoupon } from '@/lib/commerce/coupon'
import { computeDiscount, computeTotals, type PricingCoupon, type PricingShipping } from '@/lib/commerce/pricing'
import { getServerCart, clearServerCart } from '@/app/cart/actions'
import { PLACEHOLDER_SHIPPING_CENTAVOS } from '@/lib/commerce/shipping-constants'
import type { Database } from '@/lib/database.types'

type CouponRow = Database['public']['Tables']['coupons']['Row']
type StoreSettingsRow = Database['public']['Tables']['store_settings']['Row']

export async function validateCouponAction(
  code: string,
  subtotalCentavos: number,
): Promise<{ valid: boolean; couponId?: string; discountCentavos?: number; reason?: string }> {
  // Coupons are admin-only under RLS, so a regular customer cannot read them
  // with the authenticated client. Validation runs server-side via the service
  // role and only ever returns a yes/no + discount, never the raw coupon.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { valid: false, reason: 'No se pudo validar el cupón en este momento.' }
  }
  const admin = createAdminClient()

  const { data } = await admin
    .from('coupons')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .maybeSingle()

  if (!data) {
    return { valid: false, reason: 'Cupón no encontrado.' }
  }

  const row = data as CouponRow
  const result = validateCoupon(row, subtotalCentavos, new Date())

  if (!result.valid) {
    return { valid: false, reason: result.reason }
  }

  const coupon: PricingCoupon = {
    type: row.type,
    value: row.value,
    minOrder: row.min_order,
  }

  const discountCentavos = computeDiscount(subtotalCentavos, coupon)

  return {
    valid: true,
    couponId: row.id,
    discountCentavos,
  }
}

export async function getStoreSettings(): Promise<{
  free_shipping_threshold: number | null
  pickup_enabled: boolean
}> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('store_settings')
    .select('free_shipping_threshold, pickup_enabled')
    .filter('id', 'eq', 1)
    .maybeSingle()

  if (!data) {
    return { free_shipping_threshold: null, pickup_enabled: false }
  }

  const row = data as Pick<StoreSettingsRow, 'free_shipping_threshold' | 'pickup_enabled'>
  return {
    free_shipping_threshold: row.free_shipping_threshold,
    pickup_enabled: row.pickup_enabled,
  }
}

export type ShippingAddressSnapshot = {
  recipient_name: string
  street: string
  street_number: string
  apartment: string
  city: string
  province: string
  postal_code: string
}

export type CreateOrderInput = {
  email: string
  phone: string
  pickup: boolean
  shippingAddress: ShippingAddressSnapshot | null
  couponCode: string | null
}

type OrderRow = Database['public']['Tables']['orders']['Row']

export async function createOrder(
  input: CreateOrderInput,
): Promise<{
  orderId?: string
  orderNumber?: number
  error?: string
  reason?: string
  outOfStock?: string[]
}> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY para crear pedidos.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Debes iniciar sesión para finalizar tu pedido.' }
  }

  const cartItems = await getServerCart()
  if (cartItems.length === 0) {
    return { error: 'El carrito está vacío.' }
  }

  // Validate stock
  const outOfStock: string[] = []
  for (const item of cartItems) {
    if (item.quantity > item.maxQty) {
      outOfStock.push(item.variantId)
    }
  }
  if (outOfStock.length > 0) {
    return { error: 'Sin stock suficiente', outOfStock }
  }

  // Compute subtotal for coupon validation
  const pricingLines = cartItems.map(item => ({
    variantId: item.variantId,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
  }))
  const tempSubtotal = pricingLines.reduce((acc, l) => acc + l.unitPrice * l.quantity, 0)

  // Resolve coupon
  let pricingCoupon: PricingCoupon | null = null
  let couponId: string | null = null
  const couponCode: string | null = input.couponCode

  if (input.couponCode) {
    const admin = createAdminClient()
    const { data: couponData } = await admin
      .from('coupons')
      .select('*')
      .eq('code', input.couponCode.trim().toUpperCase())
      .maybeSingle()

    if (!couponData) {
      return { error: 'Cupón inválido', reason: 'Cupón no encontrado.' }
    }

    const couponRow = couponData as CouponRow
    const revalidation = validateCoupon(couponRow, tempSubtotal, new Date())
    if (!revalidation.valid) {
      return { error: 'Cupón inválido', reason: revalidation.reason }
    }

    pricingCoupon = {
      type: couponRow.type,
      value: couponRow.value,
      minOrder: couponRow.min_order,
    }
    couponId = couponRow.id
  }

  // Get store settings
  const settings = await getStoreSettings()

  const pricingShipping: PricingShipping = {
    cost: PLACEHOLDER_SHIPPING_CENTAVOS,
    freeThreshold: settings.free_shipping_threshold,
    pickup: input.pickup,
  }

  const totals = computeTotals(pricingLines, pricingCoupon, pricingShipping)

  // Insert order via admin client
  const admin = createAdminClient()

  const { data: orderData, error: orderError } = await admin
    .from('orders')
    .insert({
      user_id: user.id,
      email: input.email,
      phone: input.phone,
      pickup: input.pickup,
      shipping_address: input.shippingAddress ?? null,
      shipping_method: input.pickup ? 'pickup' : 'standard',
      coupon_id: couponId,
      coupon_code: couponCode,
      subtotal: totals.subtotal,
      discount_total: totals.discountTotal,
      shipping_total: totals.shippingTotal,
      total: totals.total,
      status: 'pending',
      currency: 'ARS',
    })
    .select('id, order_number')
    .single()

  if (orderError || !orderData) {
    return { error: 'Error al crear el pedido. Intentá de nuevo.' }
  }

  const order = orderData as Pick<OrderRow, 'id' | 'order_number'>

  // Insert order items
  const orderItems = cartItems.map(item => ({
    order_id: order.id,
    variant_id: item.variantId,
    product_name: item.name,
    variant_name: item.variantName,
    sku: item.sku,
    unit_price: item.unitPrice,
    quantity: item.quantity,
    line_total: item.unitPrice * item.quantity,
  }))

  const { error: itemsError } = await admin.from('order_items').insert(orderItems)
  if (itemsError) {
    return { error: 'Error al guardar los ítems del pedido.' }
  }

  // Clear cart
  await clearServerCart()

  return { orderId: order.id, orderNumber: order.order_number }
}
