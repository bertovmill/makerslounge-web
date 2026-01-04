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
      <img
        src="/icon-512.png"
        alt="MakersLounge"
        width={icon}
        height={icon}
        className="flex-shrink-0"
      />

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
    <img
      src="/icon-512.png"
      alt="MakersLounge"
      width={size}
      height={size}
    />
  );
}
