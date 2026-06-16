import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product-card'
import { Reveal } from '@/components/reveal'
import { pickCardImages, type CardImageInput } from '@/lib/products/image-display'
import type { Tables } from '@/lib/database.types'

type FeaturedProduct = Tables<'products'> & { product_images: CardImageInput[] | null }

export default async function HomePage() {
  const supabase = await createClient()

  const [featuredResult, categoriesResult] = await Promise.all([
    supabase
      .from('products')
      .select('*, product_images(storage_path, is_primary, position)')
      .eq('status', 'active')
      .eq('is_featured', true)
      .limit(8),
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('position'),
  ])

  const featured = featuredResult.data as FeaturedProduct[] | null
  const categories = categoriesResult.data as Tables<'categories'>[] | null

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-24">
      {/* Hero */}
      <section className="text-center py-16 space-y-6">
        <h1
          style={{ fontFamily: 'var(--font-serif)' }}
          className="text-5xl md:text-7xl font-light tracking-[0.12em] lowercase text-[var(--color-text)]"
        >
          valeria joyas
        </h1>
        <p className="text-[var(--color-muted)] text-lg tracking-wide max-w-md mx-auto">
          Joyas de plata 925, diseño minimalista
        </p>
        <Link
          href="/productos"
          className="inline-block mt-4 px-8 py-3 bg-[var(--color-primary)] text-white text-sm tracking-widest hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Ver catálogo
        </Link>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <Reveal as="section">
          <h2
            style={{ fontFamily: 'var(--font-serif)' }}
            className="text-2xl font-light tracking-wide mb-8 text-[var(--color-text)]"
          >
            Categorías
          </h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/productos?cat=${cat.slug}`}
                className="px-5 py-2 border border-[var(--color-border)] text-sm text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)] transition-colors press focus-ring"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </Reveal>
      )}

      {/* Featured products */}
      {featured && featured.length > 0 && (
        <section>
          <h2
            style={{ fontFamily: 'var(--font-serif)' }}
            className="text-2xl font-light tracking-wide mb-8 text-[var(--color-text)]"
          >
            Destacados
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featured.map((product, i) => {
              const { primary, secondary } = pickCardImages(product.product_images ?? [])
              return (
                <Reveal key={product.id} index={i}>
                  <ProductCard
                    product={product}
                    primaryImage={primary}
                    secondaryImage={secondary}
                  />
                </Reveal>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
