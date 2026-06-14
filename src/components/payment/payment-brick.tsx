'use client'

import { useCallback, useMemo, useState, type ComponentProps } from 'react'
import { useRouter } from 'next/navigation'
import { initMercadoPago, Payment } from '@mercadopago/sdk-react'
import type { IPaymentFormData } from '@mercadopago/sdk-react/esm/bricks/payment/type'

// Initialize the SDK once at module load (safe — this is a client module).
initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!)

type PaymentProps = ComponentProps<typeof Payment>

interface PaymentBrickProps {
  orderId: string
  amount: number // pesos (not centavos)
  payerEmail: string
}

export function PaymentBrick({ orderId, amount, payerEmail }: PaymentBrickProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  // Stable prop identities so the MP SDK initializes the brick exactly ONCE.
  const initialization = useMemo<PaymentProps['initialization']>(
    () => ({ amount, payer: { email: payerEmail } }),
    [amount, payerEmail],
  )

  const customization = useMemo<PaymentProps['customization']>(
    () => ({
      paymentMethods: {
        creditCard: 'all',
        debitCard: 'all',
        mercadoPago: 'all',
        ticket: 'all',
      },
    }),
    [],
  )

  const onSubmit = useCallback(
    async ({ formData }: IPaymentFormData): Promise<unknown> => {
      setError(null)
      try {
        const res = await fetch('/api/payments/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, formData }),
        })

        const data = (await res.json().catch(() => ({}))) as { status?: string; error?: string }

        if (!res.ok) {
          throw new Error(data.error ?? 'No se pudo procesar el pago.')
        }

        router.push(`/pedido/${orderId}`)
        return data
      } catch (e) {
        // Surface the reason in the UI (the Brick does not always show it) and
        // re-throw so the Brick re-enables its form.
        const msg = e instanceof Error ? e.message : 'No se pudo procesar el pago.'
        setError(msg)
        throw e
      }
    },
    [orderId, router],
  )

  const onError = useCallback((err: unknown) => {
    console.error('[PaymentBrick] error:', err)
  }, [])

  return (
    <div className="space-y-4">
      {error && (
        <div
          role="alert"
          className="border border-red-300 bg-red-50 text-red-800 text-sm px-4 py-3 rounded"
        >
          {error}
        </div>
      )}
      <Payment
        initialization={initialization}
        customization={customization}
        onSubmit={onSubmit}
        onError={onError}
      />
    </div>
  )
}
