'use client'

import { useSearchParams } from 'next/navigation'
import { updatePassword } from './actions'
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password'

const inputClass =
  'w-full border border-[var(--color-border)] px-3 py-2.5 text-sm bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-colors'
const buttonClass =
  'w-full bg-[var(--color-primary)] text-white py-3 text-sm tracking-widest hover:bg-[var(--color-primary-hover)] transition-colors press focus-ring'

export function ResetForm() {
  const searchParams = useSearchParams()
  const errorMsg = searchParams.get('error')

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1
          style={{ fontFamily: 'var(--font-serif)' }}
          className="text-3xl font-light tracking-wide"
        >
          Nueva contraseña
        </h1>
        <p className="text-[var(--color-muted)] text-sm">Elegí una contraseña nueva para tu cuenta.</p>
      </div>

      {errorMsg && (
        <p
          role="alert"
          className="text-sm text-red-600 text-center bg-red-50 border border-red-200 px-4 py-3"
        >
          {errorMsg}
        </p>
      )}

      <form action={updatePassword} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm text-[var(--color-muted)] mb-1">
            Nueva contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm text-[var(--color-muted)] mb-1">
            Repetir contraseña
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
        <button type="submit" className={buttonClass}>
          Guardar contraseña
        </button>
      </form>
    </div>
  )
}
