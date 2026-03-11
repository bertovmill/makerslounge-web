import Link from "next/link";
import Image from "next/image";

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
    <Link href={href} className={`flex items-center gap-1.5 hover:opacity-70 transition-opacity ${className}`}>
      <Image src="/logo.svg" alt="MakersLounge" width={20} height={21} className="dark:hidden" />
      <Image src="/logo-light.svg" alt="MakersLounge" width={20} height={21} className="hidden dark:block" />
      <span className="text-xl font-serif tracking-tight text-foreground">
        makerslounge
      </span>
    </Link>
  );
}

export function LogoIcon({ size = 32 }: { size?: number }) {
  return (
    <Image src="/logo.svg" alt="MakersLounge" width={size} height={size} />
  );
}
