import { createClient } from '@/lib/supabase/server'

/**
 * Public footer. Reads contact info from the store_settings singleton (public
 * read policy) so the admin "Ajustes" editor actually changes what the site shows.
 */
export async function SiteFooter() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('store_settings')
    .select('contact_email, contact_phone')
    .eq('id', 1)
    .maybeSingle()

  const email = data?.contact_email ?? null
  const phone = data?.contact_phone ?? null
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[var(--color-border)] py-8 mt-16">
      <div className="max-w-6xl mx-auto px-4 text-center text-sm text-[var(--color-muted)] space-y-2">
        {(email || phone) && (
          <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {email && (
              <a href={`mailto:${email}`} className="hover:text-[var(--color-text)] transition-colors">
                {email}
              </a>
            )}
            {phone && (
              <a
                href={`tel:${phone.replace(/\s+/g, '')}`}
                className="hover:text-[var(--color-text)] transition-colors"
              >
                {phone}
              </a>
            )}
          </p>
        )}
        <p>© {year} Luna Valen · Joyas de plata 925 · Buenos Aires</p>
      </div>
    </footer>
  )
}
