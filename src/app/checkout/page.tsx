import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckoutProvider } from './checkout-context'
import { CheckoutFlow } from './checkout-flow'
import { getServerCart } from '@/app/cart/actions'
import type { Database } from '@/lib/database.types'

type AddressRow = Database['public']['Tables']['addresses']['Row']

export default async function CheckoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let initialEmail: string | undefined
  let initialPhone: string | undefined
  let savedAddresses: AddressRow[] = []

  if (user) {
    // Check if cart is empty for logged-in users
    const cartItems = await getServerCart()
    if (cartItems.length === 0) {
      redirect('/carrito')
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, phone')
      .filter('id', 'eq', user.id)
      .maybeSingle()

    if (profile) {
      const p = profile as Pick<Database['public']['Tables']['profiles']['Row'], 'email' | 'phone'>
      initialEmail = p.email ?? undefined
      initialPhone = p.phone ?? undefined
    }

    // Fetch addresses
    const { data: addresses } = await supabase
      .from('addresses')
      .select('*')
      .filter('user_id', 'eq', user.id)
      .order('is_default', { ascending: false })

    if (addresses) {
      savedAddresses = addresses as AddressRow[]
    }
  }

  // Fetch store settings for shipping threshold
  const { data: settingsData } = await supabase
    .from('store_settings')
    .select('free_shipping_threshold')
    .filter('id', 'eq', 1)
    .maybeSingle()

  const freeShippingThreshold = settingsData
    ? (settingsData as Pick<Database['public']['Tables']['store_settings']['Row'], 'free_shipping_threshold'>).free_shipping_threshold
    : null

  return (
    <CheckoutProvider initialEmail={initialEmail} initialPhone={initialPhone}>
      <CheckoutFlow
        initialEmail={initialEmail}
        initialPhone={initialPhone}
        savedAddresses={savedAddresses}
        freeShippingThreshold={freeShippingThreshold}
      />
    </CheckoutProvider>
  )
}
