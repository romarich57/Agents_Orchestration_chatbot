"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export const IconButton = ({
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type={type}
    className={cn(
      "inline-flex size-9 items-center justify-center rounded-xl border border-transparent bg-transparent text-[color:var(--muted-foreground)] transition-[background-color,color,border-color,box-shadow] duration-200 hover:border-[color:var(--border)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  />
);
