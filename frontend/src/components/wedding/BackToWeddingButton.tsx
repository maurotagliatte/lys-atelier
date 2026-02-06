import Link from 'next/link'

interface BackToWeddingButtonProps {
  slug: string
  label?: string
}

/**
 * A small back-navigation link that returns the visitor to the wedding list
 * homepage. Used on inner pages like product detail, cart, checkout.
 */
export default function BackToWeddingButton({
  slug,
  label = 'Voltar a lista',
}: BackToWeddingButtonProps) {
  return (
    <Link
      href={`/lista/${slug}`}
      className="inline-flex items-center gap-2 text-sm transition-colors hover:opacity-80"
      style={{ color: 'var(--wedding-primary)' }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 12H5" />
        <path d="m12 19-7-7 7-7" />
      </svg>
      {label}
    </Link>
  )
}
