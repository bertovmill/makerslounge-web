"use client";

/**
 * Liquid Glass Components - Subtle glass morphism effects
 * Optimized for MakersLounge with reduced intensity
 */

import { cva, type VariantProps } from "class-variance-authority";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ButtonProps = React.ComponentPropsWithoutRef<typeof Button>;

// Subtle glass shadow - lighter than default
const GLASS_SHADOW_LIGHT =
  "shadow-[0_0_4px_rgba(0,0,0,0.02),0_2px_4px_rgba(0,0,0,0.06),inset_2px_2px_0.5px_-2px_rgba(0,0,0,0.7),inset_-2px_-2px_0.5px_-2px_rgba(0,0,0,0.65),inset_0_0_4px_4px_rgba(0,0,0,0.08)]";

const GLASS_SHADOW_DARK =
  "dark:shadow-[0_0_6px_rgba(0,0,0,0.02),0_2px_4px_rgba(0,0,0,0.06),inset_2px_2px_0.5px_-2.5px_rgba(255,255,255,0.06),inset_-2px_-2px_0.5px_-2.5px_rgba(255,255,255,0.65),inset_0_0_4px_4px_rgba(255,255,255,0.08)]";

const GLASS_SHADOW = `${GLASS_SHADOW_LIGHT} ${GLASS_SHADOW_DARK}`;

// Very subtle filter scale for barely-there effect
const SUBTLE_GLASS_FILTER_SCALE = 15;
const BUTTON_GLASS_FILTER_SCALE = 50;

// Glass filter component
type GlassFilterProps = {
  id: string;
  scale?: number;
};

const GlassFilter = React.memo(
  ({ id, scale = SUBTLE_GLASS_FILTER_SCALE }: GlassFilterProps) => (
    <svg className="hidden">
      <title>Glass Effect Filter</title>
      <defs>
        <filter
          colorInterpolationFilters="sRGB"
          height="200%"
          id={id}
          width="200%"
          x="-50%"
          y="-50%"
        >
          <feTurbulence
            baseFrequency="0.05 0.05"
            numOctaves="1"
            result="turbulence"
            seed="1"
            type="fractalNoise"
          />
          <feGaussianBlur
            in="turbulence"
            result="blurredNoise"
            stdDeviation="2"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            result="displaced"
            scale={scale}
            xChannelSelector="R"
            yChannelSelector="B"
          />
          <feGaussianBlur in="displaced" result="finalBlur" stdDeviation="3" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  )
);
GlassFilter.displayName = "GlassFilter";

// Liquid Button - extends shadcn Button with subtle glass effect
const liquidButtonVariants = cva("relative transition-transform duration-300", {
  variants: {
    liquidVariant: {
      default: "hover:scale-105",
      none: "",
    },
  },
  defaultVariants: {
    liquidVariant: "default",
  },
});

export type LiquidButtonProps = ButtonProps & {
  liquidVariant?: "default" | "none";
};

export function LiquidButton({
  className,
  liquidVariant = "default",
  children,
  ...props
}: LiquidButtonProps) {
  const filterId = React.useId();

  return (
    <>
      <Button
        className={cn(liquidButtonVariants({ liquidVariant }), className)}
        {...props}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-0 rounded-full transition-all",
            GLASS_SHADOW
          )}
        />
        <div
          className="-z-10 pointer-events-none absolute inset-0 isolate overflow-hidden rounded-md"
          style={{ backdropFilter: `url("#${filterId}")` }}
        />
        <span className="relative z-10">{children}</span>
      </Button>
      <GlassFilter id={filterId} scale={BUTTON_GLASS_FILTER_SCALE} />
    </>
  );
}

// Liquid Glass Card - extends shadcn Card with subtle glass effect
const liquidGlassCardVariants = cva(
  "group relative overflow-hidden bg-background/20 backdrop-blur-[1px] transition-all duration-300",
  {
    variants: {
      glassSize: {
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      glassSize: "default",
    },
  }
);

export type LiquidGlassCardProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof liquidGlassCardVariants> & {
    glassEffect?: boolean;
  };

export function LiquidGlassCard({
  className,
  glassSize,
  glassEffect = true,
  children,
  ...props
}: LiquidGlassCardProps) {
  const filterId = React.useId();

  return (
    <Card
      className={cn(liquidGlassCardVariants({ glassSize }), className)}
      {...props}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-lg transition-all",
          GLASS_SHADOW
        )}
      />

      {glassEffect && (
        <>
          <div
            className="-z-10 pointer-events-none absolute inset-0 overflow-hidden rounded-lg"
            style={{ backdropFilter: `url("#${filterId}")` }}
          />
          <GlassFilter id={filterId} scale={SUBTLE_GLASS_FILTER_SCALE} />
        </>
      )}

      <div className="relative z-10">{children}</div>

      <div className="pointer-events-none absolute inset-0 z-20 rounded-lg bg-gradient-to-r from-transparent via-black/5 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:via-white/5" />
    </Card>
  );
}
