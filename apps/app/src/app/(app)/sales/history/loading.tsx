export default function SalesHistoryLoading() {
  return (
    <div className="p-4 space-y-5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gray-200" />
        <div className="space-y-2">
          <div className="h-6 w-44 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
      </div>

      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-20 bg-gray-200 rounded-xl" />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card h-20" />
        ))}
      </div>

      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card h-28" />
      ))}
    </div>
  );
}
