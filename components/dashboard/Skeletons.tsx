// ============================================
// Loading Skeleton Components
// ============================================
// These render while Firebase data is loading.
// They match the exact layout of each real card.

function S({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function MetricCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 space-y-3">
      <div className="flex items-center gap-2">
        <S className="h-8 w-8 rounded-lg" />
        <S className="h-4 w-28" />
      </div>
      <S className="h-8 w-32" />
      <S className="h-3 w-24" />
    </div>
  );
}

export function CreditScoreSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 space-y-3">
      <div className="flex items-center gap-2">
        <S className="h-2 w-2 rounded-full" />
        <S className="h-4 w-20" />
      </div>
      <S className="h-10 w-16" />
      <S className="h-1.5 w-full rounded-full" />
      <S className="h-3 w-24" />
    </div>
  );
}

export function FundabilityScoreSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 flex flex-col items-center space-y-4">
      <S className="h-5 w-32" />
      <S className="h-[130px] w-[130px] rounded-full" />
      <S className="h-6 w-16 rounded-full" />
    </div>
  );
}

export function NextStepsSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 space-y-4">
      <S className="h-5 w-24" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <S className="h-4 w-4" />
          <S className="h-4 w-40" />
        </div>
      ))}
    </div>
  );
}

export function ApplicationStatusSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 flex flex-col items-center space-y-4">
      <S className="h-5 w-32" />
      <S className="h-[120px] w-[120px] rounded-full" />
      <div className="flex gap-4">
        <S className="h-3 w-16" />
        <S className="h-3 w-16" />
        <S className="h-3 w-16" />
      </div>
    </div>
  );
}

export function BusinessCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <S className="h-5 w-32" />
        <S className="h-6 w-16 rounded-full" />
      </div>
      {/* EIN */}
      <S className="h-3 w-40" />
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-start gap-2">
          <S className="h-8 w-8 rounded-lg flex-shrink-0" />
          <div className="space-y-1 flex-1">
            <S className="h-5 w-12" />
            <S className="h-3 w-20" />
          </div>
        </div>
        <div className="flex items-start gap-2">
          <S className="h-8 w-8 rounded-lg flex-shrink-0" />
          <div className="space-y-1 flex-1">
            <S className="h-3 w-16" />
            <S className="h-3 w-24" />
          </div>
        </div>
        <div className="flex items-start gap-2">
          <S className="h-8 w-8 rounded-lg flex-shrink-0" />
          <div className="space-y-1 flex-1">
            <S className="h-5 w-12" />
            <S className="h-3 w-20" />
          </div>
        </div>
        <div className="flex items-start gap-2">
          <S className="h-8 w-8 rounded-lg flex-shrink-0" />
          <div className="space-y-1 flex-1">
            <S className="h-5 w-12" />
            <S className="h-3 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SnapshotSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 space-y-3">
      <div className="flex items-center gap-2.5">
        <S className="h-7 w-7 rounded-md" />
        <S className="h-4 w-28" />
      </div>
      <S className="h-8 w-20" />
      <S className="h-3 w-36" />
    </div>
  );
}
