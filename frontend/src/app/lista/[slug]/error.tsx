'use client'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function WeddingListError({ error, reset }: ErrorProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <h2 className="text-xl font-semibold text-gray-800">
          Algo correu mal
        </h2>
        <p className="mt-3 text-sm text-gray-500">
          Nao foi possivel carregar esta lista de casamento. Por favor tente
          novamente.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-gray-400">
            Referencia: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="mt-6 inline-flex h-10 items-center rounded-lg px-5 text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: 'var(--wedding-primary, #c9a96e)' }}
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
