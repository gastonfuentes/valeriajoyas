import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/database.types'

export default async function AccountPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single() as { data: Tables<'profiles'> | null; error: unknown }

  const memberSince = new Date(user!.created_at).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-8">
      <h1
        style={{ fontFamily: 'var(--font-serif)' }}
        className="text-3xl font-light tracking-wide"
      >
        Mi cuenta
      </h1>

      <div className="border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
        <div className="px-6 py-4 flex justify-between text-sm">
          <span className="text-[var(--color-muted)]">Nombre</span>
          <span className="text-[var(--color-text)]">{profile?.full_name ?? '—'}</span>
        </div>
        <div className="px-6 py-4 flex justify-between text-sm">
          <span className="text-[var(--color-muted)]">Correo electrónico</span>
          <span className="text-[var(--color-text)]">{user!.email}</span>
        </div>
        <div className="px-6 py-4 flex justify-between text-sm">
          <span className="text-[var(--color-muted)]">Rol</span>
          <span className="text-[var(--color-text)] capitalize">{profile?.role ?? 'customer'}</span>
        </div>
        <div className="px-6 py-4 flex justify-between text-sm">
          <span className="text-[var(--color-muted)]">Miembro desde</span>
          <span className="text-[var(--color-text)]">{memberSince}</span>
        </div>
      </div>
    </div>
  )
}
