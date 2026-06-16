'use client'
import { useCart } from '@/lib/cart/cart-context'
import { formatARS } from '@/lib/format'
import Link from 'next/link'

export default function CarritoPage() {
  const { items, subtotal, removeItem, setQty, pending } = useCart()

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <p
          style={{ fontFamily: 'var(--font-serif)' }}
          className="text-2xl font-light text-[var(--color-muted)]"
        >
          Tu carrito está vacío
        </p>
        <Link
          href="/productos"
          className="inline-block mt-4 px-6 py-2 bg-[var(--color-primary)] text-white text-sm tracking-widest hover:opacity-90 transition-opacity press focus-ring"
        >
          Ver catálogo
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <h1
        style={{ fontFamily: 'var(--font-serif)' }}
        className="text-3xl font-light tracking-wide text-[var(--color-text)]"
      >
        Carrito
      </h1>
      <div className="space-y-4">
        {items.map(item => (
          <div key={item.variantId} className="flex items-center gap-4 py-4 border-b border-[var(--color-border)]">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text)] truncate">{item.name}</p>
              <p className="text-xs text-[var(--color-muted)]">{item.variantName}</p>
              <p className="text-sm text-[var(--color-text)] mt-1">{formatARS(item.unitPrice)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setQty(item.variantId, item.quantity - 1)}
                disabled={item.quantity <= 1 || pending.has(item.variantId)}
                className="w-7 h-7 border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] hover:border-[var(--color-primary)] transition-colors press focus-ring disabled:opacity-40"
              >
                −
              </button>
              <span className="text-sm w-6 text-center">{item.quantity}</span>
              <button
                onClick={() => setQty(item.variantId, item.quantity + 1)}
                disabled={item.quantity >= item.maxQty || pending.has(item.variantId)}
                className="w-7 h-7 border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] hover:border-[var(--color-primary)] transition-colors press focus-ring disabled:opacity-40"
              >
                +
              </button>
            </div>
            <p className="text-sm font-medium text-[var(--color-text)] w-20 text-right shrink-0">
              {formatARS(item.unitPrice * item.quantity)}
            </p>
            <button
              onClick={() => removeItem(item.variantId)}
              disabled={pending.has(item.variantId)}
              className="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors press focus-ring text-xs shrink-0 disabled:opacity-40"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center pt-4 border-t border-[var(--color-border)]">
        <span style={{ fontFamily: 'var(--font-serif)' }} className="text-xl font-light text-[var(--color-text)]">
          Subtotal
        </span>
        <span className="text-xl font-medium text-[var(--color-text)]">{formatARS(subtotal)}</span>
      </div>
      <Link
        href="/checkout"
        className="block w-full text-center bg-[var(--color-primary)] text-white py-3 text-sm tracking-widest hover:opacity-90 transition-opacity press focus-ring"
      >
        Finalizar compra
      </Link>
    </div>
  )
}
