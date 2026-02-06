'use client'

import Link from 'next/link'
import { useCart } from '@/lib/cart-context'

interface WeddingNavProps {
  slug: string
  coupleName1: string
  coupleName2: string
}

export default function WeddingNav({
  slug,
  coupleName1,
  coupleName2,
}: WeddingNavProps) {
  const { itemCount } = useCart()

  return (
    <nav
      className="sticky top-0 z-50 border-b backdrop-blur-md"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--wedding-background) 85%, transparent)',
        borderColor: 'var(--wedding-secondary)',
      }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo / couple names */}
        <Link
          href={`/lista/${slug}`}
          className="text-sm font-medium tracking-wide sm:text-base"
          style={{ color: 'var(--wedding-text)' }}
        >
          {coupleName1} & {coupleName2}
        </Link>

        {/* Navigation links */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href={`/lista/${slug}/produtos`}
            className="text-sm transition-colors hover:opacity-80"
            style={{ color: 'var(--wedding-text)' }}
          >
            Presentes
          </Link>

          <Link
            href={`/lista/${slug}/carrinho`}
            className="relative text-sm transition-colors hover:opacity-80"
            style={{ color: 'var(--wedding-text)' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>

            {itemCount > 0 && (
              <span
                className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: 'var(--wedding-primary)' }}
              >
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  )
}
