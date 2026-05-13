export default function LoadingSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <div
              key={j}
              className="h-10 flex-1 animate-pulse rounded-lg bg-gray-200"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
