"use client";
// ============================================
// CEG Brain Logo — snowflake/atom mark
// Reused verbatim from ceg-brain-firebase so the KPI OS
// reads as the same product, with a "KPI OS" wordmark.
// ============================================

export function CEGLogo({
  size = 'default',
  wordmark = 'KPI OS',
  onLight = true,
}: {
  size?: 'small' | 'default' | 'large'
  wordmark?: string
  onLight?: boolean
}) {
  const iconSize = size === 'small' ? 28 : size === 'large' ? 48 : 36

  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="CEG Brain logo"
        className="flex-shrink-0"
      >
        <circle cx="18" cy="18" r="18" fill="#2563eb" />
        <circle cx="18" cy="18" r="14" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
        <path
          d="M12 18C12 14.686 14.686 12 18 12C19.5 12 20.87 12.56 21.93 13.5"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="18" cy="18" r="3" fill="white" />
        <path
          d="M24 18C24 21.314 21.314 24 18 24C16.5 24 15.13 23.44 14.07 22.5"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <div className="flex flex-col leading-none">
        <span
          className={`font-bold tracking-tight ${size === 'large' ? 'text-lg' : 'text-[15px]'} ${
            onLight ? 'text-gray-900' : 'text-white'
          }`}
        >
          CEG
        </span>
        <span
          className={`font-semibold tracking-[0.18em] uppercase ${
            size === 'large' ? 'text-[10px]' : 'text-[9px]'
          } ${onLight ? 'text-gray-400' : 'text-white/60'}`}
        >
          {wordmark}
        </span>
      </div>
    </div>
  )
}
