/**
 * Pure cart transforms shared by the guest (local) and logged-in (optimistic)
 * paths in the cart context. Kept free of React so they can be unit-tested.
 */

export type CartLine = {
  variantId: string
  quantity: number
  maxQty: number
}

/** Add an item, merging into an existing line and clamping to its maxQty. */
export function applyAdd<T extends CartLine>(prev: T[], item: T): T[] {
  const existing = prev.find((i) => i.variantId === item.variantId)
  if (existing) {
    return prev.map((i) =>
      i.variantId === item.variantId
        ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.maxQty) }
        : i,
    )
  }
  return [...prev, item]
}

/** Set a line's quantity, clamped to [1, maxQty]; drops lines that fall to 0. */
export function applySetQty<T extends CartLine>(prev: T[], variantId: string, n: number): T[] {
  return prev
    .map((i) =>
      i.variantId === variantId ? { ...i, quantity: Math.max(1, Math.min(n, i.maxQty)) } : i,
    )
    .filter((i) => i.quantity > 0)
}

/** Remove a line entirely. */
export function applyRemove<T extends CartLine>(prev: T[], variantId: string): T[] {
  return prev.filter((i) => i.variantId !== variantId)
}
