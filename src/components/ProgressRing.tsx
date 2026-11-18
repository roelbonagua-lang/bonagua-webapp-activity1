interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  centerLabel: string;
  centerSublabel?: string;
}

export function ProgressRing({
  value,
  max,
  size = 104,
  strokeWidth = 9,
  color = '#EA580C',
  trackColor = '#F5EFE6',
  centerLabel,
  centerSublabel,
}: ProgressRingProps) {
  const safeMax = Math.max(1, max);
  const ratio = Math.min(1, Math.max(0, value / safeMax));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - ratio);

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="progress-ring-circle"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
        <span className="font-mono text-base font-bold text-[#1C1917] leading-none">
          {centerLabel}
        </span>
        {centerSublabel && (
          <span className="text-[11px] font-medium text-[#78716C] mt-1 leading-none">
            {centerSublabel}
          </span>
        )}
      </div>
    </div>
  );
}
