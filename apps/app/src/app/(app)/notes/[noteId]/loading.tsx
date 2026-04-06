export default function NoteEditorLoading() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gray-200" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
        <div className="flex items-center gap-1">
          <div className="w-9 h-9 rounded-xl bg-gray-200" />
          <div className="w-9 h-9 rounded-xl bg-gray-200" />
          <div className="w-9 h-9 rounded-xl bg-gray-200" />
        </div>
      </div>

      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-24 bg-gray-200 rounded-full" />
        ))}
      </div>

      <div className="h-7 w-64 bg-gray-200 rounded" />
      <div className="space-y-2">
        <div className="h-4 w-full bg-gray-200 rounded" />
        <div className="h-4 w-full bg-gray-200 rounded" />
        <div className="h-4 w-3/4 bg-gray-200 rounded" />
        <div className="h-4 w-full bg-gray-200 rounded" />
        <div className="h-4 w-1/2 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
