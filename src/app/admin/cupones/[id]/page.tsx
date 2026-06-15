import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createClient } from '@/lib/supabase/server'
import { CouponForm } from '../coupon-form'
import { CouponActions } from './coupon-actions'
import type { CouponFormValues } from '../actions'

export default async function AdminCuponPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireAdmin()

  const supabase = await createClient()
  const { data } = await supabase
    .from('coupons')
    .select(
      'id, code, description, type, value, min_order, max_redemptions, redeemed_count, starts_at, ends_at, is_active',
    )
    .eq('id', id)
    .maybeSingle()

  if (!data) notFound()

  // Map DB row -> CouponFormValues (centavos for fixed value/minOrder stay as-is;
  // the form component converts centavos->pesos for display on edit).
  const initial: CouponFormValues & { id: string } = {
    id: data.id,
    code: data.code,
    description: data.description,
    type: data.type as 'percent' | 'fixed',
    value: data.value,
    minOrder: data.min_order,
    maxRedemptions: data.max_redemptions,
    startsAt: data.starts_at,
    endsAt: data.ends_at,
    isActive: data.is_active,
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="space-y-2">
        <h1
          style={{ fontFamily: 'var(--font-serif)' }}
          className="text-3xl font-light tracking-wide text-[var(--color-text)]"
        >
          {data.code}
        </h1>
        <p className="text-xs text-[var(--color-muted)]">
          Canjeado {data.redeemed_count}{' '}
          {data.redeemed_count === 1 ? 'vez' : 'veces'}
        </p>
      </div>

      {/* Edit form */}
      <div className="space-y-3">
        <h2 className="text-xs tracking-widest text-[var(--color-muted)] uppercase">
          Editar cupón
        </h2>
        <CouponForm initial={initial} />
      </div>

      {/* Secondary actions */}
      <div className="space-y-3">
        <h2 className="text-xs tracking-widest text-[var(--color-muted)] uppercase">
          Acciones
        </h2>
        <CouponActions id={data.id} isActive={data.is_active} />
      </div>
    </div>
  )
}
