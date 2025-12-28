interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export default function Logo({ className = "", size = "md", showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: 36, text: "text-lg" },
    md: { icon: 44, text: "text-xl" },
    lg: { icon: 56, text: "text-2xl" },
  };

  const { icon, text } = sizes[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Circle */}
        <circle cx="24" cy="24" r="22" fill="white" stroke="#1a1a1a" strokeWidth="1.5" />

        <defs>
          <clipPath id="circleClip">
            <circle cx="24" cy="24" r="21" />
          </clipPath>
        </defs>

        {/* Wave - blue to orange */}
        <path
          d="M2 30 Q14 24 24 30 Q34 36 46 30 L46 46 L2 46 Z"
          fill="url(#waveGrad)"
          clipPath="url(#circleClip)"
        />

        {/* Lightbulb - simple */}
        <g transform="translate(10, 12)">
          <ellipse cx="6" cy="7" rx="5" ry="6" fill="#F97316" />
          <rect x="4" y="12" width="4" height="3" fill="#F97316" />
          <ellipse cx="6" cy="6" rx="2.5" ry="3" fill="white" />
        </g>

        {/* Rocket - simple diagonal */}
        <g transform="translate(24, 8)">
          <path d="M6 0 L12 16 L6 13 L0 16 Z" fill="#2563EB" />
          <circle cx="6" cy="6" r="2.5" fill="white" />
        </g>

        <defs>
          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
        </defs>
      </svg>

      {showText && (
        <span className={`font-bold ${text} font-heading tracking-tight`}>
          <span className="text-primary">Makers</span>
          <span className="text-foreground">Lounge</span>
        </span>
      )}
    </div>
  );
}

export function LogoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="22" fill="white" stroke="#1a1a1a" strokeWidth="1.5" />

      <defs>
        <clipPath id="iconClip">
          <circle cx="24" cy="24" r="21" />
        </clipPath>
        <linearGradient id="iconWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
      </defs>

      <path
        d="M2 30 Q14 24 24 30 Q34 36 46 30 L46 46 L2 46 Z"
        fill="url(#iconWaveGrad)"
        clipPath="url(#iconClip)"
      />

      <g transform="translate(10, 12)">
        <ellipse cx="6" cy="7" rx="5" ry="6" fill="#F97316" />
        <rect x="4" y="12" width="4" height="3" fill="#F97316" />
        <ellipse cx="6" cy="6" rx="2.5" ry="3" fill="white" />
      </g>

      <g transform="translate(24, 8)">
        <path d="M6 0 L12 16 L6 13 L0 16 Z" fill="#2563EB" />
        <circle cx="6" cy="6" r="2.5" fill="white" />
      </g>
    </svg>
  );
}
