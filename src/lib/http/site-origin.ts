/** The minimal slice of `Headers` this helper needs — also satisfied by the
 *  `ReadonlyHeaders` returned by `next/headers`, so both request contexts work. */
type HeaderGetter = Pick<Headers, 'get'>

/**
 * Resolve the public site origin (e.g. `https://valeriajoyas.vercel.app`) for
 * building absolute URLs. NEXT_PUBLIC_SITE_URL is unreliable in this project (it
 * has been unset/misconfigured in prod), so a configured value is only trusted
 * when it is https and not localhost; otherwise the origin is derived from the
 * request headers. Pure and sync: callers pass their own header source — a
 * server action passes `await headers()`, a route handler passes `req.headers`.
 */
export function getSiteOrigin(headers: HeaderGetter): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (configured && /^https:\/\//.test(configured) && !configured.includes('localhost')) {
    return configured
  }
  const host = headers.get('x-forwarded-host') ?? headers.get('host') ?? ''
  const proto = headers.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}
