'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function register(formData: FormData) {
  const supabase = await createClient()

  const fullName = formData.get('full_name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    return redirect(`/register?error=${encodeURIComponent(error.message)}`)
  }

  // If a session is returned, email confirmation is disabled — go to account
  if (data.session) {
    redirect('/')
  }

  // Email confirmation required — show success message
  redirect('/register?success=1')
}
