export type MergeItem = {
  variantId: string
  quantity: number
  maxQty: number
}

export function mergeCartItems(local: MergeItem[], remote: MergeItem[]): MergeItem[] {
  const map = new Map<string, MergeItem>()

  for (const item of remote) {
    map.set(item.variantId, { ...item })
  }

  for (const item of local) {
    const existing = map.get(item.variantId)
    if (existing) {
      existing.quantity = Math.min(existing.quantity + item.quantity, existing.maxQty)
    } else {
      map.set(item.variantId, { ...item })
    }
  }

  return Array.from(map.values())
}
