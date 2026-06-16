'use client'
import { useLinkStatus } from 'next/link'
import { useEffect, useState } from 'react'

/**
 * Thin top progress bar shown while a Link navigation is pending.
 * Must be rendered INSIDE a <Link> (useLinkStatus reads that Link's state).
 * Debounced 100ms so it only appears when navigation is actually slow;
 * prefetched routes resolve instantly and never trigger it.
 */
export function NavProgress() {
  const { pending } = useLinkStatus()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!pending) {
      setVisible(false)
      return
    }
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [pending])

  if (!visible) return null
  return (
    <span
      aria-hidden="true"
      className="vj-progress-bar pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 origin-left bg-[var(--color-primary)]"
      style={{ animation: 'vj-progress 1.2s cubic-bezier(0.16,1,0.3,1) forwards' }}
    />
  )
}
