'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { STATUS_LABELS } from '@/lib/orders/status-labels'
import type { OrderStatus } from '@/lib/orders/transitions'

const STATUSES: OrderStatus[] = [
  'pending',
  'paid',
  'fulfilled',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]

export function OrdersFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('status') ?? ''

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    router.push('/admin/pedidos' + (val ? '?status=' + val : ''))
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      className="border border-[var(--color-border)] bg-[var(--color-background)] text-sm text-[var(--color-text)] px-3 py-2 outline-none"
    >
      <option value="">Todos los estados</option>
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  )
}
