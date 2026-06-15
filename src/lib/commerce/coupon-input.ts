// Admin create/edit validation for coupons — distinct from the redemption-time
// validateCoupon in coupon.ts. Pure (imports only types). Validates the
// NORMALIZED shape: percent value is 1-100; fixed value + minOrder are integer
// centavos. The UI converts pesos->centavos and normalizes the code first.

export type CouponInput = {
  code: string
  type: 'percent' | 'fixed'
  value: number // percent: 1-100 ; fixed: centavos (>0)
  minOrder: number // centavos, >= 0
  maxRedemptions: number | null // null = unlimited
  startsAt: string | null // ISO date string or null
  endsAt: string | null
}

const CODE_RE = /^[A-Z0-9_-]+$/

/** Canonical coupon code: trimmed + uppercased. */
export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase()
}

export function validateCouponInput(input: CouponInput): {
  valid: boolean
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}

  const code = normalizeCouponCode(input.code)
  if (!code) {
    errors.code = 'El código es obligatorio.'
  } else if (!CODE_RE.test(code)) {
    errors.code = 'El código solo puede tener letras, números, guiones y guiones bajos (sin espacios).'
  }

  if (input.type !== 'percent' && input.type !== 'fixed') {
    errors.type = 'Tipo de cupón inválido.'
  }

  if (!Number.isInteger(input.value)) {
    errors.value = 'El valor debe ser un número entero.'
  } else if (input.type === 'percent') {
    if (input.value < 1 || input.value > 100) {
      errors.value = 'El porcentaje debe estar entre 1 y 100.'
    }
  } else if (input.type === 'fixed') {
    if (input.value < 1) {
      errors.value = 'El monto debe ser mayor a cero.'
    }
  }

  if (!Number.isInteger(input.minOrder) || input.minOrder < 0) {
    errors.minOrder = 'El mínimo de compra debe ser un entero no negativo.'
  }

  if (input.maxRedemptions !== null) {
    if (!Number.isInteger(input.maxRedemptions) || input.maxRedemptions < 1) {
      errors.maxRedemptions = 'El máximo de canjes debe ser un entero mayor a cero (o vacío para ilimitado).'
    }
  }

  if (input.startsAt && input.endsAt) {
    const start = new Date(input.startsAt).getTime()
    const end = new Date(input.endsAt).getTime()
    if (Number.isNaN(start) || Number.isNaN(end)) {
      errors.dates = 'Fechas inválidas.'
    } else if (start > end) {
      errors.dates = 'La fecha de inicio no puede ser posterior a la de fin.'
    }
  } else {
    const single = input.startsAt ?? input.endsAt
    if (single && Number.isNaN(new Date(single).getTime())) {
      errors.dates = 'Fechas inválidas.'
    }
  }

  return { valid: Object.keys(errors).length === 0, errors }
}
