export default function GameLoading() {
  return (
    <div className="p-4 space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-40 bg-gray-200 rounded" />
        </div>
        <div className="h-4 w-16 bg-gray-200 rounded" />
      </div>

      {/* Level card */}
      <div className="card-elevated h-44 bg-gray-200 rounded-2xl" />

      {/* Phases */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-200 rounded" />
              <div className="h-1.5 w-full bg-gray-200 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
