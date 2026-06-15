'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setCouponActive, deleteCoupon } from '../actions'

export function CouponActions({
  id,
  isActive,
}: {
  id: string
  isActive: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) {
    return <p className="text-sm text-[var(--color-muted)]">Procesando...</p>
  }

  async function handleToggle() {
    if (loading) return
    setLoading(true)
    setError(null)
    const result = await setCouponActive(id, !isActive)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  async function handleDelete() {
    if (loading) return
    const confirmed = confirm(
      '¿Eliminar este cupón? Los pedidos que ya lo usaron no se verán afectados.',
    )
    if (!confirmed) return
    setLoading(true)
    setError(null)
    const result = await deleteCoupon(id)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    router.push('/admin/cupones')
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleToggle}
          className="border border-[var(--color-border)] text-sm text-[var(--color-text)] px-4 py-2 hover:bg-[var(--color-background-alt,var(--color-background))] transition-colors"
        >
          {isActive ? 'Desactivar' : 'Activar'}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="border border-red-200 text-sm text-red-600 px-4 py-2 hover:bg-red-50 transition-colors"
        >
          Eliminar
        </button>
      </div>
      {error && (
        <div role="alert" className="p-3 border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
