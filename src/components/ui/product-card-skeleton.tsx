import { Skeleton } from './skeleton'

/** Mirrors ProductCard: square image + name line + price line, at real widths. */
export function ProductCardSkeleton() {
  return (
    <div className="block">
      <Skeleton className="aspect-square" />
      <div className="mt-3 space-y-2 px-0.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3.5 w-1/3" />
      </div>
    </div>
  )
}
