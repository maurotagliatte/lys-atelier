import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/medusa'
import type { WeddingProduct } from '@/types/wedding'

interface ProductCardProps {
  product: WeddingProduct
  slug: string
}

export default function ProductCard({ product, slug }: ProductCardProps) {
  const {
    handle,
    title,
    thumbnail,
    price,
    gifted_count,
    desired_quantity,
  } = product

  const isFullyGifted = gifted_count >= desired_quantity
  const progressPercent =
    desired_quantity > 0
      ? Math.min((gifted_count / desired_quantity) * 100, 100)
      : 0

  return (
    <Link
      href={`/lista/${slug}/produto/${handle}`}
      className="group block overflow-hidden rounded-lg border transition-shadow hover:shadow-md"
      style={{
        borderColor: 'var(--wedding-secondary)',
        borderRadius: 'var(--wedding-border-radius)',
      }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
        )}

        {isFullyGifted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-gray-800">
              Presente oferecido
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3
          className="truncate text-sm font-medium sm:text-base"
          style={{ color: 'var(--wedding-text)' }}
        >
          {title}
        </h3>

        <p
          className="mt-1 text-lg font-semibold"
          style={{ color: 'var(--wedding-primary)' }}
        >
          {formatPrice(price.amount, price.currency_code)}
        </p>

        {/* Progress bar */}
        {desired_quantity > 1 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                {gifted_count} de {desired_quantity} oferecidos
              </span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: 'var(--wedding-primary)',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
