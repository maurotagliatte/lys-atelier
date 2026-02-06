export default function ProductLoading() {
  return (
    <div className="mx-auto min-h-screen max-w-6xl animate-pulse px-6 py-8">
      <div className="h-4 w-32 rounded bg-gray-200" />
      <div className="mt-6 grid grid-cols-1 gap-12 md:grid-cols-2">
        <div className="aspect-square rounded-lg bg-gray-200" />
        <div>
          <div className="h-8 w-64 rounded bg-gray-200" />
          <div className="mt-3 h-7 w-24 rounded bg-gray-200" />
          <div className="mt-6 space-y-2">
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-5/6 rounded bg-gray-200" />
            <div className="h-4 w-4/6 rounded bg-gray-200" />
          </div>
          <div className="mt-8 h-11 w-full rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  )
}
