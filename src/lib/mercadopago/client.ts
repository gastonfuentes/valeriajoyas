// Server-only. Never import into client components.
// Wraps the Mercado Pago REST API for payment creation and retrieval.

function getAccessToken(): string {
  const token = process.env.MP_ACCESS_TOKEN
  if (!token) throw new Error('MP_ACCESS_TOKEN is not set')
  return token
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getAccessToken()}`,
    'Content-Type': 'application/json',
  }
}

export async function createMpPayment(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const idempotencyKey = crypto.randomUUID()

  const res = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'X-Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (!res.ok) {
    const mpError = JSON.stringify(data)
    throw new Error(`Mercado Pago error ${res.status}: ${mpError}`)
  }

  return data as Record<string, unknown>
}

export async function getMpPayment(id: string | number): Promise<Record<string, unknown>> {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    method: 'GET',
    headers: authHeaders(),
  })

  const data = await res.json()

  if (!res.ok) {
    const mpError = JSON.stringify(data)
    throw new Error(`Mercado Pago error ${res.status}: ${mpError}`)
  }

  return data as Record<string, unknown>
}
