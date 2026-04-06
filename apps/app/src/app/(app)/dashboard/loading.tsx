export default function DashboardLoading() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gray-200" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-3 w-24 bg-gray-200 rounded" />
        </div>
      </div>

      {/* XP card skeleton */}
      <div className="card space-y-3">
        <div className="h-5 w-40 bg-gray-200 rounded" />
        <div className="h-3 w-full bg-gray-200 rounded-full" />
        <div className="flex justify-between">
          <div className="h-3 w-20 bg-gray-200 rounded" />
          <div className="h-3 w-16 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Quick access skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card h-24" />
        ))}
      </div>
    </div>
  );
}
