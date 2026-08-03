"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type BaseProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
  className?: string;
  icon?: boolean;
};

type ButtonAsLink = BaseProps & {
  href: string;
  onClick?: never;
  type?: never;
};

type ButtonAsButton = BaseProps & {
  href?: never;
  onClick?: () => void;
  type?: "button" | "submit";
};

type Props = ButtonAsLink | ButtonAsButton;

const base =
  "group relative inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 disabled:opacity-50";

const sizes = {
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

const variants = {
  // Dark at rest with a gold hairline, filling solid gold on hover —
  // understated rather than a loud filled-gradient pill.
  primary:
    "border border-gold/50 bg-ink-900 text-gold shadow-[inset_0_0_0_1px_rgba(198,161,89,0.12),0_18px_36px_-18px_rgba(0,0,0,0.85)] hover:border-gold hover:bg-gold hover:text-ink-950 hover:shadow-[0_18px_40px_-14px_rgba(198,161,89,0.45)]",
  secondary:
    "border border-white/15 text-fog-200 bg-white/[0.02] hover:border-graphite-bright/50 hover:text-fog-100 hover:bg-white/[0.05]",
  ghost: "text-fog-300 hover:text-gold px-0 py-0",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  icon = true,
  href,
  onClick,
  type = "button",
}: Props) {
  const classes = cn(base, variant !== "ghost" && sizes[size], variants[variant], className);

  const content = (
    <>
      <span>{children}</span>
      {icon && (
        <ArrowUpRight
          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          strokeWidth={2.25}
        />
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {content}
    </button>
  );
}
