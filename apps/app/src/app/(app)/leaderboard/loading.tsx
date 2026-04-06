export default function LeaderboardLoading() {
  return (
    <div className="p-4 space-y-5 animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-20 bg-gray-200 rounded" />
        <div className="h-4 w-36 bg-gray-200 rounded" />
      </div>

      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
        <div className="flex-1 h-9 bg-gray-200 rounded-lg" />
        <div className="flex-1 h-9 bg-gray-200 rounded-lg" />
      </div>

      <div className="card h-16" />

      <div className="flex items-end justify-center gap-3 py-4">
        <div className="flex flex-col items-center w-24">
          <div className="w-16 h-16 rounded-full bg-gray-200" />
          <div className="h-3 w-12 bg-gray-200 rounded mt-2" />
          <div className="w-full h-16 bg-gray-100 rounded-t-lg mt-2" />
        </div>
        <div className="flex flex-col items-center w-24">
          <div className="w-20 h-20 rounded-full bg-gray-200" />
          <div className="h-3 w-12 bg-gray-200 rounded mt-2" />
          <div className="w-full h-24 bg-gray-100 rounded-t-lg mt-2" />
        </div>
        <div className="flex flex-col items-center w-24">
          <div className="w-14 h-14 rounded-full bg-gray-200" />
          <div className="h-3 w-12 bg-gray-200 rounded mt-2" />
          <div className="w-full h-10 bg-gray-100 rounded-t-lg mt-2" />
        </div>
      </div>

      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="card flex items-center gap-3">
          <div className="w-8 h-5 bg-gray-200 rounded" />
          <div className="w-9 h-9 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
          <div className="h-4 w-12 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}
