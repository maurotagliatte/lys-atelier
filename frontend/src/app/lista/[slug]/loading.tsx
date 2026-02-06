export default function WeddingListLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      {/* Header skeleton */}
      <div className="h-80 w-full bg-gray-200" />
      <div className="mx-auto -mt-20 flex flex-col items-center">
        <div className="h-28 w-28 rounded-full bg-gray-300" />
        <div className="mt-4 h-8 w-64 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-40 rounded bg-gray-200" />
      </div>

      {/* Products skeleton */}
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto h-8 w-48 rounded bg-gray-200" />
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
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
    </div>
  )
}
