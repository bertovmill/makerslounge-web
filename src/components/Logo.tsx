interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export default function Logo({ className = "", size = "md", showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: 32, text: "text-lg" },
    md: { icon: 40, text: "text-xl" },
    lg: { icon: 52, text: "text-2xl" },
  };

  const { icon, text } = sizes[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Logo Icon - Rocket launching through wave colors */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
        </defs>

        {/* Rounded square background */}
        <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#logoGradient)" />

        {/* Rocket icon - clean and simple */}
        <g fill="white">
          {/* Rocket body */}
          <path d="M24 8c-2 4-3 8-3 12 0 4 1.5 8 3 11 1.5-3 3-7 3-11 0-4-1-8-3-12z" />
          {/* Rocket fins */}
          <path d="M18 26c-2 0-4 2-5 4 2 0 4-1 6-2l-1-2z" />
          <path d="M30 26c2 0 4 2 5 4-2 0-4-1-6-2l1-2z" />
          {/* Rocket window */}
          <circle cx="24" cy="18" r="3" fill="url(#logoGradient)" />
          {/* Flame */}
          <path d="M22 32c1 3 2 5 2 7 0-2 1-4 2-7-1 1-3 1-4 0z" opacity="0.9" />
        </g>
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

// Icon-only version for favicons
export function LogoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoIconGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="40%" stopColor="#14B8A6" />
          <stop offset="70%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
      </defs>

      <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#logoIconGradient)" />

      <g fill="white">
        <path d="M24 8c-2 4-3 8-3 12 0 4 1.5 8 3 11 1.5-3 3-7 3-11 0-4-1-8-3-12z" />
        <path d="M18 26c-2 0-4 2-5 4 2 0 4-1 6-2l-1-2z" />
        <path d="M30 26c2 0 4 2 5 4-2 0-4-1-6-2l1-2z" />
        <circle cx="24" cy="18" r="3" fill="url(#logoIconGradient)" />
        <path d="M22 32c1 3 2 5 2 7 0-2 1-4 2-7-1 1-3 1-4 0z" opacity="0.9" />
      </g>
    </svg>
  );
}
