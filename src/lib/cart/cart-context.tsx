'use client'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { applyAdd, applySetQty, applyRemove } from '@/lib/cart/reducers'
import {
  getServerCart,
  addItem,
  setItemQty as setItemQtyAction,
  removeItem as removeItemAction,
  clearServerCart,
  mergeGuestCart,
  type ServerCartItem,
} from '@/app/cart/actions'

interface CartItem {
  variantId: string
  productSlug: string
  name: string
  variantName: string
  unitPrice: number
  quantity: number
  maxQty: number
  imagePath?: string
}

interface CartContextValue {
  items: CartItem[]
  count: number
  subtotal: number
  /** Variant IDs with a server mutation in flight (used to guard double-clicks). */
  pending: Set<string>
  add: (item: CartItem) => void
  removeItem: (variantId: string) => void
  setQty: (variantId: string, n: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'vj_cart'

function serverItemToCartItem(s: ServerCartItem): CartItem {
  return {
    variantId: s.variantId,
    productSlug: s.productSlug,
    name: s.name,
    variantName: s.variantName,
    unitPrice: s.unitPrice,
    quantity: s.quantity,
    maxQty: s.maxQty,
  }
}

function loadLocalStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as CartItem[]
  } catch {
    // ignore parse errors
  }
  return []
}

function clearLocalStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [pending, setPending] = useState<Set<string>>(new Set())

  // Mirror of the latest committed items, read synchronously as the rollback snapshot.
  const itemsRef = useRef<CartItem[]>([])
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    const supabase = createClient()

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setIsLoggedIn(true)
        const localItems = loadLocalStorage()
        if (localItems.length > 0) {
          await mergeGuestCart(localItems)
          clearLocalStorage()
        }
        const serverItems = await getServerCart()
        setItems(serverItems.map(serverItemToCartItem))
      } else {
        setIsLoggedIn(false)
        setItems(loadLocalStorage())
      }
      setHydrated(true)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        setIsLoggedIn(true)
        const localItems = loadLocalStorage()
        if (localItems.length > 0) {
          await mergeGuestCart(localItems)
          clearLocalStorage()
        }
        const serverItems = await getServerCart()
        setItems(serverItems.map(serverItemToCartItem))
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false)
        clearLocalStorage()
        setItems([])
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Persist to localStorage for guests only, after hydration
  useEffect(() => {
    if (!hydrated || isLoggedIn) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // ignore storage errors
    }
  }, [items, hydrated, isLoggedIn])

  // Fire the server mutation in the background, then overwrite with the
  // authoritative server cart. Roll back to the snapshot if it fails.
  async function reconcile(
    variantId: string,
    action: () => Promise<unknown>,
    snapshot: CartItem[]
  ) {
    setPending(p => new Set(p).add(variantId))
    try {
      await action()
      const serverItems = await getServerCart()
      setItems(serverItems.map(serverItemToCartItem))
    } catch (err) {
      console.error('[cart] reconcile failed, rolling back', err)
      setItems(snapshot)
    } finally {
      setPending(p => {
        const next = new Set(p)
        next.delete(variantId)
        return next
      })
    }
  }

  function add(item: CartItem) {
    setItems(prev => applyAdd(prev, item)) // instant for everyone
    if (isLoggedIn) {
      reconcile(item.variantId, () => addItem(item.variantId, item.quantity), itemsRef.current)
    }
  }

  function removeItem(variantId: string) {
    setItems(prev => applyRemove(prev, variantId))
    if (isLoggedIn) {
      reconcile(variantId, () => removeItemAction(variantId), itemsRef.current)
    }
  }

  function setQty(variantId: string, n: number) {
    setItems(prev => applySetQty(prev, variantId, n))
    if (isLoggedIn) {
      reconcile(variantId, () => setItemQtyAction(variantId, n), itemsRef.current)
    }
  }

  async function clear() {
    if (isLoggedIn) {
      await clearServerCart()
      setItems([])
    } else {
      setItems([])
    }
  }

  const count = items.reduce((acc, i) => acc + i.quantity, 0)
  const subtotal = items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, count, subtotal, pending, add, removeItem, setQty, clear }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
