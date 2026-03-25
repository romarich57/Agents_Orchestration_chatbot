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
      "inline-flex size-9 items-center justify-center rounded-xl border border-[color:var(--border)] bg-white/40 text-[color:var(--foreground)] transition hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10",
      className,
    )}
    {...props}
  />
);
