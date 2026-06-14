// Pure weight calculation — no I/O, fully unit-tested.
// All values are in grams and must be non-negative integers.

/**
 * Computes the billable weight in grams for a shipment.
 *
 * Logic:
 *   safeCount  = max(0, floor(itemCount))
 *   safeWeight = max(0, defaultItemWeightGrams)
 *   safePkg    = max(0, packagingWeightGrams)
 *   raw        = safeCount * safeWeight + safePkg
 *   floored    = max(raw, max(0, carrierMinimumGrams))
 *   if weightGridGrams <= 0 → return floored
 *   else                    → ceil(floored / weightGridGrams) * weightGridGrams
 */
export function computeBillableWeight(params: {
  itemCount: number
  defaultItemWeightGrams: number
  packagingWeightGrams: number
  carrierMinimumGrams: number
  weightGridGrams: number
}): number {
  const {
    itemCount,
    defaultItemWeightGrams,
    packagingWeightGrams,
    carrierMinimumGrams,
    weightGridGrams,
  } = params

  const safeCount = Math.max(0, Math.floor(itemCount))
  const safeWeight = Math.max(0, defaultItemWeightGrams)
  const safePkg = Math.max(0, packagingWeightGrams)
  const safeMin = Math.max(0, carrierMinimumGrams)

  const raw = safeCount * safeWeight + safePkg
  const floored = Math.max(raw, safeMin)

  if (weightGridGrams <= 0) {
    return floored
  }

  return Math.ceil(floored / weightGridGrams) * weightGridGrams
}
