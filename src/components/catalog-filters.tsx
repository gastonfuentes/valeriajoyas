'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

interface CatalogFiltersProps {
  categories: Array<{ id: string; name: string; slug: string }>
  currentParams: {
    q?: string
    cat?: string
    sort?: string
    min?: string
    max?: string
  }
}

export function CatalogFilters({ categories, currentParams }: CatalogFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [search, setSearch] = useState(currentParams.q ?? '')
  const [minPrice, setMinPrice] = useState(currentParams.min ?? '')
  const [maxPrice, setMaxPrice] = useState(currentParams.max ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function updateParam(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Reset to page 1 on filter change (no pagination yet, but future-proof)
    params.delete('page')
    router.push(`/productos?${params.toString()}`)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateParam('q', value.trim() || undefined)
    }, 300)
  }

  function handleCategoryClick(slug: string | undefined) {
    updateParam('cat', slug)
  }

  function handleSortChange(value: string) {
    updateParam('sort', value || undefined)
  }

  function handlePriceApply() {
    const params = new URLSearchParams(searchParams.toString())
    if (minPrice.trim()) {
      params.set('min', minPrice.trim())
    } else {
      params.delete('min')
    }
    if (maxPrice.trim()) {
      params.set('max', maxPrice.trim())
    } else {
      params.delete('max')
    }
    router.push(`/productos?${params.toString()}`)
  }

  // Sync search state if URL changes externally
  useEffect(() => {
    setSearch(searchParams.get('q') ?? '')
    setMinPrice(searchParams.get('min') ?? '')
    setMaxPrice(searchParams.get('max') ?? '')
  }, [searchParams])

  const currentCat = searchParams.get('cat') ?? ''
  const currentSort = searchParams.get('sort') ?? ''

  const filterContent = (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label htmlFor="catalog-search" className="block text-xs font-medium text-[var(--color-muted)] uppercase tracking-widest mb-2">
          Buscar
        </label>
        <input
          id="catalog-search"
          type="text"
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="Anillo, collar…"
          className="w-full border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
        />
      </div>

      {/* Categories */}
      <div>
        <p className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-widest mb-2">Categoría</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategoryClick(undefined)}
            className={`px-3 py-1 text-sm border transition-colors press focus-ring ${
              !currentCat
                ? 'border-[var(--color-primary)] text-[var(--color-text)]'
                : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)]'
            }`}
          >
            Todas
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.slug)}
              className={`px-3 py-1 text-sm border transition-colors press focus-ring ${
                currentCat === cat.slug
                  ? 'border-[var(--color-primary)] text-[var(--color-text)]'
                  : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <p className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-widest mb-2">Precio (ARS)</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
            placeholder="Mín"
            className="w-20 border border-[var(--color-border)] bg-transparent px-2 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          />
          <span className="text-[var(--color-muted)] text-sm">—</span>
          <input
            type="number"
            min="0"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            placeholder="Máx"
            className="w-20 border border-[var(--color-border)] bg-transparent px-2 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          />
          <button
            onClick={handlePriceApply}
            className="px-3 py-1.5 bg-[var(--color-primary)] text-white text-xs tracking-widest hover:opacity-90 transition-opacity press focus-ring"
          >
            Aplicar
          </button>
        </div>
      </div>

      {/* Sort */}
      <div>
        <label htmlFor="catalog-sort" className="block text-xs font-medium text-[var(--color-muted)] uppercase tracking-widest mb-2">
          Ordenar por
        </label>
        <select
          id="catalog-sort"
          value={currentSort}
          onChange={e => handleSortChange(e.target.value)}
          className="w-full border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
        >
          <option value="relevant">Más relevantes</option>
          <option value="price-asc">Menor precio</option>
          <option value="price-desc">Mayor precio</option>
          <option value="newest">Más nuevos</option>
          <option value="name">Nombre A-Z</option>
        </select>
      </div>
    </div>
  )

  return (
    <div>
      {/* Mobile toggle */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setMobileOpen(prev => !prev)}
          className="flex items-center gap-2 px-4 py-2 border border-[var(--color-border)] text-sm text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)] transition-colors press focus-ring"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
          </svg>
          Filtrar
        </button>
        {mobileOpen && <div className="mt-4">{filterContent}</div>}
      </div>
      {/* Desktop always visible */}
      <div className="hidden md:block">{filterContent}</div>
    </div>
  )
}
