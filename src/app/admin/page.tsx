import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/require-admin'

export default async function AdminPage() {
  await requireAdmin()
  redirect('/admin/pedidos')
}
