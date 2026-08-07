"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, Plus, BarChart3, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "דשבורד", icon: Home },
  { href: "/calendar", label: "יומן", icon: CalendarDays },
  { href: "/appointments/new", label: "תור חדש", icon: Plus, center: true },
  { href: "/reports", label: "דוחות", icon: BarChart3 },
  { href: "/more", label: "עוד", icon: Menu },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border-soft bg-bg/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-lg items-end justify-between px-3 pt-2 pb-2">
        {items.map(({ href, label, icon: Icon, ...rest }) => {
          const center = "center" in rest && rest.center;
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          if (center) {
            return (
              <li key={href} className="-mt-6">
                <Link
                  href={href}
                  className="flex flex-col items-center gap-1"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/30">
                    <Icon size={26} />
                  </span>
                </Link>
              </li>
            );
          }

          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl text-sm",
                  active ? "text-accent-strong" : "text-text-muted",
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
