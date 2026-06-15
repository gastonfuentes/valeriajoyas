'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateStoreSettings } from './actions'
import type { StoreSettingsErrors } from '@/lib/settings/settings-input'

/** centavos -> editable pesos string (comma decimals, es-AR). Empty for null. */
function centavosToInput(centavos: number | null): string {
  if (centavos == null) return ''
  const pesos = centavos / 100
  return Number.isInteger(pesos) ? String(pesos) : String(pesos).replace('.', ',')
}

const labelClass = 'text-xs tracking-widest text-[var(--color-muted)] uppercase'
const inputClass =
  'w-full border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-text)]'
const sectionTitleClass = 'text-xs tracking-widest text-[var(--color-muted)] uppercase'

export function SettingsForm({
  initialFreeShippingCentavos,
  initialItemWeightGrams,
  initialPackagingWeightGrams,
  initialOriginPostalCode,
  initialContactEmail,
  initialContactPhone,
}: {
  initialFreeShippingCentavos: number | null
  initialItemWeightGrams: number
  initialPackagingWeightGrams: number
  initialOriginPostalCode: string | null
  initialContactEmail: string | null
  initialContactPhone: string | null
}) {
  const router = useRouter()
  const [freeShipping, setFreeShipping] = useState(centavosToInput(initialFreeShippingCentavos))
  const [itemWeight, setItemWeight] = useState(String(initialItemWeightGrams))
  const [packagingWeight, setPackagingWeight] = useState(String(initialPackagingWeightGrams))
  const [originPostalCode, setOriginPostalCode] = useState(initialOriginPostalCode ?? '')
  const [contactEmail, setContactEmail] = useState(initialContactEmail ?? '')
  const [contactPhone, setContactPhone] = useState(initialContactPhone ?? '')

  const [errors, setErrors] = useState<StoreSettingsErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

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

    const result = await updateStoreSettings({
      freeShippingThresholdInput: freeShipping,
      itemWeightInput: itemWeight,
      packagingWeightInput: packagingWeight,
      originPostalCode,
      contactEmail,
      contactPhone,
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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Shipping */}
      <fieldset className="space-y-4">
        <legend className={sectionTitleClass}>Envío</legend>

        <div className="space-y-1">
          <label htmlFor="freeShipping" className={labelClass}>
            Umbral de envío gratis (ARS)
          </label>
          <input
            id="freeShipping"
            type="text"
            inputMode="decimal"
            value={freeShipping}
            onChange={(e) => {
              setFreeShipping(e.target.value)
              markDirty()
            }}
            aria-describedby={errors.freeShipping ? 'freeShipping-error' : undefined}
            aria-invalid={errors.freeShipping ? true : undefined}
            className={inputClass}
          />
          {errors.freeShipping && (
            <p id="freeShipping-error" className="text-xs text-red-700">
              {errors.freeShipping}
            </p>
          )}
          <p className="text-xs text-[var(--color-muted)]">
            Vacío = sin envío gratis. 0 = siempre gratis. Punto para miles, coma para
            decimales (ej: 50.000 o 50.000,50).
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="itemWeight" className={labelClass}>
              Peso por artículo (g)
            </label>
            <input
              id="itemWeight"
              type="text"
              inputMode="numeric"
              value={itemWeight}
              onChange={(e) => {
                setItemWeight(e.target.value)
                markDirty()
              }}
              aria-describedby={errors.itemWeight ? 'itemWeight-error' : undefined}
              aria-invalid={errors.itemWeight ? true : undefined}
              className={inputClass}
            />
            {errors.itemWeight && (
              <p id="itemWeight-error" className="text-xs text-red-700">
                {errors.itemWeight}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="packagingWeight" className={labelClass}>
              Peso del packaging (g)
            </label>
            <input
              id="packagingWeight"
              type="text"
              inputMode="numeric"
              value={packagingWeight}
              onChange={(e) => {
                setPackagingWeight(e.target.value)
                markDirty()
              }}
              aria-describedby={errors.packagingWeight ? 'packagingWeight-error' : undefined}
              aria-invalid={errors.packagingWeight ? true : undefined}
              className={inputClass}
            />
            {errors.packagingWeight && (
              <p id="packagingWeight-error" className="text-xs text-red-700">
                {errors.packagingWeight}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="originPostalCode" className={labelClass}>
            Código postal de origen
          </label>
          <input
            id="originPostalCode"
            type="text"
            value={originPostalCode}
            onChange={(e) => {
              setOriginPostalCode(e.target.value)
              markDirty()
            }}
            aria-describedby={errors.originPostalCode ? 'originPostalCode-error' : undefined}
            aria-invalid={errors.originPostalCode ? true : undefined}
            className={inputClass}
          />
          {errors.originPostalCode && (
            <p id="originPostalCode-error" className="text-xs text-red-700">
              {errors.originPostalCode}
            </p>
          )}
        </div>
      </fieldset>

      {/* Contact */}
      <fieldset className="space-y-4">
        <legend className={sectionTitleClass}>Contacto</legend>

        <div className="space-y-1">
          <label htmlFor="contactEmail" className={labelClass}>
            Email de contacto
          </label>
          <input
            id="contactEmail"
            type="email"
            value={contactEmail}
            onChange={(e) => {
              setContactEmail(e.target.value)
              markDirty()
            }}
            aria-describedby={errors.contactEmail ? 'contactEmail-error' : undefined}
            aria-invalid={errors.contactEmail ? true : undefined}
            className={inputClass}
          />
          {errors.contactEmail && (
            <p id="contactEmail-error" className="text-xs text-red-700">
              {errors.contactEmail}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="contactPhone" className={labelClass}>
            Teléfono de contacto
          </label>
          <input
            id="contactPhone"
            type="text"
            inputMode="tel"
            value={contactPhone}
            onChange={(e) => {
              setContactPhone(e.target.value)
              markDirty()
            }}
            aria-describedby={errors.contactPhone ? 'contactPhone-error' : undefined}
            aria-invalid={errors.contactPhone ? true : undefined}
            className={inputClass}
          />
          {errors.contactPhone && (
            <p id="contactPhone-error" className="text-xs text-red-700">
              {errors.contactPhone}
            </p>
          )}
        </div>
      </fieldset>

      {Object.keys(errors).length > 0 && (
        <p role="alert" className="text-sm text-red-700">
          Revisá los campos marcados.
        </p>
      )}
      {generalError && (
        <p role="alert" className="text-sm text-red-700">
          {generalError}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm text-green-700">
          Ajustes guardados.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className="border border-[var(--color-text)] px-5 py-2 text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-text)] hover:text-white disabled:opacity-50"
      >
        {loading ? 'Guardando…' : 'Guardar ajustes'}
      </button>
    </form>
  )
}
