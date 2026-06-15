const arsFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function centavosToPesos(centavos: number): number {
  return centavos / 100
}

/**
 * Parse a user-typed es-AR money string into a pesos number. Returns NaN for
 * anything that isn't money-shaped — callers must guard.
 *
 * es-AR uses the DOT as the thousands separator and the COMMA as the decimal
 * ('50.000' = fifty thousand, '1.000,50' = 1000.50). But users also habitually
 * type a DOT as the decimal point ('2.50'). So we disambiguate instead of blindly
 * stripping or keeping dots — both extremes silently corrupt money:
 *   - bare replace(',', '.')  -> '50.000' becomes 50      (1000x too small)
 *   - strip ALL dots          -> '2.50'   becomes 250     (100x too big)
 */
export function parseArsAmount(input: string): number {
  const s = input.trim()

  let normalized: string
  if (s.includes(',')) {
    // A comma is present: it is the decimal, dots are thousands grouping.
    normalized = s.replace(/\./g, '').replace(',', '.')
  } else if (/^-?\d+\.\d{1,2}$/.test(s)) {
    // A single dot with 1-2 trailing digits and no comma: dot is the decimal.
    normalized = s
  } else {
    // Otherwise any dots are thousands grouping.
    normalized = s.replace(/\./g, '')
  }

  // Only accept a plain (optionally signed) decimal, so hex/scientific/stray-sign
  // forms don't coerce to a finite-but-wrong amount via Number().
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return NaN
  return Number(normalized)
}

export function formatARS(centavos: number): string {
  return arsFormatter.format(centavosToPesos(centavos))
}
