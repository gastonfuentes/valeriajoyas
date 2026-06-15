'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function requestPasswordReset(formData: FormData) {
  const email = ((formData.get('email') as string | null) ?? '').trim()

  if (email.length > 0) {
    const supabase = await createClient()
    // Supabase does not error on an unknown email (anti-enumeration); we ignore
    // the result and always show the same generic message so the form never
    // reveals whether an account exists.
    await supabase.auth.resetPasswordForEmail(email, {
      // A dedicated, query-param-free callback: Supabase appends ?code=... and the
      // route redirects to /reset-password. A custom ?next= here is NOT preserved
      // by Supabase (it falls back to the Site URL).
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset`,
    })
  }

  redirect('/forgot-password?sent=1')
}
