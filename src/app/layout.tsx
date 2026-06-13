import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'
import { SiteHeader } from '@/components/site-header'
import { CartProvider } from '@/lib/cart/cart-context'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  variable: '--font-cormorant',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'valeria joyas — Joyas de plata',
  description: 'Joyas de plata 925, diseño minimalista. Buenos Aires, Argentina.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es-AR" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col">
        <CartProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-[var(--color-border)] py-8 mt-16">
            <div className="max-w-6xl mx-auto px-4 text-center text-sm text-[var(--color-muted)]">
              <p>© {new Date().getFullYear()} valeria joyas · Joyas de plata 925 · Buenos Aires</p>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  )
}
