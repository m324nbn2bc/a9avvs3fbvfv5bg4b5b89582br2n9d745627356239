export default function CampaignStepIndicator({ 
  currentStep, 
  totalSteps = 3, 
  labels = null 
}) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center mb-6">
      <div className="w-full max-w-md">
        {/* Step circles and connecting lines */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              {/* Step Circle */}
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm transition-colors ${
                  step <= currentStep
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {step}
              </div>

              {/* Connecting Line (not shown after last step) */}
              {index < steps.length - 1 && (
                <div
                  className={`h-1 w-12 transition-colors ${
                    step < currentStep ? 'bg-emerald-600' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step labels (optional) */}
        {labels && labels.length === totalSteps && (
          <div className="flex justify-between mt-2 text-xs sm:text-sm text-gray-700">
            {labels.map((label, index) => (
              <span key={index} className="flex-1 text-center">
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
