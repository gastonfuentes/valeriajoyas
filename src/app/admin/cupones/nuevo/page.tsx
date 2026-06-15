import { requireAdmin } from '@/lib/auth/require-admin'
import { CouponForm } from '../coupon-form'

export default async function NuevoCuponPage() {
  await requireAdmin()

  return (
    <div className="space-y-6 max-w-2xl">
      <h1
        style={{ fontFamily: 'var(--font-serif)' }}
        className="text-3xl font-light tracking-wide text-[var(--color-text)]"
      >
        Nuevo cupón
      </h1>

      <CouponForm />
    </div>
  )
}
