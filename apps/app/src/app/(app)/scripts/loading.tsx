export default function ScriptsLoading() {
  return (
    <div className="p-4 space-y-5 animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-20 bg-gray-200 rounded" />
        <div className="h-4 w-48 bg-gray-200 rounded" />
      </div>

      <div className="card h-20" />

      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-36 bg-gray-200 rounded" />
            <div className="h-3 w-48 bg-gray-200 rounded" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
