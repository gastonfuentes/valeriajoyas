'use client'
import Link from 'next/link'
import { useCart } from '@/lib/cart/cart-context'

export function CartBadge() {
  const { count } = useCart()

  return (
    <Link
      href="/carrito"
      aria-label={`Ver carrito${count > 0 ? ` (${count} productos)` : ''}`}
      className="relative text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-[var(--color-primary)] text-white text-[10px] font-medium flex items-center justify-center rounded-full leading-none">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
