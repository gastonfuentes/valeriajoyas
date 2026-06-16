import { Skeleton } from '@/components/ui/skeleton'
import { ProductGridSkeleton } from '@/components/ui/product-grid-skeleton'

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1
        style={{ fontFamily: 'var(--font-serif)' }}
        className="text-4xl font-light tracking-wide text-[var(--color-text)] mb-8"
      >
        Catálogo
      </h1>
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="md:w-56 shrink-0 space-y-6">
          <Skeleton className="h-10 w-full" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-14" />
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
        </aside>
        <div className="flex-1 min-w-0">
          <Skeleton className="h-4 w-24 mb-6" />
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    </div>
  )
}
