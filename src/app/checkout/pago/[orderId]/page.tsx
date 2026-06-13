import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatARS } from '@/lib/format'
import { PaymentBrick } from '@/components/payment/payment-brick'
import type { Database } from '@/lib/database.types'

type OrderRow = Database['public']['Tables']['orders']['Row']

export default async function PagoPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/login?next=/checkout/pago/${orderId}`)
  }

  const { data: orderData } = await supabase
    .from('orders')
    .select('id, order_number, total, status, email')
    .eq('id', orderId)
    .maybeSingle()

  if (!orderData) notFound()

  const order = orderData as Pick<OrderRow, 'id' | 'order_number' | 'total' | 'status' | 'email'>

  // Already processed — send to order detail
  if (order.status !== 'pending') {
    redirect(`/pedido/${orderId}`)
  }

  const amountPesos = order.total / 100

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <div className="space-y-2">
        <h1
          style={{ fontFamily: 'var(--font-serif)' }}
          className="text-3xl font-light text-[var(--color-text)]"
        >
          Pagar pedido
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Pedido #{order.order_number} · Total: {formatARS(order.total)}
        </p>
      </div>

      <div className="border border-[var(--color-border)] p-6">
        <PaymentBrick
          orderId={order.id}
          amount={amountPesos}
          payerEmail={order.email}
        />
      </div>
    </div>
  )
}
