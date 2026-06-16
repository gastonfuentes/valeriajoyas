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

  // store_settings is user-independent — start it now and await after the
  // user-scoped queries so it overlaps instead of running in series.
  const settingsP = supabase
    .from('store_settings')
    .select('free_shipping_threshold')
    .filter('id', 'eq', 1)
    .maybeSingle()

  let initialEmail: string | undefined
  let initialPhone: string | undefined
  let savedAddresses: AddressRow[] = []

  if (user) {
    // Cart, profile and addresses are independent — fetch them in parallel.
    const [cartItems, profileRes, addressesRes] = await Promise.all([
      getServerCart(),
      supabase
        .from('profiles')
        .select('email, phone')
        .filter('id', 'eq', user.id)
        .maybeSingle(),
      supabase
        .from('addresses')
        .select('*')
        .filter('user_id', 'eq', user.id)
        .order('is_default', { ascending: false }),
    ])

    // Check if cart is empty for logged-in users
    if (cartItems.length === 0) {
      redirect('/carrito')
    }

    if (profileRes.data) {
      const p = profileRes.data as Pick<Database['public']['Tables']['profiles']['Row'], 'email' | 'phone'>
      initialEmail = p.email ?? undefined
      initialPhone = p.phone ?? undefined
    }

    if (addressesRes.data) {
      savedAddresses = addressesRes.data as AddressRow[]
    }
  }

  // Fetch store settings for shipping threshold
  const { data: settingsData } = await settingsP

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
