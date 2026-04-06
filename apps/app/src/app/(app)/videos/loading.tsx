export default function VideosLoading() {
  return (
    <div className="p-4 space-y-5 animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-28 bg-gray-200 rounded" />
        <div className="h-4 w-36 bg-gray-200 rounded" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 w-28 bg-gray-200 rounded" />
          <div className="h-4 w-8 bg-gray-200 rounded" />
        </div>
        <div className="h-2.5 w-full bg-gray-200 rounded-full" />
      </div>

      <div>
        <div className="h-4 w-40 bg-gray-200 rounded mb-3" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-44 flex-shrink-0">
              <div className="aspect-video bg-gray-200 rounded-xl mb-2" />
              <div className="h-3 w-32 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-36" />
          ))}
        </div>
      </div>
    </div>
  );
}
