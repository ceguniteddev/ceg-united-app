import { BureauScoreCard } from "@/components/credit-repair/BureauScoreCard";
import { ReportHealthCard } from "@/components/credit-repair/ReportHealthCard";
import { PositiveNegativeFactors } from "@/components/credit-repair/PositiveNegativeFactors";
import { EducationSidebar } from "@/components/credit-repair/EducationSidebar";
import { useCreditRepairState } from "@/hooks/useCreditRepairState";

export function OverviewView({
  state,
}: {
  state: ReturnType<typeof useCreditRepairState>;
}) {
  return (
    <div className="space-y-5">
      {/* Bureau scores + Report Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 h-full">
            {state.scores.map((sc: any, i: number) => (
              <div
                key={sc.bureau}
                className={`animate-fade-in-up stagger-${i + 1}`}
              >
                <BureauScoreCard score={sc} />
              </div>
            ))}
          </div>
        </div>
        <div className="animate-fade-in-up stagger-4">
          <ReportHealthCard
            health={state.health}
            onRefresh={state.refreshFromCRS}
            refreshing={state.refreshing}
          />
        </div>
      </div>

      {/* Positive / Negative factors */}
      <div className="animate-fade-in-up stagger-5">
        <PositiveNegativeFactors
          positive={state.positive}
          negative={state.negative}
        />
      </div>

      {/* CTA: jump into select-items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        <div className="lg:col-span-2 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 rounded-2xl p-6 sm:p-7 text-white shadow-card-hover relative overflow-hidden animate-fade-in-up stagger-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-20 -translate-x-10" />
          <div className="relative">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-100">
              Ready to start
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mt-1">
              Dispute {state.health.negativeItems} negative items across all
              bureaus
            </h3>
            <p className="text-sm text-brand-100 mt-1.5 max-w-xl">
              Pick what to dispute, choose your reasons, and let AI generate
              FCRA-compliant letters tailored to each agency.
            </p>
            <button
              onClick={() => state.setView("select-items")}
              className="cursor-pointer mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-gray-100 text-brand-700 text-sm font-semibold transition-colors shadow-sm"
            >
              Review & select items
            </button>
          </div>
        </div>
        <div className="animate-fade-in-up stagger-7">
          <EducationSidebar />
        </div>
      </div>
    </div>
  );
}
