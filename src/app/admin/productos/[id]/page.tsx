import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createClient } from '@/lib/supabase/server'
import { formatARS } from '@/lib/format'
import { availableToSell, stockLevel } from '@/lib/inventory/stock'
import { PRODUCT_STATUS_LABELS, type ProductStatus } from '@/lib/products/status'
import { ProductStatusControl } from './product-status-control'
import { VariantStockControl } from './variant-stock-control'

type RawInv = { quantity: number; reserved: number; low_stock_threshold: number }
type RawVariant = {
  id: string
  name: string | null
  sku: string | null
  price: number | null
  is_active: boolean
  inventory: RawInv | RawInv[] | null
}
type RawProduct = {
  id: string
  name: string
  slug: string
  status: string
  material: string | null
  base_price: number
  compare_at_price: number | null
  is_featured: boolean
  product_variants: RawVariant[] | null
}

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v
}

const STOCK_BADGE_LABELS = { out: 'Sin stock', low: 'Stock bajo', ok: 'OK' } as const

export default async function AdminProductoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireAdmin()

  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select(
      'id, name, slug, status, material, base_price, compare_at_price, is_featured, product_variants(id, name, sku, price, is_active, inventory(quantity, reserved, low_stock_threshold))',
    )
    .eq('id', id)
    .maybeSingle()

  if (!data) notFound()
  const product = data as unknown as RawProduct
  const variants = product.product_variants ?? []

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div className="space-y-2">
        <h1
          style={{ fontFamily: 'var(--font-serif)' }}
          className="text-3xl font-light tracking-wide text-[var(--color-text)]"
        >
          {product.name}
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--color-muted)]">/{product.slug}</span>
          <span className="inline-block px-3 py-1 text-xs border border-[var(--color-border)] text-[var(--color-muted)]">
            {PRODUCT_STATUS_LABELS[product.status as ProductStatus] ?? product.status}
          </span>
          {product.is_featured && (
            <span className="text-xs text-[var(--color-muted)]">Destacado</span>
          )}
        </div>
      </div>

      {/* Details (read-only in this slice) */}
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--color-muted)]">Precio base</span>
          <span className="text-[var(--color-text)]">{formatARS(product.base_price)}</span>
        </div>
        {product.compare_at_price != null && (
          <div className="flex justify-between">
            <span className="text-[var(--color-muted)]">Precio comparativo</span>
            <span className="text-[var(--color-muted)] line-through">
              {formatARS(product.compare_at_price)}
            </span>
          </div>
        )}
        {product.material && (
          <div className="flex justify-between">
            <span className="text-[var(--color-muted)]">Material</span>
            <span className="text-[var(--color-text)]">{product.material}</span>
          </div>
        )}
      </div>

      {/* Status control */}
      <div className="space-y-2">
        <h2 className="text-xs tracking-widest text-[var(--color-muted)] uppercase">
          Estado del producto
        </h2>
        <ProductStatusControl productId={product.id} currentStatus={product.status as ProductStatus} />
      </div>

      {/* Variants + stock */}
      <div className="space-y-3">
        <h2 className="text-xs tracking-widest text-[var(--color-muted)] uppercase">
          Variantes y stock
        </h2>
        {variants.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">Este producto no tiene variantes.</p>
        ) : (
          <div className="divide-y divide-[var(--color-border)] border border-[var(--color-border)]">
            {variants.map((v) => {
              const inv = one(v.inventory)
              const qty = inv?.quantity ?? 0
              const res = inv?.reserved ?? 0
              const thr = inv?.low_stock_threshold ?? 0
              const available = availableToSell(qty, res)
              const level = stockLevel(qty, res, thr)
              return (
                <div key={v.id} className="px-4 py-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm text-[var(--color-text)]">
                        {v.name || 'Variante única'}
                        {!v.is_active && (
                          <span className="text-[var(--color-muted)] text-xs"> · inactiva</span>
                        )}
                      </p>
                      {v.sku && <p className="text-xs text-[var(--color-muted)]">SKU: {v.sku}</p>}
                      <p className="text-xs text-[var(--color-muted)]">
                        {formatARS(v.price ?? product.base_price)}
                      </p>
                    </div>
                    <span
                      className={
                        level === 'ok'
                          ? 'inline-block px-2 py-1 text-xs border border-[var(--color-border)] text-[var(--color-muted)] whitespace-nowrap'
                          : 'inline-block px-2 py-1 text-xs border border-red-200 bg-red-50 text-red-700 whitespace-nowrap'
                      }
                    >
                      {STOCK_BADGE_LABELS[level]}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-muted)]">
                    Disponible: {available} · Reservado: {res} · Umbral: {thr}
                  </p>
                  <VariantStockControl
                    key={`${v.id}:${qty}`}
                    variantId={v.id}
                    currentQuantity={qty}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
