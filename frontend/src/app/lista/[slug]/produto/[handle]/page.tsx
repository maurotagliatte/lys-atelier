import { notFound } from 'next/navigation'
import Image from 'next/image'
import DOMPurify from 'isomorphic-dompurify'
import { getWeddingProduct, formatPrice } from '@/lib/medusa'
import BackToWeddingButton from '@/components/wedding/BackToWeddingButton'
import VariantSelector from '@/components/wedding/VariantSelector'

interface PageProps {
  params: Promise<{ slug: string; handle: string }>
}

export default async function ProductPage({ params }: PageProps) {
  const { slug, handle } = await params
  const product = await getWeddingProduct(slug, handle)

  if (!product) {
    notFound()
  }

  const {
    title,
    description,
    images,
    thumbnail,
    variants,
    price,
    gifted_count,
    desired_quantity,
  } = product

  const isFullyGifted = gifted_count >= desired_quantity
  const progressPercent =
    desired_quantity > 0
      ? Math.min((gifted_count / desired_quantity) * 100, 100)
      : 0
  const remainingQuantity = Math.max(desired_quantity - gifted_count, 0)

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6">
      {/* Back link */}
      <BackToWeddingButton slug={slug} label="Voltar aos presentes" />

      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
        {/* Image gallery */}
        <div className="space-y-4">
          {/* Main image */}
          <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
            {(images[0]?.url || thumbnail) ? (
              <Image
                src={images[0]?.url || thumbnail!}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="64"
                  height="64"
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
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(0, 4).map((img) => (
                <div
                  key={img.id}
                  className="relative aspect-square overflow-hidden rounded-md bg-gray-100"
                >
                  <Image
                    src={img.url}
                    alt={img.alt || title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 25vw, 12vw"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product details */}
        <div>
          <h1
            className="text-2xl font-light sm:text-3xl"
            style={{
              fontFamily: 'var(--wedding-heading-font)',
              color: 'var(--wedding-text)',
            }}
          >
            {title}
          </h1>

          <p
            className="mt-3 text-2xl font-semibold"
            style={{ color: 'var(--wedding-primary)' }}
          >
            {formatPrice(price.amount, price.currency_code)}
          </p>

          {/* Description */}
          {description && (
            <div
              className="mt-6 text-sm leading-relaxed"
              style={{ color: 'var(--wedding-text)', opacity: 0.8 }}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }}
            />
          )}

          {/* Progress */}
          {desired_quantity > 0 && (
            <div className="mt-6 rounded-lg border p-4" style={{ borderColor: 'var(--wedding-secondary)' }}>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--wedding-text)' }}>
                  {gifted_count} de {desired_quantity} oferecido
                  {desired_quantity !== 1 ? 's' : ''}
                </span>
                <span
                  className="font-medium"
                  style={{ color: 'var(--wedding-primary)' }}
                >
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: 'var(--wedding-primary)',
                  }}
                />
              </div>
              {remainingQuantity > 0 && (
                <p className="mt-2 text-xs" style={{ color: 'var(--wedding-text)', opacity: 0.6 }}>
                  Falta{remainingQuantity !== 1 ? 'm' : ''} {remainingQuantity}{' '}
                  para completar
                </p>
              )}
            </div>
          )}

          {/* Variant selector + Add to cart */}
          {variants.length > 0 && !isFullyGifted && (
            <VariantSelector variants={variants} slug={slug} />
          )}

          {isFullyGifted && (
            <div
              className="mt-8 rounded-lg p-4 text-center text-sm font-medium"
              style={{
                backgroundColor: 'var(--wedding-secondary)',
                color: 'var(--wedding-text)',
              }}
            >
              Este presente ja foi totalmente oferecido. Obrigado!
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
