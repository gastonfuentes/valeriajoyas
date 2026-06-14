// Pure inventory math for the admin stock management (Stage 6, products slice).
// Import-free so it is trivially unit-testable. All values are unit counts.
//
// "available" = quantity - reserved, clamped to >= 0. This is what the
// storefront can actually sell, so stock level decisions are based on it.

/** Units the storefront can sell right now: quantity minus reserved, never below 0. */
export function availableToSell(quantity: number, reserved: number): number {
  const q = Math.max(0, Math.floor(quantity))
  const r = Math.max(0, Math.floor(reserved))
  return Math.max(0, q - r)
}

export type StockLevel = 'out' | 'low' | 'ok'

/** Classify stock by available units against the variant's low-stock threshold. */
export function stockLevel(quantity: number, reserved: number, threshold: number): StockLevel {
  const available = availableToSell(quantity, reserved)
  const t = Math.max(0, Math.floor(threshold))
  if (available <= 0) return 'out'
  if (available <= t) return 'low'
  return 'ok'
}

/**
 * The admin sets an ABSOLUTE new quantity (a stock count). Validate the target:
 * it must be a non-negative integer and must not drop below already-reserved units.
 */
export function validateStockUpdate(input: {
  newQuantity: number
  reserved: number
}): { valid: boolean; reason?: string } {
  const { newQuantity } = input
  if (!Number.isInteger(newQuantity)) {
    return { valid: false, reason: 'La cantidad debe ser un número entero.' }
  }
  if (newQuantity < 0) {
    return { valid: false, reason: 'La cantidad no puede ser negativa.' }
  }
  const reserved = Math.max(0, Math.floor(input.reserved))
  if (newQuantity < reserved) {
    return { valid: false, reason: `No podés dejar menos de ${reserved} (unidades reservadas).` }
  }
  return { valid: true }
}
