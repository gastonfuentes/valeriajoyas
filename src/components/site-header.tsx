import Link from 'next/link'
import { Logo } from '@/components/logo'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CartBadge } from '@/components/cart-badge'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function SiteHeader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-background)] border-b border-[var(--color-border)]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link href="/" className="hover:opacity-70 transition-opacity">
          <Logo />
        </Link>

        {/* Right nav */}
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/"
            className="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            Inicio
          </Link>
          <Link
            href="/productos"
            className="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            Catálogo
          </Link>

          {/* Cart */}
          <CartBadge />

          {/* Auth area */}
          {user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/account"
                className="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                Mi cuenta
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  Cerrar sesión
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              Iniciar sesión
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
