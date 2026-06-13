'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { register } from './actions'

export function RegisterForm() {
  const searchParams = useSearchParams()
  const errorMsg = searchParams.get('error')
  const success = searchParams.get('success')

  if (success) {
    return (
      <div className="text-center space-y-4">
        <h1
          style={{ fontFamily: 'var(--font-serif)' }}
          className="text-3xl font-light tracking-wide"
        >
          ¡Cuenta creada!
        </h1>
        <p className="text-[var(--color-muted)] text-sm">
          Revisá tu email para confirmar tu cuenta.
        </p>
        <Link href="/login" className="text-sm underline underline-offset-2">
          Volver al inicio de sesión
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1
          style={{ fontFamily: 'var(--font-serif)' }}
          className="text-3xl font-light tracking-wide"
        >
          Crear cuenta
        </h1>
      </div>

      {errorMsg && (
        <p className="text-sm text-red-600 text-center bg-red-50 border border-red-200 px-4 py-3">
          {errorMsg}
        </p>
      )}

      <form action={register} className="space-y-4">
        <div>
          <label htmlFor="full_name" className="block text-sm text-[var(--color-muted)] mb-1">
            Nombre completo
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            autoComplete="name"
            className="w-full border border-[var(--color-border)] px-3 py-2.5 text-sm bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm text-[var(--color-muted)] mb-1">
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full border border-[var(--color-border)] px-3 py-2.5 text-sm bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm text-[var(--color-muted)] mb-1">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={6}
            className="w-full border border-[var(--color-border)] px-3 py-2.5 text-sm bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-[var(--color-primary)] text-white py-3 text-sm tracking-widest hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Crear cuenta
        </button>
      </form>

      <p className="text-center text-sm text-[var(--color-muted)]">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="text-[var(--color-text)] underline underline-offset-2">
          Iniciar sesión
        </Link>
      </p>
    </div>
  )
}
