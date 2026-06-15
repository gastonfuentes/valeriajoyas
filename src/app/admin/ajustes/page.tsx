import { requireAdmin } from '@/lib/auth/require-admin'
import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from './settings-form'

type RawSettings = {
  free_shipping_threshold: number | null
  default_item_weight_grams: number
  packaging_weight_grams: number
  origin_postal_code: string | null
  contact_email: string | null
  contact_phone: string | null
}

const DEFAULTS: RawSettings = {
  free_shipping_threshold: null,
  default_item_weight_grams: 30,
  packaging_weight_grams: 100,
  origin_postal_code: null,
  contact_email: null,
  contact_phone: null,
}

export default async function AdminAjustesPage() {
  await requireAdmin()

  const supabase = await createClient()
  const { data } = await supabase
    .from('store_settings')
    .select(
      'free_shipping_threshold, default_item_weight_grams, packaging_weight_grams, origin_postal_code, contact_email, contact_phone',
    )
    .eq('id', 1)
    .maybeSingle()

  const settings = (data as RawSettings | null) ?? DEFAULTS

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="space-y-2">
        <h1
          style={{ fontFamily: 'var(--font-serif)' }}
          className="text-3xl font-light tracking-wide text-[var(--color-text)]"
        >
          Ajustes de tienda
        </h1>
        <p className="text-sm text-[var(--color-muted)]">Envío, pesos y datos de contacto.</p>
      </div>

      <SettingsForm
        initialFreeShippingCentavos={settings.free_shipping_threshold}
        initialItemWeightGrams={settings.default_item_weight_grams}
        initialPackagingWeightGrams={settings.packaging_weight_grams}
        initialOriginPostalCode={settings.origin_postal_code}
        initialContactEmail={settings.contact_email}
        initialContactPhone={settings.contact_phone}
      />
    </div>
  )
}
