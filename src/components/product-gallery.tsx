'use client'
import Image from 'next/image'
import { useState } from 'react'
import { FadeImage } from '@/components/ui/fade-image'
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
      <div className="relative aspect-square bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden">
        <FadeImage
          src={buildProductImageUrl(selected.storage_path)}
          alt={selected.alt}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          priority
          className="object-cover"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={`relative shrink-0 w-16 h-16 border overflow-hidden transition-colors press focus-ring ${
                idx === selectedIndex
                  ? 'border-[var(--color-primary)]'
                  : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
              }`}
              aria-label={`Ver imagen ${idx + 1}`}
            >
              <Image
                src={buildProductImageUrl(img.storage_path)}
                alt={img.alt}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
