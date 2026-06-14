'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setProductStatus } from '../actions'
import { PRODUCT_STATUSES, type ProductStatus } from '@/lib/products/status'

const ACTION_LABELS: Record<ProductStatus, string> = {
  active: 'Activar',
  draft: 'Pausar (borrador)',
  archived: 'Archivar',
}

export function ProductStatusControl({
  productId,
  currentStatus,
}: {
  productId: string
  currentStatus: ProductStatus
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function change(status: ProductStatus) {
    if (loading) return
    setLoading(true)
    setError(null)
    const result = await setProductStatus({ productId, status })
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {PRODUCT_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => change(s)}
            disabled={loading || s === currentStatus}
            aria-busy={loading}
            className="border border-[var(--color-border)] text-sm text-[var(--color-text)] px-4 py-2 hover:bg-[var(--color-background-alt,var(--color-background))] transition-colors disabled:opacity-50"
          >
            {ACTION_LABELS[s]}
          </button>
        ))}
      </div>
      {error && (
        <div role="alert" className="p-3 border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
