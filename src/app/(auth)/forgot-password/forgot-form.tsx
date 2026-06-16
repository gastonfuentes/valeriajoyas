'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { requestPasswordReset } from './actions'

const inputClass =
  'w-full border border-[var(--color-border)] px-3 py-2.5 text-sm bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-colors'
const buttonClass =
  'w-full bg-[var(--color-primary)] text-white py-3 text-sm tracking-widest hover:bg-[var(--color-primary-hover)] transition-colors press focus-ring'

export function ForgotForm() {
  const searchParams = useSearchParams()
  const sent = searchParams.get('sent')

  if (sent) {
    return (
      <div role="status" className="text-center space-y-4">
        <h1
          style={{ fontFamily: 'var(--font-serif)' }}
          className="text-3xl font-light tracking-wide"
        >
          Revisá tu correo
        </h1>
        <p className="text-[var(--color-muted)] text-sm">
          Si existe una cuenta con ese email, te enviamos un enlace para restablecer tu contraseña.
        </p>
        <p className="text-[var(--color-muted)] text-xs">
          Abrí el enlace en este mismo dispositivo y navegador.
        </p>
        <Link href="/login" className="text-sm underline underline-offset-2 press focus-ring">
          Volver al inicio de sesión
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1
          style={{ fontFamily: 'var(--font-serif)' }}
          className="text-3xl font-light tracking-wide"
        >
          Recuperar contraseña
        </h1>
        <p className="text-[var(--color-muted)] text-sm">
          Ingresá tu email y te enviamos un enlace para restablecerla.
        </p>
      </div>

      <form action={requestPasswordReset} className="space-y-4">
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
            className={inputClass}
          />
        </div>
        <button type="submit" className={buttonClass}>
          Enviar enlace
        </button>
      </form>

      <p className="text-center text-sm text-[var(--color-muted)]">
        ¿Te acordaste?{' '}
        <Link href="/login" className="text-[var(--color-text)] underline underline-offset-2 press focus-ring">
          Iniciar sesión
        </Link>
      </p>
    </div>
  )
}
