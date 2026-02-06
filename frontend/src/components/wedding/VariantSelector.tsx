'use client'

import { useState } from 'react'
import AddToCartButton from './AddToCartButton'
import { formatPrice } from '@/lib/medusa'
import type { ProductVariant } from '@/types/wedding'

interface VariantSelectorProps {
  variants: ProductVariant[]
  slug: string
}

export default function VariantSelector({ variants }: VariantSelectorProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectedVariant = variants[selectedIndex]

  const showSelector = variants.length > 1

  // Determine if variants have different prices to show price next to each
  const prices = variants.map((v) => v.prices?.[0]?.amount)
  const hasDifferentPrices =
    prices.length > 1 && prices.some((p) => p !== prices[0])

  return (
    <>
      {showSelector && (
        <div className="mt-6">
          <label
            className="text-sm font-medium"
            style={{ color: 'var(--wedding-text)' }}
          >
            Opcao
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {variants.map((variant, index) => {
              const isSelected = index === selectedIndex
              const variantPrice = variant.prices?.[0]

              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className="rounded-lg border px-3 py-1.5 text-sm transition-colors"
                  style={{
                    borderColor: isSelected
                      ? 'var(--wedding-primary)'
                      : 'var(--wedding-secondary)',
                    backgroundColor: isSelected
                      ? 'var(--wedding-primary)'
                      : 'transparent',
                    color: isSelected ? '#fff' : 'var(--wedding-text)',
                  }}
                >
                  {variant.title}
                  {hasDifferentPrices && variantPrice && (
                    <span className="ml-1 text-xs opacity-80">
                      ({formatPrice(variantPrice.amount, variantPrice.currency_code)})
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {selectedVariant && (
        <div className="mt-8">
          <AddToCartButton variantId={selectedVariant.id} />
        </div>
      )}
    </>
  )
}
