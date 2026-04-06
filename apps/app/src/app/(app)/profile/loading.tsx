export default function ProfileLoading() {
  return (
    <div className="p-4 space-y-5 animate-pulse">
      {/* Avatar */}
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-gray-200 mb-3" />
        <div className="h-6 w-32 bg-gray-200 rounded mb-1" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </div>

      {/* XP bar */}
      <div className="card">
        <div className="flex justify-between mb-2">
          <div className="h-4 w-16 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
        <div className="h-2.5 w-full bg-gray-200 rounded-full" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card text-center py-3">
            <div className="w-8 h-8 rounded-lg bg-gray-200 mx-auto mb-1.5" />
            <div className="h-4 w-8 bg-gray-200 rounded mx-auto mb-1" />
            <div className="h-3 w-12 bg-gray-200 rounded mx-auto" />
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="h-4 w-28 bg-gray-200 rounded" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="card flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-200" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
