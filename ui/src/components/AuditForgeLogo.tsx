export function AuditForgeLogo({
  size = 32,
  showText = true,
  className = "",
}: {
  size?: number;
  showText?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* High-Definition Vector Emblem */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
            <linearGradient id="shieldBorder" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="#4F46E5" />
            </linearGradient>
          </defs>

          {/* Shield Outer Container */}
          <path
            d="M16 2.5 L27.5 7.5 V16 C27.5 23.2 22.5 28 16 30.5 C9.5 28 4.5 23.2 4.5 16 V7.5 L16 2.5 Z"
            fill="#0F1122"
            stroke="url(#shieldBorder)"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Precision Stylized Geometric 'A' / Forge Core */}
          <path
            d="M16 7.5 L22.5 19.5 H19.2 L17.8 16.2 H14.2 L12.8 19.5 H9.5 L16 7.5 Z"
            fill="url(#logoGrad)"
          />

          {/* Core Apex Cutout */}
          <polygon points="16,11.2 14.8,14.2 17.2,14.2" fill="#FFFFFF" />

          {/* Cryptographic Trust Anchor Dot */}
          <circle cx="16" cy="24" r="1.8" fill="#10B981" />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex items-baseline gap-1">
          <span className="font-extrabold tracking-tight text-base text-white">
            Audit
          </span>
          <span className="font-extrabold tracking-tight text-base bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Forge
          </span>
        </div>
      )}
    </div>
  );
}
