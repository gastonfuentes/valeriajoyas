'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProductFields } from '../actions'
import type { ProductFieldErrors } from '@/lib/products/product-input'

/** centavos -> editable pesos string (comma decimals, es-AR). Empty for null. */
function centavosToInput(centavos: number | null): string {
  if (centavos == null) return ''
  const pesos = centavos / 100
  return Number.isInteger(pesos) ? String(pesos) : String(pesos).replace('.', ',')
}

const labelClass = 'text-xs tracking-widest text-[var(--color-muted)] uppercase'
const inputClass =
  'w-full border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-text)]'

export function ProductEditForm({
  productId,
  initialName,
  initialBasePriceCentavos,
  initialCompareAtPriceCentavos,
  initialDescription,
  initialIsFeatured,
}: {
  productId: string
  initialName: string
  initialBasePriceCentavos: number
  initialCompareAtPriceCentavos: number | null
  initialDescription: string | null
  initialIsFeatured: boolean
}) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [price, setPrice] = useState(centavosToInput(initialBasePriceCentavos))
  const [compareAt, setCompareAt] = useState(centavosToInput(initialCompareAtPriceCentavos))
  const [description, setDescription] = useState(initialDescription ?? '')
  const [isFeatured, setIsFeatured] = useState(initialIsFeatured)

  const [errors, setErrors] = useState<ProductFieldErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  // Any edit makes the form dirty: drop the stale "saved" confirmation so it
  // never claims unsaved changes are saved.
  function markDirty() {
    if (saved) setSaved(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setErrors({})
    setGeneralError(null)
    setSaved(false)

    const result = await updateProductFields({
      productId,
      name,
      priceInput: price,
      description,
      compareAtPriceInput: compareAt,
      isFeatured,
    })

    setLoading(false)
    if (result.fieldErrors) {
      setErrors(result.fieldErrors)
      return
    }
    if (result.error) {
      setGeneralError(result.error)
      return
    }
    setSaved(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="name" className={labelClass}>
          Nombre
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            markDirty()
          }}
          aria-describedby={errors.name ? 'name-error' : undefined}
          aria-invalid={errors.name ? true : undefined}
          className={inputClass}
        />
        {errors.name && (
          <p id="name-error" className="text-xs text-red-700">
            {errors.name}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="price" className={labelClass}>
            Precio (ARS)
          </label>
          <input
            id="price"
            type="text"
            inputMode="decimal"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value)
              markDirty()
            }}
            aria-describedby={errors.price ? 'price-error' : undefined}
            aria-invalid={errors.price ? true : undefined}
            className={inputClass}
          />
          {errors.price && (
            <p id="price-error" className="text-xs text-red-700">
              {errors.price}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="compareAt" className={labelClass}>
            Precio tachado (opcional)
          </label>
          <input
            id="compareAt"
            type="text"
            inputMode="decimal"
            value={compareAt}
            onChange={(e) => {
              setCompareAt(e.target.value)
              markDirty()
            }}
            aria-describedby={errors.compareAtPrice ? 'compareAt-error' : undefined}
            aria-invalid={errors.compareAtPrice ? true : undefined}
            className={inputClass}
          />
          {errors.compareAtPrice && (
            <p id="compareAt-error" className="text-xs text-red-700">
              {errors.compareAtPrice}
            </p>
          )}
        </div>
      </div>
      <p className="text-xs text-[var(--color-muted)]">
        Usá coma para decimales, sin separador de miles (ej: 18990 o 18990,50).
      </p>

      <div className="space-y-1">
        <label htmlFor="description" className={labelClass}>
          Descripción
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value)
            markDirty()
          }}
          rows={5}
          aria-describedby={errors.description ? 'description-error' : undefined}
          aria-invalid={errors.description ? true : undefined}
          className={`${inputClass} resize-y`}
        />
        {errors.description && (
          <p id="description-error" className="text-xs text-red-700">
            {errors.description}
          </p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
        <input
          type="checkbox"
          checked={isFeatured}
          onChange={(e) => {
            setIsFeatured(e.target.checked)
            markDirty()
          }}
        />
        Destacado en la home
      </label>

      {generalError && (
        <p role="alert" className="text-sm text-red-700">
          {generalError}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm text-green-700">
          Cambios guardados.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className="border border-[var(--color-text)] px-5 py-2 text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-text)] hover:text-white disabled:opacity-50"
      >
        {loading ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  )
}
