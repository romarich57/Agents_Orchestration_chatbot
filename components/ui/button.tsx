"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variantClassNames: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[color:var(--accent)] text-white hover:bg-[color:var(--accent-strong)]",
  secondary:
    "border border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--foreground)] hover:bg-white/70 dark:hover:bg-white/10",
  ghost: "text-[color:var(--foreground)] hover:bg-black/5 dark:hover:bg-white/5",
  danger: "bg-[color:var(--danger)] text-white hover:opacity-90",
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
      "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
      variantClassNames[variant],
      className,
    )}
    {...props}
  />
);
