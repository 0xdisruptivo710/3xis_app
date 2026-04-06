export default function ScriptCategoryLoading() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gray-200" />
        <div className="space-y-2">
          <div className="h-6 w-40 bg-gray-200 rounded" />
          <div className="h-4 w-56 bg-gray-200 rounded" />
        </div>
      </div>

      <div className="h-11 w-full bg-gray-200 rounded-xl" />

      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card space-y-2">
          <div className="h-4 w-48 bg-gray-200 rounded" />
          <div className="h-3 w-full bg-gray-200 rounded" />
          <div className="h-3 w-3/4 bg-gray-200 rounded" />
          <div className="h-20 w-full bg-gray-200 rounded-xl mt-2" />
        </div>
      ))}
    </div>
  );
}
