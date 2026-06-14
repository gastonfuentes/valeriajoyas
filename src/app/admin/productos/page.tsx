import { Suspense } from 'react'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createClient } from '@/lib/supabase/server'
import { formatARS } from '@/lib/format'
import { availableToSell, stockLevel } from '@/lib/inventory/stock'
import { PRODUCT_STATUSES, PRODUCT_STATUS_LABELS, type ProductStatus } from '@/lib/products/status'
import { ProductosFilter } from './productos-filter'

type RawInv = { quantity: number; reserved: number; low_stock_threshold: number }
type RawVariant = { id: string; is_active: boolean; inventory: RawInv | RawInv[] | null }
type RawProduct = {
  id: string
  name: string
  slug: string
  status: string
  base_price: number
  is_featured: boolean
  product_variants: RawVariant[] | null
}

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v
}

const STOCK_BADGE_LABELS = { out: 'Sin stock', low: 'Stock bajo' } as const

function summarizeStock(p: RawProduct): { available: number; badge: 'out' | 'low' | null } {
  const variants = p.product_variants ?? []
  let available = 0
  let anyLowOrOut = false
  for (const v of variants) {
    // Only active variants are sellable on the storefront, so the admin's
    // "en stock" total + badge reflect sellable stock, not inactive on-hand.
    if (!v.is_active) continue
    const inv = one(v.inventory)
    const qty = inv?.quantity ?? 0
    const res = inv?.reserved ?? 0
    const thr = inv?.low_stock_threshold ?? 0
    available += availableToSell(qty, res)
    if (stockLevel(qty, res, thr) !== 'ok') anyLowOrOut = true
  }
  const badge: 'out' | 'low' | null = available === 0 ? 'out' : anyLowOrOut ? 'low' : null
  return { available, badge }
}

export default async function AdminProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  await requireAdmin()
  const { status } = await searchParams

  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select(
      'id, name, slug, status, base_price, is_featured, product_variants(id, is_active, inventory(quantity, reserved, low_stock_threshold))',
    )
    .order('created_at', { ascending: false })
    .limit(200)

  const validStatus =
    status && (PRODUCT_STATUSES as readonly string[]).includes(status)
      ? (status as ProductStatus)
      : null

  if (validStatus) {
    query = query.eq('status', validStatus)
  }

  const { data } = await query
  const products = (data ?? []) as unknown as RawProduct[]

  return (
    <div className="space-y-6">
      <h1
        style={{ fontFamily: 'var(--font-serif)' }}
        className="text-3xl font-light tracking-wide text-[var(--color-text)]"
      >
        Productos
      </h1>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-[var(--color-muted)]">
          {products.length} {products.length === 1 ? 'producto' : 'productos'}
          {validStatus ? ` · ${PRODUCT_STATUS_LABELS[validStatus]}` : ''}
        </p>
        <Suspense fallback={null}>
          <ProductosFilter />
        </Suspense>
      </div>

      {products.length === 0 ? (
        <div className="py-16 text-center text-[var(--color-muted)] text-sm">
          No hay productos
          {validStatus ? ` con estado "${PRODUCT_STATUS_LABELS[validStatus]}"` : ''}.
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-border)] border border-[var(--color-border)]">
          {products.map((product) => {
            const { available, badge } = summarizeStock(product)
            return (
              <Link
                key={product.id}
                href={`/admin/productos/${product.id}`}
                className="flex items-center justify-between px-4 py-4 hover:bg-[var(--color-background-alt,var(--color-background))] transition-colors gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-medium text-[var(--color-text)] truncate">
                    {product.name}
                  </span>
                  {product.is_featured && (
                    <span className="text-xs text-[var(--color-muted)] whitespace-nowrap">Destacado</span>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-sm text-[var(--color-muted)] whitespace-nowrap">
                    {available} en stock
                  </span>
                  {badge && (
                    <span className="inline-block px-2 py-1 text-xs border border-red-200 bg-red-50 text-red-700 whitespace-nowrap">
                      {STOCK_BADGE_LABELS[badge]}
                    </span>
                  )}
                  <span className="text-sm text-[var(--color-text)] whitespace-nowrap">
                    {formatARS(product.base_price)}
                  </span>
                  <span className="inline-block px-3 py-1 text-xs border border-[var(--color-border)] text-[var(--color-muted)] whitespace-nowrap">
                    {PRODUCT_STATUS_LABELS[product.status as ProductStatus] ?? product.status}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
