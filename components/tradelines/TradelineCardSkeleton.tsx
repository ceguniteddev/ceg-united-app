// ============================================
// TradelineCardSkeleton — Loading skeleton
// ============================================
// Shimmer loading state for tradeline cards.

export function TradelineCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 md:px-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="px-4 pb-4 space-y-2.5 md:px-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2 border-b border-gray-50"
          >
            <div className="h-3 bg-gray-100 rounded w-1/4" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between md:px-5">
        <div className="space-y-2">
          <div className="h-3 bg-gray-100 rounded w-12" />
          <div className="h-5 bg-gray-200 rounded w-20" />
        </div>
        <div className="h-10 bg-gray-200 rounded-xl w-24 md:w-32" />
      </div>
    </div>
  );
}

export function TradelineGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <TradelineCardSkeleton key={i} />
      ))}
    </div>
  );
}
