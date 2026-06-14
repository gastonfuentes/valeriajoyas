import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatARS } from '@/lib/format'
import type { Database } from '@/lib/database.types'
import { STATUS_LABELS } from '@/lib/orders/status-labels'

type OrderRow = Database['public']['Tables']['orders']['Row']
type OrderItemRow = Database['public']['Tables']['order_items']['Row']

type PaymentBannerVariant = 'paid' | 'pending' | 'cancelled' | 'refunded'

const PAYMENT_BANNERS: Record<
  PaymentBannerVariant,
  { label: string; classes: string }
> = {
  paid: {
    label: 'Pago aprobado ✓',
    classes: 'border-green-300 bg-green-50 text-green-800',
  },
  pending: {
    label: 'Pago pendiente',
    classes: 'border-yellow-300 bg-yellow-50 text-yellow-800',
  },
  cancelled: {
    label: 'Pago rechazado / cancelado',
    classes: 'border-red-200 bg-red-50 text-red-700',
  },
  refunded: {
    label: 'Reembolsado',
    classes: 'border-gray-300 bg-gray-50 text-gray-700',
  },
}

function getPaymentBannerVariant(status: string): PaymentBannerVariant | null {
  if (status === 'paid' || status === 'fulfilled' || status === 'shipped' || status === 'delivered') {
    return 'paid'
  }
  if (status === 'pending') return 'pending'
  if (status === 'cancelled') return 'cancelled'
  if (status === 'refunded') return 'refunded'
  return null
}

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: orderData } = await supabase
    .from('orders')
    .select('*')
    .filter('id', 'eq', id)
    .maybeSingle()

  if (!orderData) notFound()

  const order = orderData as OrderRow

  const { data: itemsData } = await supabase
    .from('order_items')
    .select('*')
    .filter('order_id', 'eq', id)

  const items = (itemsData ?? []) as OrderItemRow[]

  const shippingAddress = order.shipping_address as Record<string, string> | null

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <div className="space-y-2">
        <h1
          style={{ fontFamily: 'var(--font-serif)' }}
          className="text-3xl font-light text-[var(--color-text)]"
        >
          Pedido #{order.order_number}
        </h1>
        <span className="inline-block px-3 py-1 text-xs border border-[var(--color-border)] text-[var(--color-muted)]">
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      {/* Payment status banner */}
      {(() => {
        const variant = getPaymentBannerVariant(order.status)
        if (!variant) return null
        const banner = PAYMENT_BANNERS[variant]
        return (
          <div className={`p-4 border text-sm font-medium ${banner.classes}`}>
            {banner.label}
          </div>
        )
      })()}

      {/* Items */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-[var(--color-text)]">Productos</h2>
        {items.map(item => (
          <div key={item.id} className="flex justify-between text-sm py-3 border-b border-[var(--color-border)]">
            <div>
              <p className="text-[var(--color-text)]">{item.product_name}</p>
              {item.variant_name && <p className="text-[var(--color-muted)] text-xs">{item.variant_name}</p>}
              <p className="text-[var(--color-muted)] text-xs">Cantidad: {item.quantity} · {formatARS(item.unit_price)} c/u</p>
            </div>
            <p className="text-[var(--color-text)] font-medium">{formatARS(item.line_total)}</p>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-[var(--color-text)]">
          <span>Subtotal</span>
          <span>{formatARS(order.subtotal)}</span>
        </div>
        {order.discount_total > 0 && (
          <div className="flex justify-between text-green-700">
            <span>Descuento{order.coupon_code ? ` (${order.coupon_code})` : ''}</span>
            <span>−{formatARS(order.discount_total)}</span>
          </div>
        )}
        <div className="flex justify-between text-[var(--color-text)]">
          <span>Envío</span>
          <span>{order.pickup ? '$0 (Retiro en local)' : formatARS(order.shipping_total)}</span>
        </div>
        <div className="flex justify-between font-medium text-base text-[var(--color-text)] pt-2 border-t border-[var(--color-border)]">
          <span>Total</span>
          <span>{formatARS(order.total)}</span>
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-1">
        <h2 className="text-sm font-medium text-[var(--color-text)]">Datos de contacto</h2>
        <p className="text-sm text-[var(--color-muted)]">{order.email}</p>
        {order.phone && <p className="text-sm text-[var(--color-muted)]">{order.phone}</p>}
      </div>

      {/* Shipping */}
      <div className="space-y-1">
        <h2 className="text-sm font-medium text-[var(--color-text)]">Envío</h2>
        {order.pickup ? (
          <p className="text-sm text-[var(--color-muted)]">Retiro en local</p>
        ) : shippingAddress ? (
          <p className="text-sm text-[var(--color-muted)]">
            {shippingAddress.recipient_name}, {shippingAddress.street} {shippingAddress.street_number}
            {shippingAddress.apartment ? `, ${shippingAddress.apartment}` : ''} — {shippingAddress.city}, {shippingAddress.province} {shippingAddress.postal_code}
          </p>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">Sin información de envío.</p>
        )}
      </div>

    </div>
  )
}
