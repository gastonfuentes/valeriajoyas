import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Dedicated callback for the password-recovery email. Supabase appends only its
// own ?code=... to this URL, so the redirect target matches the allowlist cleanly
// — unlike passing a custom ?next=/reset-password, which Supabase does not
// preserve (it falls back to the Site URL). Exchange the recovery code to mint the
// session, then send the user to the reset form.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/reset-password`)
}
