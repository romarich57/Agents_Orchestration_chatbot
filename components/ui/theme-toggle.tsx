"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { IconButton } from "@/components/ui/icon-button";
import { useMounted } from "@/lib/hooks/use-mounted";

export const ThemeToggle = () => {
  const mounted = useMounted();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <IconButton
      aria-label="Changer de thème"
      disabled={!mounted}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted ? (
        isDark ? <SunMedium className="size-4" /> : <MoonStar className="size-4" />
      ) : (
        <span aria-hidden="true" className="size-4" />
      )}
    </IconButton>
  );
};
