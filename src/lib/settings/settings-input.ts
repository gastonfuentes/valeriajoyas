// Pure validation for the admin "Ajustes de tienda" (store settings) form.
// Takes the raw form values and returns either a normalized, persistence-ready
// value (money in CENTAVOS, weights in GRAMS) or per-field errors.

import { parseArsAmount } from '@/lib/format'

const MAX_TEXT_LENGTH = 200

export type StoreSettingsInput = {
  /** Free-shipping threshold in pesos as typed (es-AR comma decimals); '' = no free shipping. */
  freeShippingThresholdInput: string
  /** Default per-item weight in grams (integer). */
  itemWeightInput: string
  /** Packaging weight in grams (integer). */
  packagingWeightInput: string
  originPostalCode: string
  contactEmail: string
  contactPhone: string
}

export type StoreSettingsValue = {
  free_shipping_threshold: number | null
  default_item_weight_grams: number
  packaging_weight_grams: number
  origin_postal_code: string | null
  contact_email: string | null
  contact_phone: string | null
}

export type StoreSettingsErrors = Partial<
  Record<
    'freeShipping' | 'itemWeight' | 'packagingWeight' | 'originPostalCode' | 'contactEmail' | 'contactPhone',
    string
  >
>

export type ValidateStoreSettingsResult =
  | { ok: true; value: StoreSettingsValue }
  | { ok: false; errors: StoreSettingsErrors }

const PHONE_RE = /^[+0-9()\-.\s]+$/

/** Parse a required non-negative integer (grams). Returns null when invalid. */
function parseGrams(s: string): number | null {
  const trimmed = s.trim()
  if (!/^\d+$/.test(trimmed)) return null
  return Number(trimmed)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateStoreSettings(input: StoreSettingsInput): ValidateStoreSettingsResult {
  const errors: StoreSettingsErrors = {}

  // Free-shipping threshold (optional; null = no free shipping; 0 = always free)
  let freeShippingThreshold: number | null = null
  const freeRaw = input.freeShippingThresholdInput.trim()
  if (freeRaw.length > 0) {
    const pesos = parseArsAmount(freeRaw)
    if (!Number.isFinite(pesos)) {
      errors.freeShipping = 'Umbral inválido.'
    } else {
      const centavos = Math.round(pesos * 100)
      if (centavos < 0) {
        errors.freeShipping = 'El umbral no puede ser negativo.'
      } else {
        freeShippingThreshold = centavos
      }
    }
  }

  // Weights (required, non-negative integer grams)
  const itemWeight = parseGrams(input.itemWeightInput)
  if (itemWeight === null) {
    errors.itemWeight = 'Ingresá un peso en gramos (entero ≥ 0).'
  }
  const packagingWeight = parseGrams(input.packagingWeightInput)
  if (packagingWeight === null) {
    errors.packagingWeight = 'Ingresá un peso en gramos (entero ≥ 0).'
  }

  // Origin postal code (optional)
  let originPostalCode: string | null = null
  const postal = input.originPostalCode.trim()
  if (postal.length > MAX_TEXT_LENGTH) {
    errors.originPostalCode = 'Código postal demasiado largo.'
  } else {
    originPostalCode = postal.length === 0 ? null : postal
  }

  // Contact email (optional, basic format)
  let contactEmail: string | null = null
  const email = input.contactEmail.trim()
  if (email.length === 0) {
    contactEmail = null
  } else if (!EMAIL_RE.test(email) || email.length > MAX_TEXT_LENGTH) {
    errors.contactEmail = 'Email inválido.'
  } else {
    contactEmail = email
  }

  // Contact phone (optional). Restrict to a tel-safe charset so it lands cleanly
  // in the footer's tel: href.
  let contactPhone: string | null = null
  const phone = input.contactPhone.trim()
  if (phone.length === 0) {
    contactPhone = null
  } else if (phone.length > MAX_TEXT_LENGTH) {
    errors.contactPhone = 'Teléfono demasiado largo.'
  } else if (!PHONE_RE.test(phone)) {
    errors.contactPhone = 'Teléfono inválido.'
  } else {
    contactPhone = phone
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    value: {
      free_shipping_threshold: freeShippingThreshold,
      default_item_weight_grams: itemWeight as number,
      packaging_weight_grams: packagingWeight as number,
      origin_postal_code: originPostalCode,
      contact_email: contactEmail,
      contact_phone: contactPhone,
    },
  }
}
