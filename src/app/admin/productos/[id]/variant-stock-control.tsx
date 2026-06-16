'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateVariantStock } from '../actions'

// Absolute stock set: the input IS the new total quantity for the variant.
export function VariantStockControl({
  variantId,
  currentQuantity,
}: {
  variantId: string
  currentQuantity: number
}) {
  const router = useRouter()
  const [value, setValue] = useState(String(currentQuantity))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Digit-only so '1e3' / '10.0' / whitespace can't sneak through as "integers".
  const trimmed = value.trim()
  const valid = /^\d+$/.test(trimmed) && Number(trimmed) <= Number.MAX_SAFE_INTEGER
  const parsed = valid ? Number(trimmed) : NaN
  const changed = valid && parsed !== currentQuantity

  async function save() {
    if (loading || !changed) return
    setLoading(true)
    setError(null)
    const result = await updateVariantStock({ variantId, newQuantity: parsed })
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          step={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Cantidad en stock"
          className="w-24 border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text)] outline-none"
        />
        <button
          type="button"
          onClick={save}
          disabled={loading || !changed}
          aria-busy={loading}
          className="border border-[var(--color-border)] text-sm text-[var(--color-text)] px-4 py-2 hover:bg-[var(--color-background-alt,var(--color-background))] transition-colors disabled:opacity-50 press focus-ring"
        >
          {loading ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
      {error && (
        <div role="alert" className="p-2 border border-red-200 bg-red-50 text-red-700 text-xs">
          {error}
        </div>
      )}
    </div>
  )
}
