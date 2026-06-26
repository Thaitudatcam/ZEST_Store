export function SkeletonCard({ className = '' }) {
  return <div className={`animate-pulse bg-gray-100 rounded-2xl ${className}`} />
}

export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-gray-200 rounded" style={{ width: `${80 - i * 15}%` }} />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="animate-pulse space-y-3">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-10 bg-gray-100 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonPage() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 bg-gray-200 rounded-lg" />
      <div className="h-12 bg-gray-100 rounded-2xl" />
      <SkeletonTable rows={8} cols={5} />
    </div>
  )
}
