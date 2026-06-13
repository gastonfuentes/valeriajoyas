export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createMpPayment } from '@/lib/mercadopago/client'
import { mapMpPaymentStatus } from '@/lib/mercadopago/status'
import type { Database } from '@/lib/database.types'

type OrderRow = Database['public']['Tables']['orders']['Row']

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, formData } = body as { orderId: string; formData: Record<string, unknown> }

    if (!orderId || !formData) {
      return NextResponse.json({ error: 'Datos incompletos.' }, { status: 400 })
    }

    // Authenticate user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
    }

    // Load order via authenticated client — RLS guarantees ownership
    const { data: orderData } = await supabase
      .from('orders')
      .select('id, order_number, total, status, email')
      .eq('id', orderId)
      .maybeSingle()

    if (!orderData) {
      return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 })
    }

    const order = orderData as Pick<OrderRow, 'id' | 'order_number' | 'total' | 'status' | 'email'>

    if (order.status !== 'pending') {
      return NextResponse.json({ error: 'El pedido ya no está pendiente.' }, { status: 400 })
    }

    // Amount is ALWAYS read from the DB — never from the client
    const transactionAmount = Number((order.total / 100).toFixed(2))

    const mpPayment = await createMpPayment({
      transaction_amount: transactionAmount,
      token: formData.token,
      description: `Pedido #${order.order_number} - valeria joyas`,
      installments: formData.installments,
      payment_method_id: formData.payment_method_id,
      issuer_id: formData.issuer_id,
      payer: formData.payer,
      external_reference: orderId,
      notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/mercadopago`,
    })

    const mpStatus = String(mpPayment.status ?? '')
    const mpStatusDetail = mpPayment.status_detail != null ? String(mpPayment.status_detail) : null
    const mpId = String(mpPayment.id)
    const mpAmount = Math.round(Number(mpPayment.transaction_amount) * 100)

    const appStatus = mapMpPaymentStatus(mpStatus)

    // Apply via service-role (bypasses RLS, atomic + idempotent).
    // Cast to `any` because apply_mp_payment is not yet in the generated types.
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).rpc('apply_mp_payment', {
      p_order_id: orderId,
      p_provider: 'mercadopago',
      p_external_id: mpId,
      p_status: appStatus,
      p_status_detail: mpStatusDetail,
      p_amount: mpAmount,
      p_raw: mpPayment,
    })

    return NextResponse.json({
      status: mpStatus,
      status_detail: mpStatusDetail,
      orderId,
    })
  } catch (err) {
    // Never leak the access token or internal details
    console.error('[payments/process]', err)
    return NextResponse.json(
      { error: 'Error al procesar el pago. Intentá de nuevo.' },
      { status: 500 },
    )
  }
}
