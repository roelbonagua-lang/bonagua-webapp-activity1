interface WelHoopLogoProps {
  size?: number;
  inverted?: boolean;
}

export function WelHoopLogo({ size = 36, inverted = false }: WelHoopLogoProps) {
  return (
    <div className="inline-flex items-center gap-2.5 shrink-0">
      <div
        className="rounded-xl bg-[#EA580C] flex items-center justify-center shadow-sm shrink-0"
        style={{ width: size, height: size }}
      >
        <svg
          width={Math.round(size * 0.62)}
          height={Math.round(size * 0.62)}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          {/* Minimalist Basketball Circle */}
          <circle cx="12" cy="12" r="9.5" stroke="#FFFFFF" strokeWidth="1.75" />
          {/* Curved Leather Seams */}
          <path
            d="M5.2 6.8C8.2 9.2 8.2 14.8 5.2 17.2"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M18.8 6.8C15.8 9.2 15.8 14.8 18.8 17.2"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Vitality Pulse Seam across equator */}
          <path
            d="M3 12H7.6L9.4 9.2L11.8 14.8L13.8 10.6L15.4 12H21"
            stroke="#FFFFFF"
            strokeWidth="1.65"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span
        className={`font-display text-xl font-bold tracking-tight whitespace-nowrap ${
          inverted ? 'text-white' : 'text-[#1C1917]'
        }`}
      >
        WelHoop
      </span>
    </div>
  );
}
