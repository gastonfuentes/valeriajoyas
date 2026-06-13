import { describe, it, expect } from 'vitest'
import { createHmac } from 'node:crypto'
import { parseSignatureHeader, buildManifest, verifyWebhookSignature } from './signature'

// Mercado Pago signs every webhook. If this verification is wrong, an attacker
// could POST a fake "payment approved" and mark orders paid for free. These
// tests lock the exact manifest format + HMAC comparison down.

const secret = 'test_secret_abc'
const ts = '1700000000'
const dataId = 'A1B2C3' // alphanumeric -> MP requires lowercasing in the manifest
const requestId = 'req-123'

function validHeader(): string {
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`
  const v1 = createHmac('sha256', secret).update(manifest).digest('hex')
  return `ts=${ts},v1=${v1}`
}

describe('parseSignatureHeader', () => {
  it('extracts ts and v1', () => {
    expect(parseSignatureHeader('ts=123,v1=abc')).toEqual({ ts: '123', v1: 'abc' })
  })
  it('tolerates whitespace between parts', () => {
    expect(parseSignatureHeader('ts=123, v1=abc')).toEqual({ ts: '123', v1: 'abc' })
  })
  it('returns null on missing parts or null header', () => {
    expect(parseSignatureHeader(null)).toBeNull()
    expect(parseSignatureHeader('ts=123')).toBeNull()
  })
})

describe('buildManifest', () => {
  it('formats id;request-id;ts and lowercases an alphanumeric id', () => {
    expect(buildManifest('A1B2', 'r1', '999')).toBe('id:a1b2;request-id:r1;ts:999;')
  })
  it('omits request-id when absent', () => {
    expect(buildManifest('55', null, '999')).toBe('id:55;ts:999;')
  })
})

describe('verifyWebhookSignature', () => {
  it('accepts a correctly signed payload', () => {
    expect(verifyWebhookSignature({ signatureHeader: validHeader(), requestId, dataId, secret })).toBe(true)
  })
  it('rejects a tampered hash', () => {
    expect(verifyWebhookSignature({ signatureHeader: `ts=${ts},v1=deadbeef`, requestId, dataId, secret })).toBe(false)
  })
  it('rejects a wrong secret', () => {
    expect(verifyWebhookSignature({ signatureHeader: validHeader(), requestId, dataId, secret: 'other' })).toBe(false)
  })
  it('rejects when data.id differs from the signed manifest', () => {
    expect(verifyWebhookSignature({ signatureHeader: validHeader(), requestId, dataId: 'ZZZ', secret })).toBe(false)
  })
  it('rejects a missing header or empty secret', () => {
    expect(verifyWebhookSignature({ signatureHeader: null, requestId, dataId, secret })).toBe(false)
    expect(verifyWebhookSignature({ signatureHeader: validHeader(), requestId, dataId, secret: '' })).toBe(false)
  })
})
