'use client'
import { useState } from 'react'
import { buildProductImageUrl } from '@/lib/products/image-display'

interface GalleryImage {
  storage_path: string
  alt: string
}

interface ProductGalleryProps {
  images: GalleryImage[]
  productName: string
}

function Monogram({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
  return (
    <div className="aspect-square bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center">
      <span
        style={{ fontFamily: 'var(--font-serif)' }}
        className="text-5xl font-light tracking-widest text-[var(--color-muted)]"
      >
        {initials}
      </span>
    </div>
  )
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (images.length === 0) {
    return <Monogram name={productName} />
  }

  const selected = images[selectedIndex]

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="aspect-square bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={buildProductImageUrl(selected.storage_path)}
          alt={selected.alt}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={`shrink-0 w-16 h-16 border overflow-hidden transition-colors ${
                idx === selectedIndex
                  ? 'border-[var(--color-primary)]'
                  : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
              }`}
              aria-label={`Ver imagen ${idx + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={buildProductImageUrl(img.storage_path)}
                alt={img.alt}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
