'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function loginWithGoogle() {
  // NOTE: Google OAuth requires enabling the Google provider in the Supabase dashboard
  // under Authentication > Providers > Google, and adding the callback URL:
  // https://<your-project>.supabase.co/auth/v1/callback
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error || !data.url) {
    return redirect(`/login?error=${encodeURIComponent(error?.message ?? 'OAuth error')}`)
  }

  redirect(data.url)
}
