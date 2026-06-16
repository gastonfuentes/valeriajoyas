'use client'
import Link from 'next/link'
import type { ComponentProps } from 'react'
import { NavProgress } from './nav-progress'

/** next/link plus an inline pending top-bar for navigation feedback. */
export function AppLink({ children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link {...props}>
      {children}
      <NavProgress />
    </Link>
  )
}
