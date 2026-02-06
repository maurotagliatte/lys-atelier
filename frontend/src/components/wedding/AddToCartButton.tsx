'use client'

import { useState } from 'react'
import { useCart } from '@/lib/cart-context'

interface AddToCartButtonProps {
  variantId: string
}

export default function AddToCartButton({ variantId }: AddToCartButtonProps) {
  const { addItem, isLoading } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  async function handleAddToCart() {
    await addItem(variantId, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="flex items-center gap-4">
      {/* Quantity selector */}
      <div
        className="flex h-11 items-center rounded-lg border"
        style={{ borderColor: 'var(--wedding-secondary)' }}
      >
        <button
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="flex h-full w-10 items-center justify-center text-lg transition-colors hover:opacity-70"
          style={{ color: 'var(--wedding-text)' }}
          disabled={quantity <= 1}
          aria-label="Diminuir quantidade"
        >
          -
        </button>
        <span
          className="flex h-full w-10 items-center justify-center text-sm font-medium"
          style={{ color: 'var(--wedding-text)' }}
        >
          {quantity}
        </span>
        <button
          onClick={() => setQuantity((q) => q + 1)}
          className="flex h-full w-10 items-center justify-center text-lg transition-colors hover:opacity-70"
          style={{ color: 'var(--wedding-text)' }}
          aria-label="Aumentar quantidade"
        >
          +
        </button>
      </div>

      {/* Add button */}
      <button
        onClick={handleAddToCart}
        disabled={isLoading}
        className="flex h-11 flex-1 items-center justify-center rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: 'var(--wedding-primary)' }}
      >
        {isLoading ? (
          <svg
            className="h-5 w-5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : added ? (
          'Adicionado!'
        ) : (
          'Oferecer presente'
        )}
      </button>
    </div>
  )
}
