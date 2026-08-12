"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { ensureTraceabilitySeeded } from "@/lib/traceability";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/dashboard", label: "Orders" },
  { href: "/dashboard/traceability", label: "Traceability" },
];

// DashboardNav only ever renders on the client, after DashboardLayout's
// auth-gated mount check, so reading/seeding here is safe.
function loadAlertCount(): number {
  return ensureTraceabilitySeeded().length;
}

export function DashboardNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [alertCount] = useState(loadAlertCount);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <div className="flex items-center gap-6">
        <Logo height={28} />
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-primary-100 text-primary-800"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {link.label}
              {link.label === "Traceability" && alertCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs text-white">
                  {alertCount}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Log out
        </Button>
      </div>
    </header>
  );
}
