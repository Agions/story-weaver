export interface PipelineProgressProps {
  progress: number;
  stepName?: string;
  stepNumber?: number;
  totalSteps?: number;
  subSteps?: string[];
  currentSubStep?: number;
  isIndeterminate?: boolean;
}

export function PipelineProgress({
  progress,
  stepName = '处理中',
  stepNumber,
  totalSteps,
  subSteps = [],
  currentSubStep = 0,
  isIndeterminate = false,
}: PipelineProgressProps) {
  return (
    <div className="w-full space-y-3">
      {/* Header */}
      {(stepNumber !== undefined || totalSteps !== undefined) && (
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            {stepNumber !== undefined && `步骤 ${stepNumber}`}
            {stepNumber !== undefined && totalSteps !== undefined && ' / '}
            {totalSteps !== undefined && `${totalSteps}`}
          </span>
          <span>{stepName}</span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        {isIndeterminate ? (
          <div className="absolute inset-0 bg-orange-500 animate-pulse" />
        ) : (
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        )}
      </div>

      {/* Percentage */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>{progress.toFixed(0)}%</span>
        {subSteps.length > 0 && <span>{subSteps[currentSubStep] || subSteps[0]}</span>}
      </div>

      {/* Sub-steps indicator */}
      {subSteps.length > 1 && (
        <div className="flex gap-1 justify-center mt-2">
          {subSteps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index < currentSubStep
                  ? 'bg-green-500'
                  : index === currentSubStep
                    ? 'bg-orange-500'
                    : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
