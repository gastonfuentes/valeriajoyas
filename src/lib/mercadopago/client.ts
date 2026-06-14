// Server-only. Never import into client components.
// Wraps the Mercado Pago REST API for payment creation and retrieval.

const MP_API = 'https://api.mercadopago.com'
const MP_TIMEOUT_MS = 15_000

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

type MpError = Error & { mpStatus?: number; mpBody?: unknown }

// Single fetch helper with a timeout so a hung MP request can never leave the
// payment route (and therefore the Brick) spinning forever.
async function mpFetch(path: string, init: RequestInit): Promise<Record<string, unknown>> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), MP_TIMEOUT_MS)

  try {
    const res = await fetch(`${MP_API}${path}`, { ...init, signal: controller.signal })
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>

    if (!res.ok) {
      const message =
        (typeof data.message === 'string' && data.message) ||
        (typeof data.error === 'string' && data.error) ||
        `Mercado Pago respondió ${res.status}`
      const err: MpError = Object.assign(new Error(message), { mpStatus: res.status, mpBody: data })
      throw err
    }

    return data
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Mercado Pago no respondió a tiempo. Intentá de nuevo.')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export async function createMpPayment(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  return mpFetch('/v1/payments', {
    method: 'POST',
    headers: { ...authHeaders(), 'X-Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify(body),
  })
}

export async function getMpPayment(id: string | number): Promise<Record<string, unknown>> {
  return mpFetch(`/v1/payments/${id}`, {
    method: 'GET',
    headers: authHeaders(),
  })
}
