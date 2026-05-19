import { useRouter } from "next/navigation";
import {
  Upload,
  Building,
  Send,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

export interface NextStep {
  id: string;
  label: string;
  completed: boolean;
  icon: "upload" | "building" | "send";
  href?: string;
}

const iconMap: Record<string, typeof Upload> = {
  upload: Upload,
  building: Building,
  send: Send,
};

export function NextStepsPanel({ steps }: { steps: NextStep[] }) {
  const router = useRouter();

  return (
    <div className="card-hover rounded-xl border border-gray-100 bg-white p-5 animate-scaleIn stagger-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center">
          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">Next Steps</h3>
      </div>

      <div className="space-y-1">
        {steps.map((step) => {
          const Icon = iconMap[step.icon] || Upload;
          return (
            <button
              key={step.id}
              onClick={() => {
                if (!step.completed && step.href) {
                  router.push(step.href);
                }
              }}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group text-left"
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${
                  step.completed
                    ? "text-emerald-500"
                    : "text-gray-400 group-hover:text-gray-600"
                }`}
              />
              <span
                className={`text-sm flex-1 ${
                  step.completed
                    ? "line-through text-gray-400"
                    : "text-gray-700"
                }`}
              >
                {step.label}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
