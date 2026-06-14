import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createClient } from '@/lib/supabase/server'
import { formatARS } from '@/lib/format'
import { STATUS_LABELS } from '@/lib/orders/status-labels'
import type { OrderStatus } from '@/lib/orders/transitions'
import { OrderStatusControl } from './order-status-control'

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_process: 'En proceso',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  refunded: 'Reembolsado',
  cancelled: 'Cancelado',
  charged_back: 'Contracargo',
}

const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  ready: 'Listo para enviar',
  in_transit: 'En tránsito',
  delivered: 'Entregado',
  returned: 'Devuelto',
  cancelled: 'Cancelado',
}

export default async function AdminPedidoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireAdmin()

  const supabase = await createClient()

  const { data: orderData } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single()

  if (!orderData) notFound()

  const order = orderData

  const [{ data: itemsData }, { data: payment }, { data: shipment }] = await Promise.all([
    supabase.from('order_items').select('*').eq('order_id', id),
    supabase
      .from('payments')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('shipments')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const items = itemsData ?? []
  const shippingAddress = order.shipping_address as Record<string, string> | null

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div className="space-y-2">
        <h1
          style={{ fontFamily: 'var(--font-serif)' }}
          className="text-3xl font-light tracking-wide text-[var(--color-text)]"
        >
          Pedido #{order.order_number}
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--color-muted)]">
            {new Date(order.created_at).toLocaleDateString('es-AR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <span className="inline-block px-3 py-1 text-xs border border-[var(--color-border)] text-[var(--color-muted)]">
            {STATUS_LABELS[order.status as OrderStatus] ?? order.status}
          </span>
        </div>
      </div>

      {/* Status control */}
      <div className="space-y-2">
        <h2 className="text-xs tracking-widest text-[var(--color-muted)] uppercase">
          Cambiar estado
        </h2>
        <OrderStatusControl
          orderId={order.id}
          currentStatus={order.status as OrderStatus}
        />
      </div>

      {/* Customer */}
      <div className="space-y-1">
        <h2 className="text-xs tracking-widest text-[var(--color-muted)] uppercase">
          Cliente
        </h2>
        <p className="text-sm text-[var(--color-text)]">{order.email}</p>
        {order.phone && (
          <p className="text-sm text-[var(--color-muted)]">{order.phone}</p>
        )}
      </div>

      {/* Shipping address */}
      <div className="space-y-1">
        <h2 className="text-xs tracking-widest text-[var(--color-muted)] uppercase">
          Envío
        </h2>
        {order.pickup ? (
          <p className="text-sm text-[var(--color-muted)]">Retiro en local</p>
        ) : shippingAddress ? (
          <p className="text-sm text-[var(--color-muted)]">
            {shippingAddress.recipient_name}, {shippingAddress.street}{' '}
            {shippingAddress.street_number}
            {shippingAddress.apartment ? `, ${shippingAddress.apartment}` : ''} —{' '}
            {shippingAddress.city}, {shippingAddress.province}{' '}
            {shippingAddress.postal_code}
          </p>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">Sin información de envío.</p>
        )}
      </div>

      {/* Items */}
      <div className="space-y-3">
        <h2 className="text-xs tracking-widest text-[var(--color-muted)] uppercase">
          Productos
        </h2>
        <div className="divide-y divide-[var(--color-border)] border border-[var(--color-border)]">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between text-sm px-4 py-3"
            >
              <div>
                <p className="text-[var(--color-text)]">{item.product_name}</p>
                {item.variant_name && (
                  <p className="text-[var(--color-muted)] text-xs">{item.variant_name}</p>
                )}
                <p className="text-[var(--color-muted)] text-xs">
                  Cantidad: {item.quantity} · {formatARS(item.unit_price)} c/u
                </p>
              </div>
              <p className="text-[var(--color-text)] font-medium">
                {formatARS(item.line_total)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="space-y-2 text-sm">
        <h2 className="text-xs tracking-widest text-[var(--color-muted)] uppercase">
          Totales
        </h2>
        <div className="flex justify-between text-[var(--color-text)]">
          <span>Subtotal</span>
          <span>{formatARS(order.subtotal)}</span>
        </div>
        {order.discount_total > 0 && (
          <div className="flex justify-between text-green-700">
            <span>
              Descuento{order.coupon_code ? ` (${order.coupon_code})` : ''}
            </span>
            <span>−{formatARS(order.discount_total)}</span>
          </div>
        )}
        <div className="flex justify-between text-[var(--color-text)]">
          <span>Envío</span>
          <span>
            {order.pickup ? '$0 (Retiro en local)' : formatARS(order.shipping_total)}
          </span>
        </div>
        <div className="flex justify-between font-medium text-base text-[var(--color-text)] pt-2 border-t border-[var(--color-border)]">
          <span>Total</span>
          <span>{formatARS(order.total)}</span>
        </div>
      </div>

      {/* Payment */}
      {payment && (
        <div className="space-y-2">
          <h2 className="text-xs tracking-widest text-[var(--color-muted)] uppercase">
            Pago
          </h2>
          <div className="border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
            <div className="px-4 py-3 flex justify-between text-sm">
              <span className="text-[var(--color-muted)]">Estado</span>
              <span className="text-[var(--color-text)]">
                {PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}
              </span>
            </div>
            <div className="px-4 py-3 flex justify-between text-sm">
              <span className="text-[var(--color-muted)]">Proveedor</span>
              <span className="text-[var(--color-text)] capitalize">{payment.provider}</span>
            </div>
            {payment.external_id && (
              <div className="px-4 py-3 flex justify-between text-sm">
                <span className="text-[var(--color-muted)]">ID externo</span>
                <span className="text-[var(--color-text)] font-mono text-xs">
                  {payment.external_id}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shipment */}
      {shipment && (
        <div className="space-y-2">
          <h2 className="text-xs tracking-widest text-[var(--color-muted)] uppercase">
            Seguimiento
          </h2>
          <div className="border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
            <div className="px-4 py-3 flex justify-between text-sm">
              <span className="text-[var(--color-muted)]">Estado</span>
              <span className="text-[var(--color-text)]">
                {SHIPMENT_STATUS_LABELS[shipment.status] ?? shipment.status}
              </span>
            </div>
            <div className="px-4 py-3 flex justify-between text-sm">
              <span className="text-[var(--color-muted)]">Transportista</span>
              <span className="text-[var(--color-text)]">{shipment.provider}</span>
            </div>
            {shipment.tracking_number && (
              <div className="px-4 py-3 flex justify-between text-sm">
                <span className="text-[var(--color-muted)]">Número de seguimiento</span>
                <span className="text-[var(--color-text)] font-mono text-xs">
                  {shipment.tracking_number}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
