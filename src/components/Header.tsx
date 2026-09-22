"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/practice", label: "Practice" },
  { href: "/learn", label: "Learn" },
  { href: "/mock-interview", label: "Mock Interview" },
] as const;

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-fg font-mono text-[11px] font-medium text-canvas">
            OS
          </span>
          <span className="text-[15px]">InterviewOS</span>
        </Link>

        <nav aria-label="Main navigation">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-surface-2 hover:text-fg",
                      active ? "font-medium text-fg" : "text-muted",
                      active && "bg-surface-2",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
