import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product-card'
import { Reveal } from '@/components/reveal'
import { pickCardImages, type CardImageInput } from '@/lib/products/image-display'
import type { Database } from '@/lib/database.types'

type Product = Database['public']['Tables']['products']['Row']
type ProductWithImages = Product & { product_images: CardImageInput[] | null }

interface ProductGridProps {
  params: {
    q?: string
    cat?: string
    sort?: string
    min?: string
    max?: string
  }
  productIdFilter: string[] | null
}

/**
 * Async server component holding the (potentially slow) products query.
 * Rendered inside a <Suspense> so the catalog shell streams instantly.
 */
export async function ProductGrid({ params, productIdFilter }: ProductGridProps) {
  const supabase = await createClient()

  // Build product query with DB-side filtering using .filter() to avoid Postgrest 14.5 narrowing
  const { data: productsRaw } = await (async () => {
    let q = supabase
      .from('products')
      .select('*, product_images(storage_path, is_primary, position)')
    q = q.filter('status', 'eq', 'active') as typeof q

    if (params.q) {
      q = q.ilike('name', `%${params.q}%`) as typeof q
    }
    if (productIdFilter !== null && productIdFilter.length > 0) {
      q = q.in('id', productIdFilter) as typeof q
    }
    if (params.min) {
      const minCentavos = parseInt(params.min) * 100
      if (!isNaN(minCentavos)) q = q.gte('base_price', minCentavos) as typeof q
    }
    if (params.max) {
      const maxCentavos = parseInt(params.max) * 100
      if (!isNaN(maxCentavos)) q = q.lte('base_price', maxCentavos) as typeof q
    }

    switch (params.sort) {
      case 'price-asc':
        q = q.order('base_price', { ascending: true }) as typeof q
        break
      case 'price-desc':
        q = q.order('base_price', { ascending: false }) as typeof q
        break
      case 'newest':
        q = q.order('created_at', { ascending: false }) as typeof q
        break
      case 'name':
        q = q.order('name', { ascending: true }) as typeof q
        break
      default:
        q = q
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false }) as typeof q
    }

    return q
  })()

  const products = (productsRaw ?? []) as ProductWithImages[]

  return (
    <>
      <p className="text-sm text-[var(--color-muted)] mb-6">
        {products.length} {products.length === 1 ? 'producto' : 'productos'}
      </p>
      {products.length === 0 ? (
        <div className="py-16 text-center space-y-4">
          <p className="text-[var(--color-muted)]">No encontramos productos con esos filtros.</p>
          <Link
            href="/productos"
            className="inline-block px-5 py-2 border border-[var(--color-border)] text-sm text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)] transition-colors press focus-ring"
          >
            Ver todos los productos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product, i) => {
            const { primary, secondary } = pickCardImages(product.product_images ?? [])
            return (
              <Reveal key={product.id} index={i % 8}>
                <ProductCard
                  product={product}
                  primaryImage={primary}
                  secondaryImage={secondary}
                />
              </Reveal>
            )
          })}
        </div>
      )}
    </>
  )
}
