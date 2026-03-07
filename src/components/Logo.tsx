import Link from "next/link";

interface LogoProps {
  className?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export default function Logo({ className = "", href = "/", size, showText }: LogoProps) {
  void size;
  void showText;
  return (
    <Link href={href} className={`text-lg font-semibold tracking-tight text-foreground hover:opacity-70 transition-opacity ${className}`}>
      MakersLounge
    </Link>
  );
}

export function LogoIcon({ size = 32 }: { size?: number }) {
  return (
    <span className="font-semibold text-foreground" style={{ fontSize: size * 0.4 }}>
      ML
    </span>
  );
}
