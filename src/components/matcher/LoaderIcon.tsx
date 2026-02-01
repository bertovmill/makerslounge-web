"use client";

import { cn } from "@/lib/utils";

interface LoaderIconProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function LoaderIcon({ className, size = "md" }: LoaderIconProps) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32",
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      {/* Coral/Pink square - bottom left */}
      <div
        className="absolute rounded-[20%] animate-loader-pulse"
        style={{
          width: "65%",
          height: "65%",
          backgroundColor: "#F28B82",
          bottom: "5%",
          left: "5%",
          animationDelay: "0ms",
        }}
      />
      {/* Teal square - top */}
      <div
        className="absolute rounded-[20%] animate-loader-pulse"
        style={{
          width: "55%",
          height: "55%",
          backgroundColor: "#81D4C2",
          top: "5%",
          left: "20%",
          animationDelay: "150ms",
        }}
      />
      {/* Orange/Peach square - front right */}
      <div
        className="absolute rounded-[20%] animate-loader-pulse"
        style={{
          width: "60%",
          height: "60%",
          backgroundColor: "#F5C28A",
          bottom: "15%",
          right: "5%",
          animationDelay: "300ms",
        }}
      />
      {/* Center tan square */}
      <div
        className="absolute rounded-[20%] animate-loader-pulse"
        style={{
          width: "45%",
          height: "45%",
          backgroundColor: "#D4B896",
          top: "30%",
          left: "28%",
          animationDelay: "450ms",
        }}
      />
    </div>
  );
}
