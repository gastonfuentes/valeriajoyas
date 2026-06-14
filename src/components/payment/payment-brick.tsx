'use client'

import { useCallback, useMemo, type ComponentProps } from 'react'
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

  // Stable prop identities so the MP SDK initializes the brick exactly ONCE.
  // Recreating these objects/callbacks on every render makes the SDK re-init
  // and append a SECOND brick ("Medios de pago" appeared twice).
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
      const res = await fetch('/api/payments/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, formData }),
      })

      const data = (await res.json().catch(() => ({}))) as { status?: string; error?: string }

      if (!res.ok) {
        // Reject so the Brick stops its loading animation and surfaces the reason.
        throw new Error(data.error ?? 'No se pudo procesar el pago.')
      }

      router.push(`/pedido/${orderId}`)
      return data
    },
    [orderId, router],
  )

  const onError = useCallback((error: unknown) => {
    console.error('[PaymentBrick] error:', error)
  }, [])

  return (
    <Payment
      initialization={initialization}
      customization={customization}
      onSubmit={onSubmit}
      onError={onError}
    />
  )
}
