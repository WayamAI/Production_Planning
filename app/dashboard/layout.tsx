"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    setChecked(true);
  }, [router]);

  if (!checked) return null;

  return (
    <div className="min-h-screen">
      <DashboardNav />
      <main className="p-6">{children}</main>
    </div>
  );
}
