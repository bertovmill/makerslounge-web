import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Page primitives for the admin console, after Shopify Admin (Polaris): a
 * compact header (title, meta, actions on the right), white cards on the warm
 * page ground, and small status pills. Use these for new admin pages instead of
 * the old "Admin" badge + text-4xl heading.
 */

const WIDTHS = {
  default: "max-w-[1000px]",
  wide: "max-w-[1240px]",
  narrow: "max-w-[720px]",
} as const;

export function AdminPage({
  children,
  width = "default",
  className,
}: {
  children: React.ReactNode;
  width?: keyof typeof WIDTHS;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full px-4 md:px-8 pt-5 pb-16", WIDTHS[width], className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  backHref,
  backLabel = "Back",
  leading,
  badges,
  subtitle,
  actions,
}: {
  title: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  /** Avatar or icon before the title. */
  leading?: React.ReactNode;
  badges?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start gap-x-3 gap-y-3">
      {backHref && (
        <Link
          href={backHref}
          aria-label={backLabel}
          title={backLabel}
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-foreground/70 hover:bg-foreground/[0.06] hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </Link>
      )}
      {leading}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 min-h-8">
          <h1 className="text-xl font-semibold tracking-tight truncate">{title}</h1>
          {badges}
        </div>
        {subtitle && <div className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function AdminCard({
  title,
  action,
  children,
  className,
  bodyClassName,
  id,
}: {
  title?: React.ReactNode;
  /** Usually a small "Edit" link-button, shown on the right of the title. */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-xl border border-[var(--frame-edge)] bg-card text-card-foreground shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {(title || action) && (
        <div className="flex items-baseline justify-between gap-3 px-4 pt-3.5">
          {title && <h2 className="shrink-0 text-sm font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      <div className={cn("px-4 pb-4", title || action ? "pt-2.5" : "pt-4", bodyClassName)}>{children}</div>
    </section>
  );
}

/** The quiet text button Shopify puts in a card's corner ("Edit", "Manage"). */
export function CardAction({ children, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className="rounded-md px-1.5 py-0.5 text-[13px] font-medium text-primary hover:bg-primary/[0.08] transition-colors"
      {...props}
    >
      {children}
    </button>
  );
}

const TONES = {
  neutral: "bg-foreground/[0.07] text-foreground/75",
  success: "bg-emerald-500/12 text-emerald-800 dark:text-emerald-300",
  info: "bg-sky-500/12 text-sky-800 dark:text-sky-300",
  warning: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  critical: "bg-red-500/12 text-red-700 dark:text-red-300",
} as const;

export function StatusPill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: keyof typeof TONES;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-md px-1.5 py-0.5 text-xs font-medium break-words",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Initials in a soft square, for people rows and headers. */
export function Initials({ name, size = "sm" }: { name: string; size?: "sm" | "lg" }) {
  const letters =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?";
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary",
        size === "lg" ? "h-10 w-10 text-sm" : "h-7 w-7 text-[11px]",
      )}
    >
      {letters}
    </span>
  );
}
