'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { PRODUCT_STATUSES, PRODUCT_STATUS_LABELS } from '@/lib/products/status'

export function ProductosFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('status') ?? ''

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    router.push('/admin/productos' + (val ? '?status=' + val : ''))
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      className="border border-[var(--color-border)] bg-[var(--color-background)] text-sm text-[var(--color-text)] px-3 py-2 outline-none"
    >
      <option value="">Todos los estados</option>
      {PRODUCT_STATUSES.map((s) => (
        <option key={s} value={s}>
          {PRODUCT_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  )
}
