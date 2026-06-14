import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// For server actions: returns the user if admin, else null (no redirect).
export async function currentAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase.rpc('is_admin')
  if (error) console.error('is_admin RPC failed (currentAdmin):', error.message)
  return data === true ? user : null
}

// For RSC pages/layouts: redirects non-admins, returns the admin user.
export async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin')
  const { data, error } = await supabase.rpc('is_admin')
  if (error) console.error('is_admin RPC failed (requireAdmin):', error.message)
  if (data !== true) redirect('/')
  return user
}
