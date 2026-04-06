export default function VideoPlayerLoading() {
  return (
    <div className="animate-pulse">
      <div className="w-full aspect-video bg-gray-200" />
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="h-6 w-3/4 bg-gray-200 rounded" />
          <div className="flex gap-2">
            <div className="h-5 w-20 bg-gray-200 rounded-full" />
            <div className="h-5 w-12 bg-gray-200 rounded" />
            <div className="h-5 w-16 bg-gray-200 rounded" />
          </div>
        </div>

        <div className="h-4 w-full bg-gray-200 rounded" />
        <div className="h-4 w-2/3 bg-gray-200 rounded" />

        <div className="h-12 w-full bg-gray-200 rounded-xl" />

        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="flex gap-2">
            <div className="h-11 flex-1 bg-gray-200 rounded-xl" />
            <div className="h-11 w-12 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
