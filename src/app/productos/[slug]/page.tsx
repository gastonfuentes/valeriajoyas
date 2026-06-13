import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { Database } from '@/lib/database.types'
import { ProductGallery } from '@/components/product-gallery'
import { VariantPurchase } from '@/components/variant-purchase'
import { formatARS } from '@/lib/format'
import Link from 'next/link'

type Product = Database['public']['Tables']['products']['Row']
type Variant = Database['public']['Tables']['product_variants']['Row']
type Inventory = Database['public']['Tables']['inventory']['Row']
type ProductImage = Database['public']['Tables']['product_images']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type ProductCategory = Database['public']['Tables']['product_categories']['Row']

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('name')
    .filter('slug', 'eq', slug)
    .filter('status', 'eq', 'active')
    .maybeSingle()
  if (!data) return { title: 'valeria joyas' }
  const product = data as Pick<Product, 'name'>
  return { title: `${product.name} · valeria joyas` }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch product
  const { data: productRaw } = await supabase
    .from('products')
    .select('*')
    .filter('slug', 'eq', slug)
    .filter('status', 'eq', 'active')
    .maybeSingle()
  if (!productRaw) notFound()
  const product = productRaw as Product

  // Parallel fetches
  const [variantsResult, imagesResult, productCatsResult] = await Promise.all([
    supabase
      .from('product_variants')
      .select('*')
      .filter('product_id', 'eq', product.id)
      .filter('is_active', 'eq', true)
      .order('position'),
    supabase
      .from('product_images')
      .select('*')
      .filter('product_id', 'eq', product.id)
      .order('position'),
    supabase
      .from('product_categories')
      .select('category_id')
      .filter('product_id', 'eq', product.id),
  ])

  const variants = (variantsResult.data ?? []) as Variant[]
  const images = (imagesResult.data ?? []) as ProductImage[]
  const categoryIds = ((productCatsResult.data ?? []) as Pick<ProductCategory, 'category_id'>[]).map(r => r.category_id)

  // Fetch inventory and categories in parallel
  const variantIds = variants.map(v => v.id)
  const [inventoryResult, categoriesResult] = await Promise.all([
    variantIds.length > 0
      ? supabase.from('inventory').select('*').in('variant_id', variantIds)
      : Promise.resolve({ data: [] as Inventory[], error: null }),
    categoryIds.length > 0
      ? supabase.from('categories').select('*').in('id', categoryIds).order('position')
      : Promise.resolve({ data: [] as Category[], error: null }),
  ])

  const inventory = (inventoryResult.data ?? []) as Inventory[]
  const categories = (categoriesResult.data ?? []) as Category[]

  // Build inventory map: variantId → available quantity
  const inventoryMap: Record<string, number> = {}
  for (const inv of inventory) {
    inventoryMap[inv.variant_id] = Math.max(0, inv.quantity - inv.reserved)
  }

  const primaryCategory = categories[0] ?? null

  const galleryImages = images.map(img => ({
    storage_path: img.storage_path,
    alt: img.alt ?? product.name,
  }))

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--color-muted)] mb-8">
        <Link href="/" className="hover:text-[var(--color-text)] transition-colors">Inicio</Link>
        <span>/</span>
        <Link href="/productos" className="hover:text-[var(--color-text)] transition-colors">Catálogo</Link>
        {primaryCategory && (
          <>
            <span>/</span>
            <Link href={`/productos?cat=${primaryCategory.slug}`} className="hover:text-[var(--color-text)] transition-colors">
              {primaryCategory.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-[var(--color-text)]">{product.name}</span>
      </nav>

      {/* Main layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
        {/* Gallery */}
        <ProductGallery images={galleryImages} productName={product.name} />

        {/* Info + purchase */}
        <div className="space-y-6">
          <h1
            style={{ fontFamily: 'var(--font-serif)' }}
            className="text-3xl md:text-4xl font-light tracking-wide text-[var(--color-text)]"
          >
            {product.name}
          </h1>

          {/* Price block */}
          <div className="flex items-baseline gap-3">
            {product.compare_at_price && (
              <span className="text-[var(--color-muted)] line-through text-lg">
                {formatARS(product.compare_at_price)}
              </span>
            )}
            <span className="text-2xl text-[var(--color-text)]">
              {formatARS(product.base_price)}
            </span>
          </div>

          {/* Material */}
          {product.material && (
            <p className="text-sm text-[var(--color-muted)] tracking-wide uppercase">{product.material}</p>
          )}

          {/* Variant purchase widget */}
          <VariantPurchase
            product={{ slug: product.slug, name: product.name, base_price: product.base_price }}
            variants={variants}
            inventoryMap={inventoryMap}
          />

          {/* Description */}
          {product.description && (
            <div className="pt-4 border-t border-[var(--color-border)]">
              <p className="text-sm text-[var(--color-muted)] leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
