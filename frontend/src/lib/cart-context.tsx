'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Cart } from '@/types/wedding'
import {
  createCart as apiCreateCart,
  getCart as apiGetCart,
  addToCart as apiAddToCart,
  updateCartItem as apiUpdateCartItem,
  removeFromCart as apiRemoveFromCart,
} from '@/lib/medusa'

interface CartContextValue {
  cart: Cart | null
  isLoading: boolean
  itemCount: number
  addItem: (variantId: string, quantity?: number) => Promise<void>
  updateItem: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

function getStorageKey(slug: string) {
  return `lys_cart_${slug}`
}

interface CartProviderProps {
  slug: string
  children: ReactNode
}

export function CartProvider({ slug, children }: CartProviderProps) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize or retrieve cart
  useEffect(() => {
    async function initCart() {
      setIsLoading(true)
      try {
        const storedCartId = localStorage.getItem(getStorageKey(slug))
        if (storedCartId) {
          const existingCart = await apiGetCart(storedCartId)
          if (existingCart) {
            setCart(existingCart)
            setIsLoading(false)
            return
          }
          // Cart no longer valid, remove stale ID
          localStorage.removeItem(getStorageKey(slug))
        }

        // Create a new cart
        const newCart = await apiCreateCart(slug)
        if (newCart) {
          localStorage.setItem(getStorageKey(slug), newCart.id)
          setCart(newCart)
        }
      } catch (error) {
        console.error('Failed to initialize cart:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initCart()
  }, [slug])

  const refreshCart = useCallback(async () => {
    if (!cart?.id) return
    const updated = await apiGetCart(cart.id)
    if (updated) setCart(updated)
  }, [cart?.id])

  const addItem = useCallback(
    async (variantId: string, quantity: number = 1) => {
      if (!cart?.id) return
      setIsLoading(true)
      try {
        const updated = await apiAddToCart(cart.id, variantId, quantity)
        if (updated) setCart(updated)
      } finally {
        setIsLoading(false)
      }
    },
    [cart?.id],
  )

  const updateItem = useCallback(
    async (itemId: string, quantity: number) => {
      if (!cart?.id) return
      setIsLoading(true)
      try {
        const updated = await apiUpdateCartItem(cart.id, itemId, quantity)
        if (updated) setCart(updated)
      } finally {
        setIsLoading(false)
      }
    },
    [cart?.id],
  )

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!cart?.id) return
      setIsLoading(true)
      try {
        const updated = await apiRemoveFromCart(cart.id, itemId)
        if (updated) setCart(updated)
      } finally {
        setIsLoading(false)
      }
    },
    [cart?.id],
  )

  const itemCount = useMemo(
    () => cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    [cart?.items],
  )

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      isLoading,
      itemCount,
      addItem,
      updateItem,
      removeItem,
      refreshCart,
    }),
    [cart, isLoading, itemCount, addItem, updateItem, removeItem, refreshCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
