'use client'

import Image from 'next/image'
import Link from 'next/link'
import { use } from 'react'
import { useCart } from '@/lib/cart-context'
import { formatPrice } from '@/lib/medusa'
import BackToWeddingButton from '@/components/wedding/BackToWeddingButton'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default function CartPage({ params }: PageProps) {
  const { slug } = use(params)
  const { cart, isLoading, updateItem, removeItem } = useCart()

  const items = cart?.items ?? []
  const isEmpty = items.length === 0

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8 sm:px-6">
      <BackToWeddingButton slug={slug} />

      <h1
        className="mt-6 text-2xl font-light sm:text-3xl"
        style={{
          fontFamily: 'var(--wedding-heading-font)',
          color: 'var(--wedding-text)',
        }}
      >
        O seu carrinho
      </h1>

      {isEmpty ? (
        <div className="mt-16 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="mx-auto text-gray-300"
          >
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
          <p className="mt-4 text-muted-foreground">
            O seu carrinho esta vazio.
          </p>
          <Link
            href={`/lista/${slug}/produtos`}
            className="mt-6 inline-flex h-11 items-center rounded-lg px-6 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: 'var(--wedding-primary)' }}
          >
            Ver presentes
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          {/* Items */}
          <div className="divide-y" style={{ borderColor: 'var(--wedding-secondary)' }}>
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 py-6"
              >
                {/* Thumbnail */}
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                  {item.thumbnail ? (
                    <Image
                      src={item.thumbnail}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-300">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                      >
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex justify-between">
                    <h3
                      className="text-sm font-medium"
                      style={{ color: 'var(--wedding-text)' }}
                    >
                      {item.title}
                    </h3>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: 'var(--wedding-primary)' }}
                    >
                      {formatPrice(item.total, item.currency_code)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Quantity controls */}
                    <div
                      className="flex items-center rounded border text-sm"
                      style={{ borderColor: 'var(--wedding-secondary)' }}
                    >
                      <button
                        onClick={() => updateItem(item.id, Math.max(0, item.quantity - 1))}
                        disabled={isLoading}
                        className="px-2 py-1 transition-colors hover:opacity-70 disabled:opacity-40"
                        aria-label="Diminuir"
                      >
                        -
                      </button>
                      <span className="px-2 py-1">{item.quantity}</span>
                      <button
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        disabled={isLoading}
                        className="px-2 py-1 transition-colors hover:opacity-70 disabled:opacity-40"
                        aria-label="Aumentar"
                      >
                        +
                      </button>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={isLoading}
                      className="text-xs text-gray-400 transition-colors hover:text-red-500 disabled:opacity-40"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div
            className="mt-6 rounded-lg border p-6"
            style={{ borderColor: 'var(--wedding-secondary)' }}
          >
            <div className="space-y-2 text-sm" style={{ color: 'var(--wedding-text)' }}>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(cart?.subtotal ?? 0, cart?.currency_code)}</span>
              </div>
              {(cart?.shipping_total ?? 0) > 0 && (
                <div className="flex justify-between">
                  <span>Envio</span>
                  <span>{formatPrice(cart?.shipping_total ?? 0, cart?.currency_code)}</span>
                </div>
              )}
              {(cart?.tax_total ?? 0) > 0 && (
                <div className="flex justify-between">
                  <span>IVA</span>
                  <span>{formatPrice(cart?.tax_total ?? 0, cart?.currency_code)}</span>
                </div>
              )}
              <div
                className="flex justify-between border-t pt-2 text-base font-semibold"
                style={{ borderColor: 'var(--wedding-secondary)' }}
              >
                <span>Total</span>
                <span style={{ color: 'var(--wedding-primary)' }}>
                  {formatPrice(cart?.total ?? 0, cart?.currency_code)}
                </span>
              </div>
            </div>

            <Link
              href={`/lista/${slug}/checkout`}
              className="mt-6 flex h-12 w-full items-center justify-center rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: 'var(--wedding-primary)' }}
            >
              Continuar para checkout
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
