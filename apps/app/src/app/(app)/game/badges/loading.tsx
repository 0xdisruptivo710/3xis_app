export default function BadgesLoading() {
  return (
    <div className="p-4 space-y-5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gray-200" />
        <div className="space-y-2">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-40 bg-gray-200 rounded" />
        </div>
      </div>

      <div className="card">
        <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
        <div className="h-2.5 w-full bg-gray-200 rounded-full" />
      </div>

      <div className="h-4 w-20 bg-gray-200 rounded" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex flex-col items-center p-4 rounded-2xl bg-gray-50">
            <div className="w-14 h-14 rounded-2xl bg-gray-200 mb-2" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
