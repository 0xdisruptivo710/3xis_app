export default function ChecklistLoading() {
  return (
    <div className="p-4 space-y-5 animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-40 bg-gray-200 rounded" />
        <div className="h-4 w-52 bg-gray-200 rounded" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="space-y-1">
            <div className="h-7 w-16 bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-200 rounded" />
          </div>
          <div className="space-y-1 text-right">
            <div className="h-6 w-12 bg-gray-200 rounded ml-auto" />
            <div className="h-3 w-16 bg-gray-200 rounded ml-auto" />
          </div>
        </div>
        <div className="h-3 w-full bg-gray-200 rounded-full" />
      </div>

      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="card flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-gray-200" />
          <div className="h-4 flex-1 bg-gray-200 rounded" />
          <div className="h-5 w-10 bg-gray-200 rounded-full" />
        </div>
      ))}
    </div>
  );
}
