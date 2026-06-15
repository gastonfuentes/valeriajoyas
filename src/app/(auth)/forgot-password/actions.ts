'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getSiteOrigin } from '@/lib/http/site-origin'

export async function requestPasswordReset(formData: FormData) {
  const email = ((formData.get('email') as string | null) ?? '').trim()

  if (email.length > 0) {
    const origin = getSiteOrigin(await headers())
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
