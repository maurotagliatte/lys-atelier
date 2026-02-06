import Link from 'next/link'
import { getWeddingListBySlug, getWeddingListProducts } from '@/lib/medusa'
import WeddingHeader from '@/components/wedding/WeddingHeader'
import ProductCard from '@/components/wedding/ProductCard'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function WeddingListPage({ params }: PageProps) {
  const { slug } = await params
  const [weddingList, { products }] = await Promise.all([
    getWeddingListBySlug(slug),
    getWeddingListProducts(slug, { limit: 8 }),
  ])

  if (!weddingList) return null

  return (
    <main className="min-h-screen">
      {/* Hero header with couple info */}
      <WeddingHeader weddingList={weddingList} />

      {/* Featured products */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="text-center">
          <h2
            className="text-2xl font-light sm:text-3xl"
            style={{
              fontFamily: 'var(--wedding-heading-font)',
              color: 'var(--wedding-text)',
            }}
          >
            A nossa lista de presentes
          </h2>
          <p
            className="mt-2 text-sm"
            style={{ color: 'var(--wedding-text)', opacity: 0.6 }}
          >
            Escolha o presente perfeito para nos
          </p>
        </div>

        {products.length > 0 ? (
          <>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  slug={slug}
                />
              ))}
            </div>

            {products.length >= 8 && (
              <div className="mt-10 text-center">
                <Link
                  href={`/lista/${slug}/produtos`}
                  className="inline-flex h-11 items-center rounded-lg border px-6 text-sm font-medium transition-colors hover:opacity-80"
                  style={{
                    borderColor: 'var(--wedding-primary)',
                    color: 'var(--wedding-primary)',
                  }}
                >
                  Ver todos os presentes
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="mt-16 text-center">
            <p className="text-muted-foreground">
              A lista de presentes ainda esta a ser preparada. Volte em breve!
            </p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer
        className="border-t py-8 text-center text-xs"
        style={{
          borderColor: 'var(--wedding-secondary)',
          color: 'var(--wedding-text)',
          opacity: 0.5,
        }}
      >
        Lista de casamento por{' '}
        <Link
          href="/"
          className="underline hover:opacity-80"
          style={{ color: 'var(--wedding-primary)' }}
        >
          Lys Atelier
        </Link>
      </footer>
    </main>
  )
}
