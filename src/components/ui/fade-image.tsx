'use client'
import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'

/**
 * next/image that fades in once the optimized image has loaded.
 * Isolates the onLoad client boundary so server components can stay server.
 */
export function FadeImage({ className = '', ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false)
  return (
    <Image
      {...props}
      onLoad={() => setLoaded(true)}
      className={`${className} transition-opacity duration-500 ${
        loaded ? 'opacity-100' : 'opacity-0'
      }`}
    />
  )
}
