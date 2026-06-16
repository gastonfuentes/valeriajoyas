'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  validateImageUpload,
  extensionForType,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGES_PER_PRODUCT,
} from '@/lib/products/image-input'
import { recordProductImage, deleteProductImage, setPrimaryImage } from '../actions'
import { buildProductImageUrl } from '@/lib/products/image-display'

const PRODUCT_IMAGES_BUCKET = 'product-images'

export type ProductImage = {
  id: string
  storage_path: string
  alt: string | null
  is_primary: boolean
  position: number
}

export function ProductImagesManager({
  productId,
  images,
}: {
  productId: string
  images: ProductImage[]
}) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const atLimit = images.length >= MAX_IMAGES_PER_PRODUCT
  // Single re-entrancy gate shared by upload, delete and set-primary so no two
  // mutations can race (uploading flag for uploads, busyId for per-image actions).
  const pending = uploading || busyId !== null

  async function handleFile(file: File) {
    if (pending) return
    setError(null)

    const check = validateImageUpload({
      type: file.type,
      size: file.size,
      currentCount: images.length,
    })
    if (!check.ok) {
      setError(check.error)
      return
    }

    const ext = extensionForType(file.type)
    if (!ext) {
      setError('Formato no permitido. Usá JPEG, PNG o WebP.')
      return
    }

    setUploading(true)
    const storagePath = `${productId}/${crypto.randomUUID()}.${ext}`
    const supabase = createClient()

    const { error: uploadErr } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(storagePath, file, { contentType: file.type, upsert: false })

    if (uploadErr) {
      setUploading(false)
      setError('No se pudo subir la imagen.')
      return
    }

    const result = await recordProductImage({ productId, storagePath, alt: '' })
    setUploading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // Reset the input so selecting the same file again re-triggers change.
    e.target.value = ''
    if (file) void handleFile(file)
  }

  async function handleDelete(imageId: string) {
    if (busyId || uploading) return
    if (!window.confirm('¿Borrar esta imagen? Esta acción no se puede deshacer.')) return
    setBusyId(imageId)
    setError(null)
    const result = await deleteProductImage({ imageId })
    setBusyId(null)
    if (result.error) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  async function handleSetPrimary(imageId: string) {
    if (busyId || uploading) return
    setBusyId(imageId)
    setError(null)
    const result = await setPrimaryImage({ imageId })
    setBusyId(null)
    if (result.error) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {images.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">Este producto no tiene imágenes.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="space-y-2 border border-[var(--color-border)] p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={buildProductImageUrl(img.storage_path)}
                alt={img.alt || `Imagen ${img.position + 1}${img.is_primary ? ' (principal)' : ''}`}
                className="aspect-square w-full object-cover"
              />
              <div className="flex items-center justify-between gap-2">
                {img.is_primary ? (
                  <span className="text-xs text-[var(--color-text)]">Principal</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(img.id)}
                    disabled={pending}
                    className="text-xs text-[var(--color-muted)] underline disabled:opacity-50 press focus-ring"
                  >
                    Hacer principal
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(img.id)}
                  disabled={pending}
                  className="text-xs text-red-700 underline disabled:opacity-50 press focus-ring"
                >
                  Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          onChange={onFileChange}
          disabled={pending || atLimit}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={pending || atLimit}
          aria-busy={uploading}
          className="border border-[var(--color-text)] px-5 py-2 text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-text)] hover:text-white disabled:opacity-50 press focus-ring"
        >
          {uploading ? 'Subiendo…' : 'Subir imagen'}
        </button>
        <p className="text-xs text-[var(--color-muted)]">
          {atLimit
            ? `Llegaste al máximo de ${MAX_IMAGES_PER_PRODUCT} imágenes.`
            : `JPEG, PNG o WebP · máx 5 MB · hasta ${MAX_IMAGES_PER_PRODUCT} por producto.`}
        </p>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
