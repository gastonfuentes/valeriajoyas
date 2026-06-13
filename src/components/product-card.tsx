import Link from 'next/link'
import { formatARS } from '@/lib/format'
import type { Tables } from '@/lib/database.types'

type Product = Tables<'products'>

interface ProductCardProps {
  product: Product
}

function Monogram({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className="aspect-square bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center">
      <span
        style={{ fontFamily: 'var(--font-serif)' }}
        className="text-3xl font-light tracking-widest text-[var(--color-muted)]"
      >
        {initials}
      </span>
    </div>
  )
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/productos/${product.slug}`}
      className="group block hover:opacity-90 transition-opacity"
    >
      <Monogram name={product.name} />
      <div className="mt-3 space-y-1 px-0.5">
        <p
          style={{ fontFamily: 'var(--font-serif)' }}
          className="text-base font-light tracking-wide text-[var(--color-text)] group-hover:underline underline-offset-2"
        >
          {product.name}
        </p>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--color-text)]">
            {formatARS(product.base_price)}
          </span>
          {product.compare_at_price && (
            <span className="text-[var(--color-muted)] line-through">
              {formatARS(product.compare_at_price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
