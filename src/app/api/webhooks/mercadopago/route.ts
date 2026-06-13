export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { verifyWebhookSignature } from '@/lib/mercadopago/signature'
import { getMpPayment } from '@/lib/mercadopago/client'
import { mapMpPaymentStatus } from '@/lib/mercadopago/status'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const xSignature = req.headers.get('x-signature')
    const xRequestId = req.headers.get('x-request-id')

    // data.id can come from the query param or the body
    const url = req.nextUrl
    let dataId = url.searchParams.get('data.id') ?? ''

    let bodyJson: Record<string, unknown> = {}
    try {
      bodyJson = await req.json()
    } catch {
      // body may be empty for some topics
    }

    if (!dataId) {
      // Fallback: body data.id or top-level id
      const bodyData = bodyJson.data as Record<string, unknown> | undefined
      dataId = String(bodyData?.id ?? bodyJson.id ?? '')
    }

    const secret = process.env.MP_WEBHOOK_SECRET ?? ''

    // FAIL CLOSED: a webhook with no configured secret cannot be authenticated,
    // so it must be rejected — never processed. Signature verification is the
    // only thing standing between us and a forged "payment approved".
    if (!secret) {
      console.error('[webhook/mercadopago] MP_WEBHOOK_SECRET not configured — rejecting')
      return new Response('webhook secret not configured', { status: 401 })
    }

    const valid = verifyWebhookSignature({
      signatureHeader: xSignature,
      requestId: xRequestId,
      dataId,
      secret,
    })
    if (!valid) {
      return new Response('invalid signature', { status: 401 })
    }

    // Only process payment events
    const type = String(bodyJson.type ?? bodyJson.action ?? '')
    if (!type.includes('payment')) {
      return new Response('ok', { status: 200 })
    }

    if (!dataId) {
      return new Response('ok', { status: 200 })
    }

    const mpPayment = await getMpPayment(dataId)

    const orderId = mpPayment.external_reference ? String(mpPayment.external_reference) : null
    if (!orderId) {
      return new Response('ok', { status: 200 })
    }

    const mpStatus = String(mpPayment.status ?? '')
    const mpStatusDetail = mpPayment.status_detail != null ? String(mpPayment.status_detail) : null
    const mpId = String(mpPayment.id)
    const mpAmount = Math.round(Number(mpPayment.transaction_amount) * 100)

    const appStatus = mapMpPaymentStatus(mpStatus)

    // Cast to `any` because apply_mp_payment is not yet in the generated types.
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any).rpc('apply_mp_payment', {
      p_order_id: orderId,
      p_provider: 'mercadopago',
      p_external_id: mpId,
      p_status: appStatus,
      p_status_detail: mpStatusDetail,
      p_amount: mpAmount,
      p_raw: mpPayment,
    })

    if (error) {
      console.error('[webhook/mercadopago] rpc error:', error)
      // Return 500 so Mercado Pago retries
      return new Response('processing error', { status: 500 })
    }

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('[webhook/mercadopago]', err)
    return new Response('error', { status: 500 })
  }
}
