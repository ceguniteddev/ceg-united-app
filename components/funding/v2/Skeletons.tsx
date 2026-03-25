// ============================================
// Skeletons — Loading placeholders for funding components
// ============================================

export function FundingTableSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden animate-fade-in-up">
      {/* Filter skeleton */}
      <div className="px-5 pt-5 pb-3">
        <div className="skeleton h-9 w-64" />
      </div>

      {/* Table skeleton */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-3 text-left">
                <div className="skeleton h-4 w-32" />
              </th>
              <th className="px-4 py-3 text-center">
                <div className="skeleton h-4 w-24 mx-auto" />
              </th>
              <th className="px-4 py-3 text-left">
                <div className="skeleton h-4 w-28" />
              </th>
              <th className="px-4 py-3 text-center">
                <div className="skeleton h-4 w-16 mx-auto" />
              </th>
              <th className="px-4 py-3 text-center">
                <div className="skeleton h-4 w-16 mx-auto" />
              </th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, idx) => (
              <tr
                key={idx}
                className={`border-b border-gray-50 ${
                  idx === 0
                    ? "stagger-1"
                    : idx === 1
                      ? "stagger-2"
                      : idx === 2
                        ? "stagger-3"
                        : idx === 3
                          ? "stagger-4"
                          : "stagger-5"
                }`}
              >
                {/* Rank + Name */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="skeleton size-7 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-4 w-48" />
                      <div className="skeleton h-3 w-32" />
                    </div>
                  </div>
                </td>

                {/* Approval Odds */}
                <td className="px-4 py-4">
                  <div className="skeleton h-6 w-20 mx-auto rounded-full" />
                </td>

                {/* Requirements */}
                <td className="px-4 py-4">
                  <div className="skeleton h-4 w-24" />
                </td>

                {/* Status */}
                <td className="px-4 py-4">
                  <div className="skeleton h-6 w-24 mx-auto rounded-full" />
                </td>

                {/* Action */}
                <td className="px-4 py-4">
                  <div className="skeleton h-9 w-20 mx-auto rounded-lg" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FundingCardsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, idx) => (
        <div
          key={idx}
          className={`border rounded-lg p-4 bg-white shadow-sm space-y-3 ${
            idx === 0 ? "stagger-1" : idx === 1 ? "stagger-2" : "stagger-3"
          }`}
        >
          <div className="skeleton h-5 w-32" />
          <div className="skeleton h-4 w-48" />
          <div className="skeleton h-6 w-24 rounded-full" />
          <div className="skeleton h-9 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}
