'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart/cart-context'
import { useCheckout } from '../checkout-context'
import { formatARS } from '@/lib/format'
import { createOrder } from '../actions'
import { computeTotals, type PricingCoupon, type PricingShipping } from '@/lib/commerce/pricing'

export function StepConfirmar({
  freeShippingThreshold,
}: {
  freeShippingThreshold: number | null
}) {
  const { items, clear } = useCart()
  const { state } = useCheckout()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pricingCoupon: PricingCoupon | null = state.couponValid && state.couponId
    ? { type: 'fixed', value: state.couponDiscount, minOrder: 0 }
    : null

  // Use the real carrier quote from context; fall back to 0 if not yet quoted.
  // The authoritative cost is recomputed server-side in createOrder — this is display only.
  const pricingShipping: PricingShipping = {
    cost: state.shippingCostCentavos ?? 0,
    freeThreshold: freeShippingThreshold,
    pickup: state.pickup,
  }

  const lines = items.map(i => ({ variantId: i.variantId, unitPrice: i.unitPrice, quantity: i.quantity }))
  const totals = computeTotals(lines, pricingCoupon, pricingShipping)

  async function handleFinalize() {
    if (!state.contact) return
    setLoading(true)
    setError(null)

    const result = await createOrder({
      email: state.contact.email,
      phone: state.contact.phone,
      pickup: state.pickup,
      shippingAddress: state.shipping,
      couponCode: state.couponCode || null,
    })

    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    clear()
    router.push(`/checkout/pago/${result.orderId}`)
  }

  return (
    <div className="space-y-8">
      <h2
        style={{ fontFamily: 'var(--font-serif)' }}
        className="text-2xl font-light text-[var(--color-text)]"
      >
        Confirmación del pedido
      </h2>

      {/* Contact */}
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-[var(--color-text)]">Datos de contacto</h3>
        <p className="text-sm text-[var(--color-muted)]">{state.contact?.email}</p>
        <p className="text-sm text-[var(--color-muted)]">{state.contact?.phone}</p>
      </div>

      {/* Shipping */}
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-[var(--color-text)]">Envío</h3>
        {state.pickup ? (
          <p className="text-sm text-[var(--color-muted)]">Retiro en local</p>
        ) : state.shipping ? (
          <p className="text-sm text-[var(--color-muted)]">
            {state.shipping.recipient_name}, {state.shipping.street} {state.shipping.street_number}
            {state.shipping.apartment ? `, ${state.shipping.apartment}` : ''} — {state.shipping.city}, {state.shipping.province} {state.shipping.postal_code}
          </p>
        ) : null}
      </div>

      {/* Items */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-[var(--color-text)]">Productos</h3>
        {items.map(item => (
          <div key={item.variantId} className="flex justify-between text-sm py-2 border-b border-[var(--color-border)]">
            <span className="text-[var(--color-text)]">{item.name} — {item.variantName} × {item.quantity}</span>
            <span className="text-[var(--color-text)]">{formatARS(item.unitPrice * item.quantity)}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-[var(--color-text)]">
          <span>Subtotal</span>
          <span>{formatARS(totals.subtotal)}</span>
        </div>
        {totals.discountTotal > 0 && (
          <div className="flex justify-between text-green-700">
            <span>Descuento</span>
            <span>−{formatARS(totals.discountTotal)}</span>
          </div>
        )}
        <div className="flex justify-between text-[var(--color-text)]">
          <span>Envío</span>
          <span>
            {state.pickup
              ? 'Retiro en local'
              : state.shippingCostCentavos === null
              ? 'A calcular'
              : totals.shippingTotal === 0
              ? 'Envío gratis'
              : formatARS(totals.shippingTotal)}
          </span>
        </div>
        <div className="flex justify-between font-medium text-base text-[var(--color-text)] pt-2 border-t border-[var(--color-border)]">
          <span>Total</span>
          <span>
            {!state.pickup && state.shippingCostCentavos === null
              ? 'A calcular'
              : formatARS(totals.total)}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {!state.pickup && state.shippingCostCentavos === null && (
        <p className="text-sm text-[var(--color-muted)]">
          Calculá el costo de envío para continuar.
        </p>
      )}

      <button
        type="button"
        onClick={handleFinalize}
        disabled={loading || (!state.pickup && state.shippingCostCentavos === null)}
        className="w-full bg-[var(--color-primary)] text-white py-3 text-sm tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 press focus-ring"
      >
        {loading ? 'Procesando…' : 'Finalizar pedido'}
      </button>
    </div>
  )
}
