import { test, expect, type Page, type ConsoleMessage } from '@playwright/test'

/**
 * Console output that is NOT a render/JS/hydration regression — the class these
 * smoke tests target. Asset 404s (favicon, a product image with a stale path)
 * are a separate data concern and are racy vs. networkidle, so they're excluded.
 * Real JS crashes still surface via `pageerror`, and hydration mismatches log a
 * distinct "A tree hydrated but..." message that is NOT filtered here.
 */
function isBenign(text: string): boolean {
  return (
    text.includes('Download the React DevTools') ||
    text.includes('[Fast Refresh]') ||
    text.includes('Failed to load resource')
  )
}

/** Collect real console errors and uncaught page errors for a page. */
function trackErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error' && !isBenign(msg.text())) {
      errors.push(`console.error: ${msg.text()}`)
    }
  })
  page.on('pageerror', (err) => {
    errors.push(`pageerror: ${err.message}`)
  })
  return errors
}

test('home renders without console errors', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/')
  await expect(page.getByRole('banner')).toBeVisible()
  await page.waitForLoadState('networkidle')
  expect(errors, errors.join('\n')).toEqual([])
})

test('catalog shows products without console errors', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/productos')
  // "se rompió" guard: the grid must actually render product cards.
  await expect(page.getByRole('heading', { name: 'Catálogo' })).toBeVisible()
  await expect(page.locator('a[href^="/productos/"]').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  expect(errors, errors.join('\n')).toEqual([])
})

test('navigating into a product detail works without errors', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/productos')
  await page.locator('a[href^="/productos/"]').first().click()
  await expect(page.getByRole('button', { name: /agregar al carrito/i })).toBeVisible()
  await page.waitForLoadState('networkidle')
  expect(errors, errors.join('\n')).toEqual([])
})

test('cart page renders without console errors', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/carrito')
  await page.waitForLoadState('networkidle')
  expect(errors, errors.join('\n')).toEqual([])
})
