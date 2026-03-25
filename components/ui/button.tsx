"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variantClassNames: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "border-transparent bg-[color:var(--accent)] text-[color:var(--accent-foreground)] hover:bg-[color:var(--accent-strong)] shadow-[var(--shadow-sm)]",
  secondary:
    "border-[color:var(--border-strong)] bg-[color:var(--surface)] text-[color:var(--foreground)] hover:bg-[color:var(--surface-hover)] shadow-[var(--shadow-sm)]",
  ghost:
    "border-transparent text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--accent-soft)]",
  danger:
    "border-transparent bg-[color:var(--danger)] text-[color:var(--danger-foreground)] hover:bg-[color:var(--danger-hover)] shadow-[var(--shadow-sm)]",
};

export const Button = ({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-[0.875rem] font-medium transition-[background-color,color,border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] disabled:pointer-events-none disabled:opacity-50",
      variantClassNames[variant],
      className,
    )}
    {...props}
  />
);
