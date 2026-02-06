import { getWeddingListProducts } from '@/lib/medusa'
import ProductCard from '@/components/wedding/ProductCard'
import BackToWeddingButton from '@/components/wedding/BackToWeddingButton'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string; category?: string; sort?: string }>
}

const PRODUCTS_PER_PAGE = 12

export default async function ProductsPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params
  const { page, category, sort } = await searchParams
  const currentPage = Number(page) || 1
  const offset = (currentPage - 1) * PRODUCTS_PER_PAGE

  const { products, count } = await getWeddingListProducts(slug, {
    limit: PRODUCTS_PER_PAGE,
    offset,
    category: category || undefined,
    sort: sort || undefined,
  })

  const totalPages = Math.ceil(count / PRODUCTS_PER_PAGE)

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6">
      {/* Back link */}
      <BackToWeddingButton slug={slug} />

      {/* Title */}
      <div className="mt-6">
        <h1
          className="text-2xl font-light sm:text-3xl"
          style={{
            fontFamily: 'var(--wedding-heading-font)',
            color: 'var(--wedding-text)',
          }}
        >
          Todos os presentes
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--wedding-text)', opacity: 0.6 }}>
          {count} {count === 1 ? 'presente' : 'presentes'} disponivel
          {count !== 1 ? 'is' : ''}
        </p>
      </div>

      {/* Product grid */}
      {products.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} slug={slug} />
          ))}
        </div>
      ) : (
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Nenhum presente disponivel neste momento.
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-12 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const isActive = p === currentPage
            const queryParams = new URLSearchParams()
            queryParams.set('page', String(p))
            if (category) queryParams.set('category', category)
            if (sort) queryParams.set('sort', sort)

            return (
              <a
                key={p}
                href={`/lista/${slug}/produtos?${queryParams.toString()}`}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'text-white' : 'border hover:opacity-80'
                }`}
                style={
                  isActive
                    ? { backgroundColor: 'var(--wedding-primary)' }
                    : {
                        borderColor: 'var(--wedding-secondary)',
                        color: 'var(--wedding-text)',
                      }
                }
              >
                {p}
              </a>
            )
          })}
        </nav>
      )}
    </main>
  )
}
