// Pure validation for the admin "edit product fields" form (Stage 6, Productos parte 2).
// Mirrors the coupon-input contract: takes the raw form values and returns either a
// normalized, persistence-ready value (money in CENTAVOS) or per-field errors.

import { parseArsAmount } from '@/lib/format'

const MAX_NAME_LENGTH = 120
const MAX_DESCRIPTION_LENGTH = 5000

export type ProductFieldsInput = {
  name: string
  /** Price in pesos as typed (es-AR: comma is the decimal separator). */
  priceInput: string
  description: string
  /** Compare-at price (precio tachado) in pesos; '' means none. */
  compareAtPriceInput: string
  isFeatured: boolean
}

export type ProductFieldsValue = {
  name: string
  basePriceCentavos: number
  compareAtPriceCentavos: number | null
  description: string | null
  isFeatured: boolean
}

export type ProductFieldErrors = Partial<
  Record<'name' | 'price' | 'compareAtPrice' | 'description', string>
>

export type ValidateProductFieldsResult =
  | { ok: true; value: ProductFieldsValue }
  | { ok: false; errors: ProductFieldErrors }

function pesosToCentavos(pesos: number): number {
  return Math.round(pesos * 100)
}

export function validateProductFields(input: ProductFieldsInput): ValidateProductFieldsResult {
  const errors: ProductFieldErrors = {}

  // Name
  const name = input.name.trim()
  if (name.length === 0) {
    errors.name = 'El nombre es obligatorio.'
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.name = `El nombre no puede superar ${MAX_NAME_LENGTH} caracteres.`
  }

  // Base price (required, > 0)
  let basePriceCentavos: number | null = null
  const pesos = parseArsAmount(input.priceInput)
  if (!Number.isFinite(pesos)) {
    errors.price = 'Precio inválido.'
  } else {
    const centavos = pesosToCentavos(pesos)
    if (centavos < 1) {
      errors.price = 'El precio debe ser mayor a 0.'
    } else {
      basePriceCentavos = centavos
    }
  }

  // Compare-at price (optional; if present must be > base price)
  let compareAtPriceCentavos: number | null = null
  const compareRaw = input.compareAtPriceInput.trim()
  if (compareRaw.length > 0) {
    const comparePesos = parseArsAmount(compareRaw)
    if (!Number.isFinite(comparePesos)) {
      errors.compareAtPrice = 'Precio comparativo inválido.'
    } else {
      const compareCentavos = pesosToCentavos(comparePesos)
      if (compareCentavos < 1) {
        errors.compareAtPrice = 'El precio comparativo debe ser mayor a 0.'
      } else if (basePriceCentavos !== null && compareCentavos <= basePriceCentavos) {
        // Only enforce the "> base" rule when the base price itself is valid;
        // otherwise the base-price error is the actionable one.
        errors.compareAtPrice = 'El precio comparativo debe ser mayor al precio base.'
      } else {
        compareAtPriceCentavos = compareCentavos
      }
    }
  }

  // Description (optional)
  let description: string | null = null
  const desc = input.description.trim()
  if (desc.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `La descripción no puede superar ${MAX_DESCRIPTION_LENGTH} caracteres.`
  } else {
    description = desc.length === 0 ? null : desc
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    value: {
      name,
      basePriceCentavos: basePriceCentavos as number,
      compareAtPriceCentavos,
      description,
      isFeatured: input.isFeatured,
    },
  }
}
