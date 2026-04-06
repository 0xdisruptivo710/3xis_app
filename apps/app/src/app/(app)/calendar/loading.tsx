export default function CalendarLoading() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="h-6 w-28 bg-gray-200 rounded" />

      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl bg-gray-200" />
        <div className="h-5 w-36 bg-gray-200 rounded" />
        <div className="w-9 h-9 rounded-xl bg-gray-200" />
      </div>

      <div className="card p-3">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-3 bg-gray-200 rounded mx-auto w-6" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="h-4 w-40 bg-gray-200 rounded" />
        {[1, 2].map((i) => (
          <div key={i} className="card h-20" />
        ))}
      </div>
    </div>
  );
}
