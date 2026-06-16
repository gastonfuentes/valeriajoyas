import { Suspense } from 'react'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createClient } from '@/lib/supabase/server'
import { formatARS } from '@/lib/format'
import { STATUS_LABELS } from '@/lib/orders/status-labels'
import type { OrderStatus } from '@/lib/orders/transitions'
import { OrdersFilter } from './orders-filter'

const VALID_STATUSES: OrderStatus[] = [
  'pending',
  'paid',
  'fulfilled',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  await requireAdmin()
  const { status } = await searchParams

  const supabase = await createClient()

  let query = supabase
    .from('orders')
    .select('id, order_number, created_at, email, total, status, pickup, shipping_method')
    .order('created_at', { ascending: false })
    .limit(100)

  const validStatus =
    status && VALID_STATUSES.includes(status as OrderStatus)
      ? (status as OrderStatus)
      : null

  if (validStatus) {
    query = query.eq('status', validStatus)
  }

  const { data: orders } = await query

  const list = orders ?? []

  return (
    <div className="space-y-6">
      <h1
        style={{ fontFamily: 'var(--font-serif)' }}
        className="text-3xl font-light tracking-wide text-[var(--color-text)]"
      >
        Pedidos
      </h1>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-[var(--color-muted)]">
          {list.length} {list.length === 1 ? 'pedido' : 'pedidos'}
          {validStatus ? ` · ${STATUS_LABELS[validStatus]}` : ''}
        </p>
        <Suspense fallback={null}>
          <OrdersFilter />
        </Suspense>
      </div>

      {list.length === 0 ? (
        <div className="py-16 text-center text-[var(--color-muted)] text-sm">
          No hay pedidos{validStatus ? ` con estado "${STATUS_LABELS[validStatus]}"` : ''}.
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-border)] border border-[var(--color-border)]">
          {list.map((order) => (
            <Link
              key={order.id}
              href={`/admin/pedidos/${order.id}`}
              className="flex items-center justify-between px-4 py-4 hover:bg-[var(--color-background-alt,var(--color-background))] transition-colors press focus-ring"
            >
              <div className="flex items-center gap-6 min-w-0">
                <span className="text-sm font-medium text-[var(--color-text)] whitespace-nowrap">
                  #{order.order_number}
                </span>
                <span className="text-sm text-[var(--color-muted)] whitespace-nowrap">
                  {new Date(order.created_at).toLocaleDateString('es-AR')}
                </span>
                <span className="text-sm text-[var(--color-muted)] truncate">
                  {order.email}
                </span>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-sm text-[var(--color-text)]">
                  {formatARS(order.total)}
                </span>
                <span className="inline-block px-3 py-1 text-xs border border-[var(--color-border)] text-[var(--color-muted)]">
                  {STATUS_LABELS[order.status as OrderStatus] ?? order.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
