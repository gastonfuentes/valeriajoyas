'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { currentAdmin } from '@/lib/auth/require-admin'
import {
  validateStoreSettings,
  type StoreSettingsErrors,
  type StoreSettingsInput,
} from '@/lib/settings/settings-input'

/**
 * Update the store_settings singleton (id=1). Shipping fields feed the quote +
 * free-shipping logic; contact fields are shown in the public footer. Validated
 * server-side; money arrives as pesos and is normalized to centavos.
 */
export async function updateStoreSettings(
  input: StoreSettingsInput,
): Promise<{ error?: string; fieldErrors?: StoreSettingsErrors; ok?: true }> {
  const admin = await currentAdmin()
  if (!admin) return { error: 'No autorizado.' }

  const validation = validateStoreSettings(input)
  if (!validation.ok) return { fieldErrors: validation.errors }
  const v = validation.value

  const supabase = await createClient()
  // Upsert (keyed on the id=1 singleton) so a missing settings row self-heals
  // instead of failing the save. The CHECK (id = 1) keeps it a singleton; RLS
  // requires is_admin() for both insert and update.
  const { data: updated, error } = await supabase
    .from('store_settings')
    .upsert(
      {
        id: 1,
        free_shipping_threshold: v.free_shipping_threshold,
        default_item_weight_grams: v.default_item_weight_grams,
        packaging_weight_grams: v.packaging_weight_grams,
        origin_postal_code: v.origin_postal_code,
        contact_email: v.contact_email,
        contact_phone: v.contact_phone,
      },
      { onConflict: 'id' },
    )
    .select('id')
    .maybeSingle()

  if (error || !updated) return { error: 'No se pudieron guardar los ajustes.' }

  revalidatePath('/admin/ajustes')
  revalidatePath('/checkout')
  // The footer (root layout) reads contact info from settings.
  revalidatePath('/', 'layout')
  return { ok: true }
}
