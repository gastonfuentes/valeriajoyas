import { Skeleton } from '@/components/ui/skeleton'
import { ProductGridSkeleton } from '@/components/ui/product-grid-skeleton'

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-24">
      {/* Hero */}
      <section className="text-center py-16 space-y-6 flex flex-col items-center">
        <Skeleton className="h-16 w-80 max-w-full" />
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-11 w-40 mt-4" />
      </section>

      {/* Categories */}
      <section className="space-y-8">
        <Skeleton className="h-8 w-40" />
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24" />
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="space-y-8">
        <Skeleton className="h-8 w-40" />
        <ProductGridSkeleton count={8} />
      </section>
    </div>
  )
}
