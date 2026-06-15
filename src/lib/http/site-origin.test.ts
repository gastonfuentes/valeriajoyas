import { describe, it, expect, afterEach } from 'vitest'
import { getSiteOrigin } from './site-origin'

/** Build a minimal header-getter from a plain map (mirrors Headers#get). */
function fakeHeaders(map: Record<string, string>): { get(name: string): string | null } {
  return { get: (name) => map[name] ?? null }
}

const ENV_KEY = 'NEXT_PUBLIC_SITE_URL'
const originalEnv = process.env[ENV_KEY]

afterEach(() => {
  if (originalEnv === undefined) delete process.env[ENV_KEY]
  else process.env[ENV_KEY] = originalEnv
})

describe('getSiteOrigin', () => {
  describe('when NEXT_PUBLIC_SITE_URL is a valid https non-localhost value', () => {
    it('prefers the configured value', () => {
      process.env[ENV_KEY] = 'https://valeriajoyas.vercel.app'
      expect(getSiteOrigin(fakeHeaders({ 'x-forwarded-host': 'other.com' }))).toBe(
        'https://valeriajoyas.vercel.app',
      )
    })

    it('strips a trailing slash', () => {
      process.env[ENV_KEY] = 'https://valeriajoyas.vercel.app/'
      expect(getSiteOrigin(fakeHeaders({}))).toBe('https://valeriajoyas.vercel.app')
    })
  })

  describe('when NEXT_PUBLIC_SITE_URL is unreliable, it derives from headers', () => {
    it('ignores a localhost configured value', () => {
      process.env[ENV_KEY] = 'https://localhost:3000'
      const headers = fakeHeaders({ 'x-forwarded-host': 'prod.com', 'x-forwarded-proto': 'https' })
      expect(getSiteOrigin(headers)).toBe('https://prod.com')
    })

    it('ignores a non-https configured value', () => {
      process.env[ENV_KEY] = 'http://insecure.com'
      const headers = fakeHeaders({ 'x-forwarded-host': 'prod.com', 'x-forwarded-proto': 'https' })
      expect(getSiteOrigin(headers)).toBe('https://prod.com')
    })

    it('ignores an unset configured value', () => {
      delete process.env[ENV_KEY]
      const headers = fakeHeaders({ 'x-forwarded-host': 'prod.com', 'x-forwarded-proto': 'https' })
      expect(getSiteOrigin(headers)).toBe('https://prod.com')
    })
  })

  describe('header derivation', () => {
    it('uses x-forwarded-host and x-forwarded-proto', () => {
      delete process.env[ENV_KEY]
      const headers = fakeHeaders({ 'x-forwarded-host': 'a.com', 'x-forwarded-proto': 'http' })
      expect(getSiteOrigin(headers)).toBe('http://a.com')
    })

    it('falls back to host when x-forwarded-host is absent', () => {
      delete process.env[ENV_KEY]
      const headers = fakeHeaders({ host: 'b.com', 'x-forwarded-proto': 'https' })
      expect(getSiteOrigin(headers)).toBe('https://b.com')
    })

    it('defaults the proto to https when x-forwarded-proto is absent', () => {
      delete process.env[ENV_KEY]
      const headers = fakeHeaders({ 'x-forwarded-host': 'c.com' })
      expect(getSiteOrigin(headers)).toBe('https://c.com')
    })

    it('yields an empty host when no host header is present', () => {
      delete process.env[ENV_KEY]
      expect(getSiteOrigin(fakeHeaders({}))).toBe('https://')
    })
  })
})
