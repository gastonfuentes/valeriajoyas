import { createHmac, timingSafeEqual } from 'node:crypto'

// Mercado Pago webhook signature verification.
// Docs: the `x-signature` header is `ts=<seconds>,v1=<hmac>`. The signed
// manifest is `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` and the hash is
// HMAC-SHA256(secret, manifest). An alphanumeric data.id must be lowercased.

export type SignatureParts = { ts: string; v1: string }

export function parseSignatureHeader(header: string | null): SignatureParts | null {
  if (!header) return null
  let ts: string | undefined
  let v1: string | undefined
  for (const part of header.split(',')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const key = part.slice(0, idx).trim()
    const value = part.slice(idx + 1).trim()
    if (key === 'ts') ts = value
    else if (key === 'v1') v1 = value
  }
  if (!ts || !v1) return null
  return { ts, v1 }
}

export function buildManifest(dataId: string, requestId: string | null, ts: string): string {
  const id = dataId.toLowerCase()
  const requestPart = requestId ? `request-id:${requestId};` : ''
  return `id:${id};${requestPart}ts:${ts};`
}

export function verifyWebhookSignature(params: {
  signatureHeader: string | null
  requestId: string | null
  dataId: string
  secret: string
}): boolean {
  const { signatureHeader, requestId, dataId, secret } = params
  if (!secret || !dataId) return false

  const parsed = parseSignatureHeader(signatureHeader)
  if (!parsed) return false

  const manifest = buildManifest(dataId, requestId, parsed.ts)
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')

  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(parsed.v1, 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
