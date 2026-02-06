export default function ProductsLoading() {
  return (
    <div className="mx-auto min-h-screen max-w-6xl animate-pulse px-6 py-8">
      <div className="h-4 w-24 rounded bg-gray-200" />
      <div className="mt-6 h-8 w-48 rounded bg-gray-200" />
      <div className="mt-1 h-4 w-32 rounded bg-gray-200" />

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-gray-200">
            <div className="aspect-square bg-gray-200" />
            <div className="p-4">
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="mt-2 h-5 w-1/3 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
