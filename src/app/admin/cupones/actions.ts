'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { currentAdmin } from '@/lib/auth/require-admin'
import { validateCouponInput, normalizeCouponCode } from '@/lib/commerce/coupon-input'

export type CouponFormValues = {
  code: string
  description: string | null
  type: 'percent' | 'fixed'
  value: number       // percent: percentage 1-100 ; fixed: CENTAVOS (already converted by the client)
  minOrder: number    // CENTAVOS
  maxRedemptions: number | null
  startsAt: string | null
  endsAt: string | null
  isActive: boolean
}

export async function createCoupon(
  input: CouponFormValues,
): Promise<{ ok?: true; id?: string; errors?: Record<string, string> }> {
  const admin = await currentAdmin()
  if (!admin) return { errors: { _: 'No autorizado.' } }

  const code = normalizeCouponCode(input.code)
  const { valid, errors } = validateCouponInput({
    code,
    type: input.type,
    value: input.value,
    minOrder: input.minOrder,
    maxRedemptions: input.maxRedemptions,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
  })
  if (!valid) return { errors }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('coupons')
    .insert({
      code,
      description: input.description,
      type: input.type,
      value: input.value,
      min_order: input.minOrder,
      max_redemptions: input.maxRedemptions,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      is_active: input.isActive,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { errors: { code: 'Ya existe un cupón con ese código.' } }
    }
    return { errors: { _: 'No se pudo crear el cupón.' } }
  }

  revalidatePath('/admin/cupones')
  return { ok: true, id: data.id }
}

export async function updateCoupon(
  id: string,
  input: CouponFormValues,
): Promise<{ ok?: true; errors?: Record<string, string> }> {
  const admin = await currentAdmin()
  if (!admin) return { errors: { _: 'No autorizado.' } }

  const code = normalizeCouponCode(input.code)
  const { valid, errors } = validateCouponInput({
    code,
    type: input.type,
    value: input.value,
    minOrder: input.minOrder,
    maxRedemptions: input.maxRedemptions,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
  })
  if (!valid) return { errors }

  const supabase = await createClient()
  const { error } = await supabase
    .from('coupons')
    .update({
      code,
      description: input.description,
      type: input.type,
      value: input.value,
      min_order: input.minOrder,
      max_redemptions: input.maxRedemptions,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      is_active: input.isActive,
    })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') {
      return { errors: { code: 'Ya existe un cupón con ese código.' } }
    }
    return { errors: { _: 'No se pudo actualizar el cupón.' } }
  }

  revalidatePath('/admin/cupones')
  revalidatePath(`/admin/cupones/${id}`)
  return { ok: true }
}

export async function setCouponActive(
  id: string,
  isActive: boolean,
): Promise<{ error?: string; ok?: true }> {
  const admin = await currentAdmin()
  if (!admin) return { error: 'No autorizado.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('coupons')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) return { error: 'No se pudo actualizar el estado del cupón.' }

  revalidatePath('/admin/cupones')
  revalidatePath(`/admin/cupones/${id}`)
  return { ok: true }
}

export async function deleteCoupon(id: string): Promise<{ error?: string; ok?: true }> {
  const admin = await currentAdmin()
  if (!admin) return { error: 'No autorizado.' }

  const supabase = await createClient()
  const { error } = await supabase.from('coupons').delete().eq('id', id)

  if (error) return { error: 'No se pudo eliminar el cupón.' }

  revalidatePath('/admin/cupones')
  return { ok: true }
}
