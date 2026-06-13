'use client'
import { useState, useEffect } from 'react'
import { useCart } from '@/lib/cart/cart-context'
import { useCheckout } from '../checkout-context'
import { formatARS } from '@/lib/format'
import { validateCouponAction, getStoreSettings } from '../actions'
import { PLACEHOLDER_SHIPPING_CENTAVOS } from '@/lib/commerce/shipping-constants'
import { computeTotals, type PricingCoupon, type PricingShipping } from '@/lib/commerce/pricing'

export function StepResumen() {
  const { items, subtotal } = useCart()
  const { state, applyCoupon, clearCoupon, setStep } = useCheckout()
  const [couponInput, setCouponInput] = useState(state.couponCode)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number | null>(null)

  useEffect(() => {
    getStoreSettings().then(s => setFreeShippingThreshold(s.free_shipping_threshold))
  }, [])

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return
    setCouponLoading(true)
    setCouponError(null)
    const result = await validateCouponAction(couponInput.trim(), subtotal)
    setCouponLoading(false)
    if (result.valid && result.couponId && result.discountCentavos != null) {
      applyCoupon(couponInput.trim(), result.discountCentavos, result.couponId)
    } else {
      clearCoupon()
      setCouponError(result.reason ?? 'Cupón inválido.')
    }
  }

  // Compute totals client-side for display only.
  // NOTE: The REAL computation happens server-side in createOrder.
  const pricingCoupon: PricingCoupon | null = state.couponValid && state.couponId
    ? {
        type: 'fixed',
        value: state.couponDiscount,
        minOrder: 0,
      }
    : null

  const pricingShipping: PricingShipping = {
    cost: PLACEHOLDER_SHIPPING_CENTAVOS,
    freeThreshold: freeShippingThreshold,
    pickup: state.pickup,
  }

  const lines = items.map(i => ({ variantId: i.variantId, unitPrice: i.unitPrice, quantity: i.quantity }))
  const totals = computeTotals(lines, pricingCoupon, pricingShipping)

  return (
    <div className="space-y-8">
      <h2
        style={{ fontFamily: 'var(--font-serif)' }}
        className="text-2xl font-light text-[var(--color-text)]"
      >
        Resumen del pedido
      </h2>

      {/* Items */}
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.variantId} className="flex justify-between items-start text-sm py-3 border-b border-[var(--color-border)]">
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-[var(--color-text)] font-medium">{item.name}</p>
              <p className="text-[var(--color-muted)] text-xs">{item.variantName} × {item.quantity}</p>
              <p className="text-[var(--color-muted)] text-xs">{formatARS(item.unitPrice)} c/u</p>
            </div>
            <p className="text-[var(--color-text)] font-medium shrink-0">{formatARS(item.unitPrice * item.quantity)}</p>
          </div>
        ))}
      </div>

      {/* Coupon */}
      <div className="space-y-2">
        <label className="block text-sm text-[var(--color-text)]">Cupón de descuento</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={couponInput}
            onChange={e => setCouponInput(e.target.value)}
            placeholder="Ingresá tu cupón"
            className="flex-1 border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
          />
          <button
            type="button"
            onClick={handleApplyCoupon}
            disabled={couponLoading}
            className="px-4 py-2 border border-[var(--color-primary)] text-[var(--color-primary)] text-sm hover:bg-[var(--color-primary)] hover:text-white transition-colors disabled:opacity-50"
          >
            {couponLoading ? '…' : 'Aplicar cupón'}
          </button>
        </div>
        {couponError && <p className="text-red-600 text-xs">{couponError}</p>}
        {state.couponValid && (
          <p className="text-green-700 text-xs">Cupón aplicado: −{formatARS(state.couponDiscount)}</p>
        )}
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
          <span>
            Envío
            {!state.pickup && (
              <span className="text-[var(--color-muted)] text-xs block">
                Costo estimado — se calcula en el envío real (Etapa 5)
              </span>
            )}
          </span>
          <span>
            {state.pickup
              ? '$0 (Retiro en local)'
              : totals.shippingTotal === 0
              ? 'Envío gratis'
              : formatARS(totals.shippingTotal)}
          </span>
        </div>
        <div className="flex justify-between text-[var(--color-text)] font-medium text-base pt-2 border-t border-[var(--color-border)]">
          <span>Total</span>
          <span>{formatARS(totals.total)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setStep('confirmar')}
        className="w-full bg-[var(--color-primary)] text-white py-3 text-sm tracking-widest hover:opacity-90 transition-opacity"
      >
        Confirmar pedido
      </button>
    </div>
  )
}
