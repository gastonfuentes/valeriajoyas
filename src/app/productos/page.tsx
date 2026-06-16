import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { CatalogFilters } from '@/components/catalog-filters'
import { ProductGrid } from '@/components/product-grid'
import { ProductGridSkeleton } from '@/components/ui/product-grid-skeleton'
import type { Database } from '@/lib/database.types'
import Link from 'next/link'

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

  // Fetch active categories for filters (cheap — the shell needs these immediately)
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

  const filters = (
    <Suspense fallback={null}>
      <CatalogFilters
        categories={categories.map(c => ({ id: c.id, name: c.name, slug: c.slug }))}
        currentParams={params}
      />
    </Suspense>
  )

  // Short-circuit when category results in 0 products
  if (productIdFilter !== null && productIdFilter.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 style={{ fontFamily: 'var(--font-serif)' }} className="text-4xl font-light tracking-wide text-[var(--color-text)] mb-8">
          Catálogo
        </h1>
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="md:w-56 shrink-0">{filters}</aside>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[var(--color-muted)] mb-6">0 productos</p>
            <div className="py-16 text-center space-y-4">
              <p className="text-[var(--color-muted)]">No encontramos productos con esos filtros.</p>
              <Link href="/productos" className="inline-block px-5 py-2 border border-[var(--color-border)] text-sm text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)] transition-colors press focus-ring">
                Ver todos los productos
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 style={{ fontFamily: 'var(--font-serif)' }} className="text-4xl font-light tracking-wide text-[var(--color-text)] mb-8">
        Catálogo
      </h1>
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="md:w-56 shrink-0">{filters}</aside>
        <div className="flex-1 min-w-0">
          {/* The slow products query streams in; the shell above renders instantly. */}
          <Suspense key={JSON.stringify(params)} fallback={<ProductGridSkeleton count={12} />}>
            <ProductGrid params={params} productIdFilter={productIdFilter} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
