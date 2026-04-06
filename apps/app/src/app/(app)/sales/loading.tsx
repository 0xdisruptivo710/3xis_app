export default function SalesLoading() {
  return (
    <div className="p-4 space-y-5 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-24 bg-gray-200 rounded" />
          <div className="h-4 w-40 bg-gray-200 rounded" />
        </div>
        <div className="h-4 w-20 bg-gray-200 rounded" />
      </div>

      {/* Metric cards */}
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200" />
              <div className="space-y-1.5">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-3 w-16 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gray-200" />
              <div className="w-10 h-6 bg-gray-200 rounded" />
              <div className="w-9 h-9 rounded-lg bg-gray-200" />
            </div>
          </div>
        </div>
      ))}

      {/* Notes */}
      <div className="card">
        <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
        <div className="h-20 w-full bg-gray-200 rounded" />
      </div>

      {/* Save button */}
      <div className="h-12 w-full bg-gray-200 rounded-xl" />
    </div>
  );
}
