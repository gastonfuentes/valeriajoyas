'use client'

import { useRouter } from 'next/navigation'
import { initMercadoPago, Payment } from '@mercadopago/sdk-react'
import type { IPaymentFormData } from '@mercadopago/sdk-react/esm/bricks/payment/type'

// Initialize once at module load — safe because this is a client module.
initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!)

interface PaymentBrickProps {
  orderId: string
  amount: number   // pesos (not centavos)
  payerEmail: string
}

export function PaymentBrick({ orderId, amount, payerEmail }: PaymentBrickProps) {
  const router = useRouter()

  const onSubmit = async (paymentFormData: IPaymentFormData): Promise<unknown> => {
    const res = await fetch('/api/payments/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, formData: paymentFormData.formData }),
    })

    const data = await res.json() as { status?: string; error?: string }

    if (!res.ok) {
      throw new Error(data.error ?? 'Error al procesar el pago.')
    }

    router.push(`/pedido/${orderId}`)
    return data
  }

  const onError = (error: unknown) => {
    console.error('[PaymentBrick] error:', error)
  }

  return (
    <Payment
      initialization={{
        amount,
        payer: { email: payerEmail },
      }}
      customization={{
        paymentMethods: {
          creditCard: 'all',
          debitCard: 'all',
          mercadoPago: 'all',
          ticket: 'all',
        },
      }}
      onSubmit={onSubmit}
      onError={onError}
      onReady={() => {}}
    />
  )
}
