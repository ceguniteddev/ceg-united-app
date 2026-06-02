import { ArrowLeft, ArrowRight, Info, MapPin } from "lucide-react";
import type {
  Bureau,
  NegativeItem,
} from "@/lib/credit-repair/credit-repair-types";
import { useCreditAgenciesData } from "@/hooks/consumer-reporting-agency";

interface Props {
  items: NegativeItem[];
  selectedAgencies: string[];
  onChange: (next: string[]) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function AgencySelectionStep({
  items,
  selectedAgencies,
  onChange,
  onBack,
  onContinue,
}: Props) {
  const {
    craList: thirdPartyAgencies,
    bureausList: bureauList,
    isLoading,
  } = useCreditAgenciesData();

  const reportedBureaus = new Set<Bureau>();
  for (const item of items)
    for (const b of item.bureaus) reportedBureaus.add(b);

  const toggle = (key: string) => {
    onChange(
      selectedAgencies.includes(key)
        ? selectedAgencies.filter((k) => k !== key)
        : [...selectedAgencies, key],
    );
  };

  const bureauCount = selectedAgencies.filter((k) =>
    bureauList.some((b) => b.key === k),
  ).length;
  const craCount = selectedAgencies.length - bureauCount;

  const canContinue = selectedAgencies.length > 0;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
          Step 2 of 3
        </div>
        <h2 className="text-xl font-bold text-gray-900 mt-0.5">
          Send disputes to which agencies?
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Bureaus auto-toggle on if your selected items are reported there.
          Specialty CRAs are off by default.
        </p>
      </div>

      {/* Big 3 Bureaus */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-base font-bold text-gray-900">
              Big 3 Credit Bureaus
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {bureauCount} of 3 selected
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {bureauList.map((agency) => {
            const isOn = selectedAgencies.includes(agency.key);
            const reported = reportedBureaus.has(agency.key as Bureau);
            return (
              <button
                key={agency.key}
                onClick={() => toggle(agency.key)}
                className={`text-left rounded-xl border p-4 transition-all ${
                  isOn
                    ? "border-brand-500 bg-brand-50/50 shadow-card"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="font-semibold text-gray-900">
                    {agency.name}
                  </div>
                  <Toggle on={isOn} />
                </div>
                {reported && (
                  <div className="inline-flex items-center mt-2 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-100 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                    Items reported here
                  </div>
                )}
                <div className="mt-3 flex items-start gap-1.5 text-[11px] text-gray-500">
                  <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>
                    {agency.address.line1}, {agency.address.city},{" "}
                    {agency.address.state} {agency.address.zip}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Third-party CRAs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <div className="text-base font-bold text-gray-900">
              Specialty / Third-Party CRAs
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {craCount} of {thirdPartyAgencies.length} selected
            </div>
          </div>
          <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-brand-50 border border-brand-100 max-w-md">
            <Info className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
            <div className="text-xs text-brand-900">
              Third-party agencies feed data to the bureaus. Disputing here
              removes data at the source.
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[88px] rounded-xl border border-gray-200 bg-gray-50 animate-pulse"
              />
            ))}
          </div>
        ) : thirdPartyAgencies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {thirdPartyAgencies.map((agency) => {
              const isOn = selectedAgencies.includes(agency.key);
              return (
                <label
                  key={agency.key}
                  className={`flex items-start gap-3 px-3.5 py-3 rounded-xl border cursor-pointer transition-all ${
                    isOn
                      ? "border-brand-500 bg-brand-50/40"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isOn}
                    onChange={() => toggle(agency.key)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500/20"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 leading-tight">
                      {agency.name}
                    </div>
                    {agency.notes && (
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {agency.notes}
                      </div>
                    )}
                    <div className="text-[10px] text-gray-400 mt-1.5 font-mono">
                      {agency.address.city}, {agency.address.state}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-gray-500 text-center py-4">
            No specialty CRAs found.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 hidden sm:inline">
            {selectedAgencies.length} agencies will receive personalized letters
          </span>
          <button
            disabled={!canContinue}
            onClick={onContinue}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors shadow-sm"
          >
            Generate Letters with AI
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      className={`inline-flex w-9 h-5 rounded-full p-0.5 transition-colors ${
        on ? "bg-brand-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
          on ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </span>
  );
}
