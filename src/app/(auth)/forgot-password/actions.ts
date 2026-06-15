'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

/**
 * Resolve the public site origin for auth redirects. NEXT_PUBLIC_SITE_URL is
 * unreliable in this project (it has been unset/misconfigured in prod, which is
 * why the payments route also derives the origin from headers), and a bad value
 * makes Supabase fall back to the Site URL — dropping the /auth/reset path and
 * landing the user on the home page. Prefer a valid configured value, else derive
 * it from the request headers.
 */
async function getSiteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (configured && /^https:\/\//.test(configured) && !configured.includes('localhost')) {
    return configured
  }
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? ''
  const proto = h.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}

export async function requestPasswordReset(formData: FormData) {
  const email = ((formData.get('email') as string | null) ?? '').trim()

  if (email.length > 0) {
    const origin = await getSiteOrigin()
    const supabase = await createClient()
    // Supabase does not error on an unknown email (anti-enumeration); we ignore
    // the result and always show the same generic message so the form never
    // reveals whether an account exists. A dedicated, query-param-free callback:
    // Supabase appends ?code=... and the route redirects to /reset-password.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/reset`,
    })
  }

  redirect('/forgot-password?sent=1')
}
