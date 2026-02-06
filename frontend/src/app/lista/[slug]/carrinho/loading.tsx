export default function CartLoading() {
  return (
    <div className="mx-auto min-h-screen max-w-4xl animate-pulse px-6 py-8">
      <div className="h-4 w-24 rounded bg-gray-200" />
      <div className="mt-6 h-8 w-40 rounded bg-gray-200" />
      <div className="mt-8 space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-20 w-20 rounded-md bg-gray-200" />
            <div className="flex-1">
              <div className="h-4 w-48 rounded bg-gray-200" />
              <div className="mt-2 h-4 w-20 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
