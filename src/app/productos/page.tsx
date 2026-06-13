import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product-card'
import { CatalogFilters } from '@/components/catalog-filters'
import type { Database } from '@/lib/database.types'
import Link from 'next/link'

type Product = Database['public']['Tables']['products']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type ProductCategory = Database['public']['Tables']['product_categories']['Row']

interface PageProps {
  searchParams: Promise<{
    q?: string
    cat?: string
    sort?: string
    min?: string
    max?: string
  }>
}

export default async function ProductosPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch active categories for filters
  const { data: categoriesRaw } = await supabase
    .from('categories')
    .select('*')
    .filter('is_active', 'eq', true)
    .order('position')
  const categories = (categoriesRaw ?? []) as Category[]

  // Resolve category filter to product IDs
  let productIdFilter: string[] | null = null
  if (params.cat) {
    const { data: catRaw } = await supabase
      .from('categories')
      .select('id')
      .filter('slug', 'eq', params.cat)
      .filter('is_active', 'eq', true)
      .maybeSingle()
    const cat = catRaw as { id: string } | null
    if (cat) {
      const { data: pcRaw } = await supabase
        .from('product_categories')
        .select('product_id')
        .filter('category_id', 'eq', cat.id)
      productIdFilter = ((pcRaw ?? []) as Pick<ProductCategory, 'product_id'>[]).map(r => r.product_id)
    } else {
      productIdFilter = []
    }
  }

  // Short-circuit when category results in 0 products
  if (productIdFilter !== null && productIdFilter.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 style={{ fontFamily: 'var(--font-serif)' }} className="text-4xl font-light tracking-wide text-[var(--color-text)] mb-8">
          Catálogo
        </h1>
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="md:w-56 shrink-0">
            <Suspense fallback={null}>
              <CatalogFilters
                categories={categories.map(c => ({ id: c.id, name: c.name, slug: c.slug }))}
                currentParams={params}
              />
            </Suspense>
          </aside>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[var(--color-muted)] mb-6">0 productos</p>
            <div className="py-16 text-center space-y-4">
              <p className="text-[var(--color-muted)]">No encontramos productos con esos filtros.</p>
              <Link href="/productos" className="inline-block px-5 py-2 border border-[var(--color-border)] text-sm text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)] transition-colors">
                Ver todos los productos
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Build product query with DB-side filtering using .filter() to avoid Postgrest 14.5 narrowing
  const { data: productsRaw } = await (async () => {
    let q = supabase.from('products').select('*')
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
        q = q.order('is_featured', { ascending: false }).order('created_at', { ascending: false }) as typeof q
    }

    return q
  })()

  const products = (productsRaw ?? []) as Product[]

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 style={{ fontFamily: 'var(--font-serif)' }} className="text-4xl font-light tracking-wide text-[var(--color-text)] mb-8">
        Catálogo
      </h1>
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="md:w-56 shrink-0">
          <Suspense fallback={null}>
            <CatalogFilters
              categories={categories.map(c => ({ id: c.id, name: c.name, slug: c.slug }))}
              currentParams={params}
            />
          </Suspense>
        </aside>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--color-muted)] mb-6">
            {products.length} {products.length === 1 ? 'producto' : 'productos'}
          </p>
          {products.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <p className="text-[var(--color-muted)]">No encontramos productos con esos filtros.</p>
              <Link href="/productos" className="inline-block px-5 py-2 border border-[var(--color-border)] text-sm text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)] transition-colors">
                Ver todos los productos
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
