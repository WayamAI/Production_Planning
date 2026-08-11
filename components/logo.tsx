"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

interface LogoProps {
  className?: string;
  height?: number;
}

function subscribeNoop() {
  return () => {};
}

/** True once the component has mounted on the client (false during SSR). */
function useMounted() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );
}

export function Logo({ className, height = 32 }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();

  const src = mounted && resolvedTheme === "dark" ? "/logo-dark.svg" : "/logo-light.svg";

  return (
    <Image
      src={src}
      alt="Wayam AI"
      width={height * 3.4}
      height={height}
      className={className}
      priority
    />
  );
}
