export default function CheckoutLoading() {
  return (
    <div className="mx-auto min-h-screen max-w-4xl animate-pulse px-6 py-8">
      <div className="h-4 w-32 rounded bg-gray-200" />
      <div className="mt-6 h-8 w-48 rounded bg-gray-200" />

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-5">
        <div className="space-y-6 md:col-span-3">
          <div className="h-64 rounded-lg bg-gray-200" />
          <div className="h-32 rounded-lg bg-gray-200" />
        </div>
        <div className="md:col-span-2">
          <div className="h-72 rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  )
}
