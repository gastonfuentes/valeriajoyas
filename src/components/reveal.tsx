'use client'
import { useEffect, useRef } from 'react'
import type { CSSProperties, ElementType, ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  /** Stagger position; the CSS delay is index * 80ms. */
  index?: number
  /** Element tag to render (preserve semantics, e.g. "section"). */
  as?: ElementType
  className?: string
}

/**
 * Fades its content up the first time it scrolls into view.
 * The hidden state lives in CSS (`.js .reveal`) and is applied before first
 * paint via the inline script in the root layout, so there's no flicker and
 * no-JS / reduced-motion users always see the content.
 */
export function Reveal({ children, index = 0, as: Tag = 'div', className = '' }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window)
    ) {
      el.classList.add('is-visible') // reveal immediately, no animation
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add('is-visible')
            io.unobserve(el)
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag ref={ref} style={{ '--index': index } as CSSProperties} className={`reveal ${className}`}>
      {children}
    </Tag>
  )
}
