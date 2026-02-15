interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

function LogoSVG({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Drop shadow for lift */}
        <filter id="dropShadow" x="-15%" y="-15%" width="130%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="rgba(0,0,0,0.1)" />
        </filter>

        {/* Glassy border gradients — light on top-left, dark on bottom-right */}
        <linearGradient id="glassBorderCoral" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
          <stop offset="45%" stopColor="rgba(255,255,255,0.3)" />
          <stop offset="55%" stopColor="rgba(0,0,0,0.05)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
        </linearGradient>
        <linearGradient id="glassBorderTeal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
          <stop offset="45%" stopColor="rgba(255,255,255,0.3)" />
          <stop offset="55%" stopColor="rgba(0,0,0,0.05)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
        </linearGradient>
        <linearGradient id="glassBorderPeach" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
          <stop offset="45%" stopColor="rgba(255,255,255,0.3)" />
          <stop offset="55%" stopColor="rgba(0,0,0,0.05)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
        </linearGradient>

        {/* Very subtle fill gradients */}
        <linearGradient id="coralFill" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#F28C8C" />
          <stop offset="100%" stopColor="#EE7878" />
        </linearGradient>
        <linearGradient id="tealFill" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#74CCCE" />
          <stop offset="100%" stopColor="#64C0C4" />
        </linearGradient>
        <linearGradient id="peachFill" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#F2BC84" />
          <stop offset="100%" stopColor="#EDB070" />
        </linearGradient>
      </defs>

      {/* Coral shape — bottom-left */}
      <g filter="url(#dropShadow)">
        {/* Glassy border (outer rect) */}
        <rect x="5" y="30" width="52" height="52" rx="14" fill="url(#glassBorderCoral)" />
        {/* Fill (inner rect, inset by border width) */}
        <rect x="7" y="32" width="48" height="48" rx="12" fill="url(#coralFill)" />
      </g>

      {/* Teal shape — top, slightly right */}
      <g filter="url(#dropShadow)">
        <rect x="22" y="8" width="52" height="52" rx="14" fill="url(#glassBorderTeal)" />
        <rect x="24" y="10" width="48" height="48" rx="12" fill="url(#tealFill)" />
      </g>

      {/* Peach/sandy shape — right, overlapping both */}
      <g filter="url(#dropShadow)">
        <rect x="38" y="25" width="52" height="52" rx="14" fill="url(#glassBorderPeach)" />
        <rect x="40" y="27" width="48" height="48" rx="12" fill="url(#peachFill)" />
      </g>
    </svg>
  );
}

export default function Logo({ className = "", size = "md", showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: 42, text: "text-xl" },
    md: { icon: 50, text: "text-2xl" },
    lg: { icon: 64, text: "text-3xl" },
  };

  const { icon, text } = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-shrink-0">
        <LogoSVG size={icon} />
      </div>

      {showText && (
        <span className={`font-bold ${text} font-heading tracking-tight`}>
          <span className="text-primary">Makers</span>
          <span className="text-foreground">{" "}Lounge</span>
        </span>
      )}
    </div>
  );
}

export function LogoIcon({ size = 32 }: { size?: number }) {
  return <LogoSVG size={size} />;
}
