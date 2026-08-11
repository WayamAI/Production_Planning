"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

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

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const mounted = useMounted();
  const loggedIn = mounted && isLoggedIn();

  useEffect(() => {
    if (mounted && !isLoggedIn()) {
      router.replace("/login");
    }
  }, [mounted, router]);

  if (!loggedIn) return null;

  return (
    <div className="min-h-screen">
      <DashboardNav />
      <main className="p-6">{children}</main>
    </div>
  );
}
