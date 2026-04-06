export default function NotesLoading() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-16 bg-gray-200 rounded" />
        <div className="h-4 w-20 bg-gray-200 rounded" />
      </div>

      <div className="h-11 w-full bg-gray-200 rounded-xl" />

      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-20 bg-gray-200 rounded-full" />
        ))}
      </div>

      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="card space-y-2">
          <div className="h-4 w-48 bg-gray-200 rounded" />
          <div className="h-3 w-full bg-gray-200 rounded" />
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-gray-200 rounded-full" />
            <div className="h-5 w-12 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
