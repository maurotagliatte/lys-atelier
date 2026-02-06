import Image from 'next/image'
import { formatDate } from '@/lib/medusa'
import type { WeddingList } from '@/types/wedding'

interface WeddingHeaderProps {
  weddingList: WeddingList
}

export default function WeddingHeader({ weddingList }: WeddingHeaderProps) {
  const {
    couple_name_1,
    couple_name_2,
    wedding_date,
    message,
    cover_image_url,
    couple_photo_url,
  } = weddingList

  return (
    <header className="relative w-full">
      {/* Cover image */}
      {cover_image_url && (
        <div className="relative h-64 w-full overflow-hidden sm:h-80 md:h-96">
          <Image
            src={cover_image_url}
            alt={`${couple_name_1} & ${couple_name_2}`}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      )}

      {/* Content overlay / standalone */}
      <div
        className={`
          relative z-10 flex flex-col items-center px-6 py-10 text-center
          ${cover_image_url ? '-mt-24 sm:-mt-32' : 'pt-16'}
        `}
      >
        {/* Couple photo */}
        {couple_photo_url && (
          <div className="mb-6 h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-lg sm:h-36 sm:w-36">
            <Image
              src={couple_photo_url}
              alt={`${couple_name_1} & ${couple_name_2}`}
              width={144}
              height={144}
              className="h-full w-full object-cover"
              priority
            />
          </div>
        )}

        {/* Couple names */}
        <h1
          className="text-3xl font-light tracking-wide sm:text-4xl md:text-5xl"
          style={{
            fontFamily: 'var(--wedding-heading-font)',
            color: cover_image_url ? '#ffffff' : 'var(--wedding-text)',
          }}
        >
          {couple_name_1}
          <span className="mx-3 text-2xl italic opacity-80 sm:text-3xl">&</span>
          {couple_name_2}
        </h1>

        {/* Date */}
        <p
          className="mt-3 text-sm tracking-widest uppercase sm:text-base"
          style={{
            color: cover_image_url
              ? 'rgba(255,255,255,0.85)'
              : 'var(--wedding-text)',
          }}
        >
          {formatDate(wedding_date)}
        </p>

        {/* Personal message */}
        {message && (
          <p
            className="mt-6 max-w-xl text-base italic leading-relaxed sm:text-lg"
            style={{
              color: cover_image_url
                ? 'rgba(255,255,255,0.9)'
                : 'var(--wedding-text)',
              fontFamily: 'var(--wedding-font)',
            }}
          >
            &ldquo;{message}&rdquo;
          </p>
        )}
      </div>
    </header>
  )
}
