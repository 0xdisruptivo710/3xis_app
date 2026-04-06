export default function RitualsLoading() {
  return (
    <div className="p-4 space-y-5 animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-40 bg-gray-200 rounded" />
        <div className="h-4 w-48 bg-gray-200 rounded" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 w-36 bg-gray-200 rounded" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
        <div className="h-2.5 w-full bg-gray-200 rounded-full" />
        <div className="h-3 w-40 bg-gray-200 rounded mt-2" />
      </div>

      {[1, 2, 3].map((section) => (
        <div key={section}>
          <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="card flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-gray-200" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-48 bg-gray-200 rounded" />
                </div>
                <div className="h-8 w-16 bg-gray-200 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
