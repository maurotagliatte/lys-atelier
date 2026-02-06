import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ProductVariant } from '@/types/wedding'

// Mock AddToCartButton since it depends on CartContext
vi.mock('@/components/wedding/AddToCartButton', () => ({
  default: (props: { variantId: string }) => (
    <button data-testid="add-to-cart">{props.variantId}</button>
  ),
}))

import VariantSelector from '@/components/wedding/VariantSelector'

const makeVariant = (
  id: string,
  title: string,
  amount: number,
  currency: string = 'EUR',
): ProductVariant => ({
  id,
  title,
  prices: [{ amount, currency_code: currency, formatted: '' }],
  inventory_quantity: 10,
  options: {},
})

describe('VariantSelector', () => {
  const variants: ProductVariant[] = [
    makeVariant('v1', 'Pequeno', 5000),
    makeVariant('v2', 'Medio', 10000),
    makeVariant('v3', 'Grande', 15000),
  ]

  it('renders all variant titles when multiple variants exist', () => {
    render(<VariantSelector variants={variants} slug="test-list" />)

    expect(screen.getByText('Pequeno', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('Medio', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('Grande', { exact: false })).toBeInTheDocument()
  })

  it('selects the first variant by default (passes its id to AddToCartButton)', () => {
    render(<VariantSelector variants={variants} slug="test-list" />)

    const addToCart = screen.getByTestId('add-to-cart')
    expect(addToCart).toHaveTextContent('v1')
  })

  it('updates selection when clicking a different variant', () => {
    render(<VariantSelector variants={variants} slug="test-list" />)

    // Click on the "Grande" variant button
    const grandeButton = screen.getByText('Grande', { exact: false }).closest('button')!
    fireEvent.click(grandeButton)

    // The AddToCartButton should now receive v3
    const addToCart = screen.getByTestId('add-to-cart')
    expect(addToCart).toHaveTextContent('v3')
  })

  it('renders the AddToCartButton', () => {
    render(<VariantSelector variants={variants} slug="test-list" />)

    expect(screen.getByTestId('add-to-cart')).toBeInTheDocument()
  })

  it('does not render variant selector when there is only one variant', () => {
    const singleVariant = [makeVariant('v1', 'Unico', 5000)]
    render(<VariantSelector variants={singleVariant} slug="test-list" />)

    // The label "Opcao" should not be present
    expect(screen.queryByText('Opcao')).not.toBeInTheDocument()
    // But AddToCartButton should still render
    expect(screen.getByTestId('add-to-cart')).toBeInTheDocument()
  })
})
