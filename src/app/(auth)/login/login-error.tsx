'use client'

import { useSearchParams } from 'next/navigation'

export function LoginError() {
  const searchParams = useSearchParams()
  const errorMsg = searchParams.get('error')

  if (!errorMsg) return null

  return (
    <p className="text-sm text-red-600 text-center bg-red-50 border border-red-200 px-4 py-3">
      {errorMsg}
    </p>
  )
}
