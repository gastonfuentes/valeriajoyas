'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { nextStatuses } from '@/lib/orders/transitions'
import type { OrderStatus } from '@/lib/orders/transitions'
import { STATUS_LABELS } from '@/lib/orders/status-labels'
import { updateOrderStatus } from '../actions'

export function OrderStatusControl({
  orderId,
  currentStatus,
}: {
  orderId: string
  currentStatus: OrderStatus
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shippedExpanded, setShippedExpanded] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [carrier, setCarrier] = useState('')

  const nexts = nextStatuses(currentStatus)

  if (nexts.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        No hay acciones disponibles para este estado.
      </p>
    )
  }

  async function handleTransition(to: OrderStatus) {
    setLoading(true)
    setError(null)

    const result = await updateOrderStatus({
      orderId,
      to,
      trackingNumber: to === 'shipped' ? trackingNumber : undefined,
      carrier: to === 'shipped' ? carrier : undefined,
    })

    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {nexts.map((next) => {
          if (next === 'shipped') {
            return (
              <button
                key={next}
                type="button"
                onClick={() => setShippedExpanded((v) => !v)}
                disabled={loading}
                className="border border-[var(--color-border)] text-sm text-[var(--color-text)] px-4 py-2 hover:bg-[var(--color-background-alt,var(--color-background))] transition-colors disabled:opacity-50 press focus-ring"
              >
                Marcar como {STATUS_LABELS[next].toLowerCase()}
              </button>
            )
          }
          return (
            <button
              key={next}
              type="button"
              onClick={() => handleTransition(next)}
              disabled={loading}
              className="border border-[var(--color-border)] text-sm text-[var(--color-text)] px-4 py-2 hover:bg-[var(--color-background-alt,var(--color-background))] transition-colors disabled:opacity-50"
            >
              {loading ? 'Procesando…' : `Marcar como ${STATUS_LABELS[next].toLowerCase()}`}
            </button>
          )
        })}
      </div>

      {/* Shipping details form — revealed only when 'shipped' is the target */}
      {shippedExpanded && nexts.includes('shipped') && (
        <div className="border border-[var(--color-border)] p-4 space-y-4">
          <p className="text-xs tracking-widest text-[var(--color-muted)] uppercase">
            Datos de envío
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-[var(--color-muted)] mb-1">
                Número de seguimiento
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="ej. AR123456789"
                className="border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text)] w-full outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-muted)] mb-1">
                Transportista
              </label>
              <input
                type="text"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="ej. Andreani, OCA, Correo Argentino"
                className="border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text)] w-full outline-none"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleTransition('shipped')}
            disabled={loading || !trackingNumber.trim() || !carrier.trim()}
            className="bg-[var(--color-primary)] text-white text-sm px-6 py-2 tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 press focus-ring"
          >
            {loading ? 'Procesando…' : 'Confirmar envío'}
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
