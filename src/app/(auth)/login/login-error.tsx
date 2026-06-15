'use client'

import { useSearchParams } from 'next/navigation'

export function LoginError() {
  const searchParams = useSearchParams()
  const errorMsg = searchParams.get('error')
  const reset = searchParams.get('reset')

  if (errorMsg) {
    return (
      <p
        role="alert"
        className="text-sm text-red-600 text-center bg-red-50 border border-red-200 px-4 py-3"
      >
        {errorMsg}
      </p>
    )
  }

  if (reset) {
    return (
      <p
        role="status"
        className="text-sm text-green-700 text-center bg-green-50 border border-green-200 px-4 py-3"
      >
        Tu contraseña fue actualizada. Iniciá sesión con la nueva.
      </p>
    )
  }

  return null
}
