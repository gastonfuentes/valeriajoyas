'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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

  async function add(item: CartItem) {
    if (isLoggedIn) {
      await addItem(item.variantId, item.quantity)
      const serverItems = await getServerCart()
      setItems(serverItems.map(serverItemToCartItem))
    } else {
      setItems(prev => {
        const existing = prev.find(i => i.variantId === item.variantId)
        if (existing) {
          return prev.map(i =>
            i.variantId === item.variantId
              ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.maxQty) }
              : i
          )
        }
        return [...prev, item]
      })
    }
  }

  async function removeItem(variantId: string) {
    if (isLoggedIn) {
      await removeItemAction(variantId)
      const serverItems = await getServerCart()
      setItems(serverItems.map(serverItemToCartItem))
    } else {
      setItems(prev => prev.filter(i => i.variantId !== variantId))
    }
  }

  async function setQty(variantId: string, n: number) {
    if (isLoggedIn) {
      await setItemQtyAction(variantId, n)
      const serverItems = await getServerCart()
      setItems(serverItems.map(serverItemToCartItem))
    } else {
      setItems(prev =>
        prev
          .map(i => (i.variantId === variantId ? { ...i, quantity: Math.max(1, Math.min(n, i.maxQty)) } : i))
          .filter(i => i.quantity > 0)
      )
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
    <CartContext.Provider value={{ items, count, subtotal, add, removeItem, setQty, clear }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
