export interface GradeBadgeProps {
  grade: string;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

const gradeConfig: Record<string, { color: string; label: string }> = {
  A: { color: 'bg-green-100 text-green-700 border-green-300', label: '优秀' },
  B: { color: 'bg-blue-100 text-blue-700 border-blue-300', label: '良好' },
  C: { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', label: '一般' },
  D: { color: 'bg-orange-100 text-orange-700 border-orange-300', label: '较差' },
  F: { color: 'bg-red-100 text-red-700 border-red-300', label: '不及格' },
};

const sizeConfig = {
  sm: 'text-lg px-2 py-0.5',
  md: 'text-2xl px-3 py-1',
  lg: 'text-4xl px-4 py-2',
};

export function GradeBadge({ grade, score, size = 'md' }: GradeBadgeProps) {
  const config = gradeConfig[grade.toUpperCase()] || gradeConfig['F'];
  const gradeLetter = grade.toUpperCase();

  return (
    <div className="flex flex-col items-center">
      <span
        className={`
          font-bold rounded-lg border
          ${sizeConfig[size]}
          ${config.color}
        `}
      >
        {gradeLetter}
      </span>
      {score !== undefined && <span className="text-xs text-gray-500 mt-1">{score}/100</span>}
      {size === 'lg' && <span className="text-xs text-gray-600 mt-1">{config.label}</span>}
    </div>
  );
}
