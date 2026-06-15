import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ResetForm } from './reset-form'

export default async function ResetPasswordPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // The recovery link routes through /auth/callback, which exchanges the code and
  // establishes a session before redirecting here. No session => the link is
  // invalid, already used, or expired.
  if (!user) {
    return (
      <div className="text-center space-y-4">
        <h1
          style={{ fontFamily: 'var(--font-serif)' }}
          className="text-3xl font-light tracking-wide"
        >
          Enlace inválido o expirado
        </h1>
        <p className="text-[var(--color-muted)] text-sm">
          El enlace de recuperación no es válido o ya venció. Pedí uno nuevo.
        </p>
        <Link href="/forgot-password" className="text-sm underline underline-offset-2">
          Pedir un enlace nuevo
        </Link>
      </div>
    )
  }

  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  )
}
