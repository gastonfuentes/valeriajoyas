import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createClient } from '@/lib/supabase/server'
import { formatARS } from '@/lib/format'

export default async function AdminCuponesPage() {
  await requireAdmin()

  const supabase = await createClient()
  const { data } = await supabase
    .from('coupons')
    .select(
      'id, code, description, type, value, min_order, max_redemptions, redeemed_count, starts_at, ends_at, is_active',
    )
    .order('created_at', { ascending: false })

  const coupons = data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <h1
          style={{ fontFamily: 'var(--font-serif)' }}
          className="text-3xl font-light tracking-wide text-[var(--color-text)]"
        >
          Cupones
        </h1>
        <Link
          href="/admin/cupones/nuevo"
          className="bg-[var(--color-primary)] text-white px-4 py-2 text-sm tracking-widest hover:bg-[var(--color-primary-hover)] transition-colors whitespace-nowrap"
        >
          Nuevo cupón
        </Link>
      </div>

      {coupons.length === 0 ? (
        <div className="py-16 text-center text-[var(--color-muted)] text-sm">
          No hay cupones creados.
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-border)] border border-[var(--color-border)]">
          {coupons.map((coupon) => {
            const discountLabel =
              coupon.type === 'percent'
                ? `${coupon.value}%`
                : formatARS(coupon.value)

            const minOrderLabel =
              coupon.min_order > 0 ? formatARS(coupon.min_order) : null

            const usageLabel =
              coupon.max_redemptions != null
                ? `${coupon.redeemed_count}/${coupon.max_redemptions}`
                : `${coupon.redeemed_count} · ilimitado`

            const dateLabel = (() => {
              const fmt = (d: string) =>
                new Date(d).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  timeZone: 'America/Argentina/Buenos_Aires',
                })
              if (coupon.starts_at && coupon.ends_at) {
                return `${fmt(coupon.starts_at)} — ${fmt(coupon.ends_at)}`
              }
              if (coupon.starts_at) return `Desde ${fmt(coupon.starts_at)}`
              if (coupon.ends_at) return `Hasta ${fmt(coupon.ends_at)}`
              return null
            })()

            return (
              <Link
                key={coupon.id}
                href={`/admin/cupones/${coupon.id}`}
                className="flex items-center justify-between px-4 py-4 hover:bg-[var(--color-background-alt,var(--color-background))] transition-colors gap-4"
              >
                <div className="min-w-0 space-y-0.5">
                  <span className="text-sm font-medium text-[var(--color-text)] block truncate">
                    {coupon.code}
                  </span>
                  {coupon.description && (
                    <span className="text-xs text-[var(--color-muted)] block truncate">
                      {coupon.description}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 shrink-0 flex-wrap justify-end">
                  <span className="text-sm text-[var(--color-text)] whitespace-nowrap">
                    {discountLabel}
                  </span>
                  {minOrderLabel && (
                    <span className="text-xs text-[var(--color-muted)] whitespace-nowrap">
                      Mín. {minOrderLabel}
                    </span>
                  )}
                  <span className="text-xs text-[var(--color-muted)] whitespace-nowrap">
                    {usageLabel} canjes
                  </span>
                  {dateLabel && (
                    <span className="text-xs text-[var(--color-muted)] whitespace-nowrap">
                      {dateLabel}
                    </span>
                  )}
                  <span
                    className={
                      coupon.is_active
                        ? 'inline-block px-2 py-1 text-xs border border-green-200 bg-green-50 text-green-700 whitespace-nowrap'
                        : 'inline-block px-2 py-1 text-xs border border-[var(--color-border)] text-[var(--color-muted)] whitespace-nowrap'
                    }
                  >
                    {coupon.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
