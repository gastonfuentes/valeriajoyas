'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { label: 'Pedidos', href: '/admin/pedidos' },
  { label: 'Productos', href: '/admin/productos' },
]
const DISABLED_LINKS = ['Cupones', 'Ajustes']

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 mt-4">
      {NAV_LINKS.map(({ label, href }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={
              active
                ? 'border-l-2 border-[var(--color-text)] pl-3 text-sm font-medium text-[var(--color-text)] py-1'
                : 'pl-4 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] py-1 transition-colors'
            }
          >
            {label}
          </Link>
        )
      })}
      {DISABLED_LINKS.map((label) => (
        <span
          key={label}
          className="pl-4 text-sm text-[var(--color-muted)] opacity-40 py-1 cursor-not-allowed"
        >
          {label}
        </span>
      ))}
    </nav>
  )
}
