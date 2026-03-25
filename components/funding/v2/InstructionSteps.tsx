// ============================================
// InstructionSteps — Numbered step list
// ============================================
// Displays a series of numbered instructions for the application process

interface Step {
  title: string;
  description: string;
}

interface InstructionStepsProps {
  title: string;
  steps: Step[];
}

export function InstructionSteps({ title, steps }: InstructionStepsProps) {
  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-6">{title}</h3>

      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={index} className="flex gap-4">
            {/* Step number */}
            <div className="size-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base flex-shrink-0">
              {index + 1}
            </div>

            {/* Step content */}
            <div className="flex-1 pt-0.5">
              <h4 className="text-base font-bold text-gray-900 mb-1">
                {step.title}
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
