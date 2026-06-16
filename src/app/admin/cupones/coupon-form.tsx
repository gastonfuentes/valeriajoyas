'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCoupon, updateCoupon, type CouponFormValues } from './actions'
import { parseArsAmount } from '@/lib/format'

type InitialValues = CouponFormValues & { id: string }

const AR_TZ = 'America/Argentina/Buenos_Aires'

// Extract the YYYY-MM-DD calendar day, in the store's timezone (AR), from a
// stored ISO timestamp — so a date the admin entered round-trips correctly
// regardless of the UTC offset Supabase returns.
function isoToArDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: AR_TZ })
}

export function CouponForm({ initial }: { initial?: InitialValues | null }) {
  const router = useRouter()
  const isEdit = !!initial

  // fixed: display pesos (centavos / 100); percent: display the integer as-is.
  const initialValueDisplay = initial
    ? initial.type === 'fixed'
      ? String(initial.value / 100)
      : String(initial.value)
    : ''
  const initialMinOrderDisplay = initial && initial.minOrder > 0 ? String(initial.minOrder / 100) : ''

  const [type, setType] = useState<'percent' | 'fixed'>(initial?.type ?? 'percent')
  const [code, setCode] = useState(initial?.code ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [valueDisplay, setValueDisplay] = useState(initialValueDisplay)
  const [minOrderDisplay, setMinOrderDisplay] = useState(initialMinOrderDisplay)
  const [maxRedemptions, setMaxRedemptions] = useState(
    initial?.maxRedemptions != null ? String(initial.maxRedemptions) : '',
  )
  const [startsAt, setStartsAt] = useState(initial?.startsAt ? isoToArDate(initial.startsAt) : '')
  const [endsAt, setEndsAt] = useState(initial?.endsAt ? isoToArDate(initial.endsAt) : '')
  const [isActive, setIsActive] = useState(initial?.isActive ?? true)

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setErrors({})
    setGeneralError(null)

    const rawValue = parseArsAmount(valueDisplay)
    if (!Number.isFinite(rawValue)) {
      setErrors({ value: 'Ingresá un valor válido.' })
      return
    }
    const rawMinOrder = minOrderDisplay.trim() ? parseArsAmount(minOrderDisplay) : 0
    if (!Number.isFinite(rawMinOrder)) {
      setErrors({ minOrder: 'Ingresá un mínimo válido.' })
      return
    }

    // fixed: pesos -> centavos. percent: pass the raw number through UNROUNDED so
    // validateCouponInput can reject a non-integer percentage (e.g. 10.5).
    const value = type === 'fixed' ? Math.round(rawValue * 100) : rawValue
    const minOrder = Math.round(rawMinOrder * 100)

    // Anchor the validity window to the AR business day: start at 00:00 and end
    // inclusive at 23:59:59 local time, so a coupon is valid through its end date.
    const payload: CouponFormValues = {
      code,
      description: description.trim() || null,
      type,
      value,
      minOrder,
      maxRedemptions: maxRedemptions.trim() ? parseInt(maxRedemptions, 10) : null,
      startsAt: startsAt ? `${startsAt}T00:00:00-03:00` : null,
      endsAt: endsAt ? `${endsAt}T23:59:59-03:00` : null,
      isActive,
    }

    setLoading(true)
    const result = isEdit ? await updateCoupon(initial!.id, payload) : await createCoupon(payload)
    setLoading(false)

    if ('errors' in result && result.errors) {
      setErrors(result.errors)
      if (result.errors._) setGeneralError(result.errors._)
      return
    }

    if (isEdit) router.refresh()
    else router.push('/admin/cupones')
  }

  const inputClass =
    'w-full border border-[var(--color-border)] px-3 py-2.5 text-sm bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-colors'
  const labelClass = 'block text-sm text-[var(--color-muted)] mb-1'
  const fieldError = (key: string) =>
    errors[key] ? (
      <p role="alert" className="text-xs text-red-600 mt-1">
        {errors[key]}
      </p>
    ) : null

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      {generalError && (
        <div role="alert" className="p-3 border border-red-200 bg-red-50 text-red-700 text-sm">
          {generalError}
        </div>
      )}

      {/* Code */}
      <div>
        <label htmlFor="code" className={labelClass}>
          Código
        </label>
        <input
          id="code"
          type="text"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className={inputClass}
          placeholder="VERANO20"
          autoComplete="off"
        />
        {fieldError('code')}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className={labelClass}>
          Descripción (opcional)
        </label>
        <input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
          placeholder="Ej.: Descuento de verano"
        />
      </div>

      {/* Type */}
      <div>
        <label htmlFor="type" className={labelClass}>
          Tipo
        </label>
        <select
          id="type"
          value={type}
          onChange={(e) => {
            setType(e.target.value as 'percent' | 'fixed')
            setValueDisplay('')
            setErrors({})
          }}
          className={inputClass}
        >
          <option value="percent">Porcentaje (%)</option>
          <option value="fixed">Monto fijo ($)</option>
        </select>
        {fieldError('type')}
      </div>

      {/* Value */}
      <div>
        <label htmlFor="value" className={labelClass}>
          {type === 'percent' ? 'Descuento (%)' : 'Descuento ($)'}
        </label>
        <input
          id="value"
          type="number"
          required
          min={type === 'percent' ? 1 : 1}
          max={type === 'percent' ? 100 : undefined}
          step={type === 'percent' ? 1 : 0.01}
          value={valueDisplay}
          onChange={(e) => setValueDisplay(e.target.value)}
          className={inputClass}
          placeholder={type === 'percent' ? 'Ej.: 10' : 'Ej.: 500'}
        />
        {fieldError('value')}
      </div>

      {/* Min order */}
      <div>
        <label htmlFor="min_order" className={labelClass}>
          Mínimo de compra ($) (opcional)
        </label>
        <input
          id="min_order"
          type="number"
          min={0}
          step={0.01}
          value={minOrderDisplay}
          onChange={(e) => setMinOrderDisplay(e.target.value)}
          className={inputClass}
          placeholder="Ej.: 5000 — dejar vacío para sin mínimo"
        />
        {fieldError('minOrder')}
      </div>

      {/* Max redemptions */}
      <div>
        <label htmlFor="max_redemptions" className={labelClass}>
          Máximo de canjes (opcional — vacío = ilimitado)
        </label>
        <input
          id="max_redemptions"
          type="number"
          min={1}
          step={1}
          value={maxRedemptions}
          onChange={(e) => setMaxRedemptions(e.target.value)}
          className={inputClass}
          placeholder="Ej.: 100"
        />
        {fieldError('maxRedemptions')}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="starts_at" className={labelClass}>
            Válido desde (opcional)
          </label>
          <input
            id="starts_at"
            type="date"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="ends_at" className={labelClass}>
            Válido hasta (opcional)
          </label>
          <input
            id="ends_at"
            type="date"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      {fieldError('dates')}

      {/* Active */}
      <div className="flex items-center gap-3">
        <input
          id="is_active"
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 border border-[var(--color-border)]"
        />
        <label htmlFor="is_active" className="text-sm text-[var(--color-muted)]">
          Activo
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[var(--color-primary)] text-white py-3 text-sm tracking-widest hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 press focus-ring"
      >
        {loading ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear cupón'}
      </button>
    </form>
  )
}
