'use client'
import { useState } from 'react'
import { useCart } from '@/lib/cart/cart-context'
import { formatARS } from '@/lib/format'
import type { Database } from '@/lib/database.types'

type Variant = Database['public']['Tables']['product_variants']['Row']

interface ProductInfo {
  slug: string
  name: string
  base_price: number
}

interface VariantPurchaseProps {
  product: ProductInfo
  variants: Variant[]
  inventoryMap: Record<string, number>
}

function stockLabel(available: number): { text: string; color: string } {
  if (available === 0) return { text: 'Sin stock', color: 'text-[var(--color-muted)]' }
  if (available <= 3) return { text: 'Pocas unidades', color: 'text-amber-600' }
  return { text: 'En stock', color: 'text-green-700' }
}

export function VariantPurchase({ product, variants, inventoryMap }: VariantPurchaseProps) {
  const { add } = useCart()

  // Default to first variant with stock, else first variant
  const defaultVariant =
    variants.find(v => (inventoryMap[v.id] ?? 0) > 0) ?? variants[0] ?? null

  const [selectedId, setSelectedId] = useState<string>(defaultVariant?.id ?? '')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const selectedVariant = variants.find(v => v.id === selectedId) ?? defaultVariant

  if (!selectedVariant) {
    return (
      <p className="text-sm text-[var(--color-muted)]">Sin variantes disponibles.</p>
    )
  }

  const effectivePrice = selectedVariant.price ?? product.base_price
  const available = inventoryMap[selectedVariant.id] ?? 0
  const stock = stockLabel(available)

  // Show variant selector only if more than 1 variant OR single variant has a meaningful name
  const showSelector = variants.length > 1 ||
    (variants.length === 1 && selectedVariant.name !== null && selectedVariant.name !== 'Único')

  function handleAdd() {
    add({
      variantId: selectedVariant!.id,
      productSlug: product.slug,
      name: product.name,
      variantName: selectedVariant!.name ?? 'Único',
      unitPrice: effectivePrice,
      quantity: qty,
      maxQty: available,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="space-y-4">
      {/* Variant selector */}
      {showSelector && (
        <div>
          <p className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-widest mb-2">
            Variante
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map(v => {
              const vAvailable = inventoryMap[v.id] ?? 0
              return (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelectedId(v.id)
                    setQty(1)
                  }}
                  disabled={vAvailable === 0}
                  className={`px-3 py-1.5 text-sm border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    selectedId === v.id
                      ? 'border-[var(--color-primary)] text-[var(--color-text)]'
                      : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {v.name ?? 'Único'}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Price override when variant has its own price */}
      {selectedVariant.price !== null && selectedVariant.price !== product.base_price && (
        <p className="text-xl text-[var(--color-text)]">{formatARS(effectivePrice)}</p>
      )}

      {/* Stock indicator */}
      <p className={`text-sm ${stock.color}`}>{stock.text}</p>

      {/* Quantity + add to cart */}
      <div className="flex items-center gap-3">
        {/* Quantity stepper */}
        <div className="flex items-center border border-[var(--color-border)]">
          <button
            onClick={() => setQty(q => Math.max(1, q - 1))}
            disabled={qty <= 1 || available === 0}
            className="w-9 h-10 flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors disabled:opacity-40"
            aria-label="Restar cantidad"
          >
            −
          </button>
          <span className="w-8 text-center text-sm text-[var(--color-text)]">{qty}</span>
          <button
            onClick={() => setQty(q => Math.min(available, q + 1))}
            disabled={qty >= available || available === 0}
            className="w-9 h-10 flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors disabled:opacity-40"
            aria-label="Sumar cantidad"
          >
            +
          </button>
        </div>

        {/* Add to cart button */}
        <button
          onClick={handleAdd}
          disabled={available === 0}
          className={`flex-1 h-10 text-sm tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            added
              ? 'bg-green-700 text-white'
              : 'bg-[var(--color-primary)] text-white hover:opacity-90'
          }`}
        >
          {added ? '✓ Agregado' : 'Agregar al carrito'}
        </button>
      </div>
    </div>
  )
}
