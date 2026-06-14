import { requireAdmin } from '@/lib/auth/require-admin'
import { AdminNav } from './admin-nav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex gap-0">
        {/* Sidebar */}
        <aside className="min-w-56 border-r border-[var(--color-border)] pr-8">
          <p className="text-xs tracking-widest text-[var(--color-muted)] uppercase">
            Administración
          </p>
          <AdminNav />
        </aside>

        {/* Content */}
        <main className="flex-1 px-8">{children}</main>
      </div>
    </div>
  )
}
