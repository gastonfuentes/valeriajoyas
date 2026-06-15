'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { validateNewPassword } from '@/lib/auth/password'

export async function updatePassword(formData: FormData) {
  const password = (formData.get('password') as string | null) ?? ''
  const confirm = (formData.get('confirm') as string | null) ?? ''

  const validation = validateNewPassword(password, confirm)
  if (!validation.ok) {
    const msg = validation.errors.password ?? validation.errors.confirm ?? 'Datos inválidos.'
    return redirect(`/reset-password?error=${encodeURIComponent(msg)}`)
  }

  const supabase = await createClient()

  // This endpoint must run inside the recovery session minted by the callback.
  // updateUser already fails without a session, but gate explicitly so the error
  // is our own Spanish copy and the guard lives in the endpoint, not only in the
  // page's getUser() check.
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return redirect(
      `/reset-password?error=${encodeURIComponent('Tu sesión de recuperación venció. Pedí un enlace nuevo.')}`,
    )
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    // Supabase returns these in English; map to es-AR with a generic fallback.
    const msg = /different from the old/i.test(error.message)
      ? 'La nueva contraseña debe ser distinta de la anterior.'
      : 'No pudimos actualizar la contraseña. Probá de nuevo.'
    return redirect(`/reset-password?error=${encodeURIComponent(msg)}`)
  }

  // Password changed — drop the recovery session and have them log in fresh with
  // the new password (confirms it works).
  await supabase.auth.signOut()
  redirect('/login?reset=1')
}
