import { Suspense } from 'react'
import Link from 'next/link'
import { login, loginWithGoogle } from './actions'
import { LoginError } from './login-error'

function LoginForm() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1
          style={{ fontFamily: 'var(--font-serif)' }}
          className="text-3xl font-light tracking-wide"
        >
          Iniciar sesión
        </h1>
      </div>

      <Suspense>
        <LoginError />
      </Suspense>

      <form action={login} className="space-y-4">
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
            autoComplete="current-password"
            className="w-full border border-[var(--color-border)] px-3 py-2.5 text-sm bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          />
          <div className="mt-1 text-right">
            <Link
              href="/forgot-password"
              className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] underline underline-offset-2 press focus-ring"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-[var(--color-primary)] text-white py-3 text-sm tracking-widest hover:bg-[var(--color-primary-hover)] transition-colors press focus-ring"
        >
          Iniciar sesión
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--color-border)]" />
        </div>
        <div className="relative flex justify-center text-xs text-[var(--color-muted)] bg-[var(--color-background)] px-2">
          o
        </div>
      </div>

      <form action={loginWithGoogle}>
        <button
          type="submit"
          className="w-full border border-[var(--color-border)] py-3 text-sm text-[var(--color-text)] hover:border-[var(--color-primary)] transition-colors press focus-ring"
        >
          Continuar con Google
        </button>
      </form>

      <p className="text-center text-sm text-[var(--color-muted)]">
        ¿No tenés cuenta?{' '}
        <Link href="/register" className="text-[var(--color-text)] underline underline-offset-2 press focus-ring">
          Crear cuenta
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
