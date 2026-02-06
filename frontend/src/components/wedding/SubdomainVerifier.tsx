import Link from 'next/link'

/**
 * Shown when a wedding list slug does not exist or is inactive.
 * This is a server component rendered inside the [slug] layout when
 * the API returns null for the requested slug.
 */
export default function SubdomainVerifier() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <h1 className="text-6xl font-light text-gray-300">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-gray-800">
          Lista de casamento nao encontrada
        </h2>
        <p className="mt-3 text-gray-500">
          A lista que procura nao existe ou ja nao esta disponivel. Verifique o
          endereco e tente novamente.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-lg px-6 py-3 text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: 'var(--wedding-primary, #c9a96e)' }}
        >
          Voltar ao inicio
        </Link>
      </div>
    </div>
  )
}
