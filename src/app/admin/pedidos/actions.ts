'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { canTransition } from '@/lib/orders/transitions'
import type { OrderStatus } from '@/lib/orders/transitions'
import { currentAdmin } from '@/lib/auth/require-admin'

export async function updateOrderStatus(input: {
  orderId: string
  to: OrderStatus
  trackingNumber?: string
  carrier?: string
}): Promise<{ error?: string; ok?: true }> {
  // 1. Verify admin — every server action must check independently.
  const admin = await currentAdmin()
  if (!admin) return { error: 'No autorizado.' }

  const supabase = await createClient()

  // 2. Read the order via RLS client.
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, status, shipping_total, shipping_address, pickup')
    .eq('id', input.orderId)
    .single()

  if (orderError || !order) return { error: 'Pedido no encontrado.' }

  // 3. Validate the transition using the state machine.
  const check = canTransition(order.status as OrderStatus, input.to)
  if (!check.allowed) return { error: check.reason ?? 'Transición inválida.' }

  // 4. If transitioning to 'shipped', validate tracking fields and upsert the shipment.
  if (input.to === 'shipped') {
    if (!input.trackingNumber?.trim() || !input.carrier?.trim()) {
      return { error: 'Ingresá número de seguimiento y transportista.' }
    }

    const shippingAddress = order.shipping_address as Record<string, string> | null
    const postalCode = shippingAddress?.postal_code ?? null

    const shipmentPayload = {
      provider: input.carrier.trim(),
      tracking_number: input.trackingNumber.trim(),
      status: 'in_transit' as const,
      cost: order.shipping_total,
      currency: 'ARS',
      destination_postal_code: postalCode,
    }

    // Record the shipment BEFORE advancing the order and fail closed if it
    // can't be written — otherwise the order could read "enviado" with no
    // shipment/tracking. Shipment-first keeps a retry idempotent: the order
    // stays in 'fulfilled', so canTransition still permits a re-run that
    // updates the existing shipment row. (One shipment per order in slice 1.)
    const { data: existing } = await supabase
      .from('shipments')
      .select('id')
      .eq('order_id', input.orderId)
      .maybeSingle()

    const { error: shipmentError } = existing
      ? await supabase.from('shipments').update(shipmentPayload).eq('id', existing.id)
      : await supabase.from('shipments').insert({ order_id: input.orderId, ...shipmentPayload })

    if (shipmentError) {
      return { error: 'No se pudo registrar el envío. Intentá de nuevo.' }
    }
  }

  // 5. If transitioning to 'delivered', mark the shipment as delivered (best-effort).
  if (input.to === 'delivered') {
    const { data: shipment } = await supabase
      .from('shipments')
      .select('id')
      .eq('order_id', input.orderId)
      .maybeSingle()

    if (shipment) {
      // Ignore errors — we don't fail the order update if this fails.
      await supabase
        .from('shipments')
        .update({ status: 'delivered' })
        .eq('id', shipment.id)
    }
  }

  // 6. Update the order status.
  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: input.to })
    .eq('id', input.orderId)

  if (updateError) return { error: 'No se pudo actualizar el estado.' }

  // 7. Revalidate admin pages so the UI reflects the new state.
  revalidatePath('/admin/pedidos')
  revalidatePath(`/admin/pedidos/${input.orderId}`)
  revalidatePath(`/pedido/${input.orderId}`)

  return { ok: true }
}
