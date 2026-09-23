"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { buttonStyles } from "@/components/ui";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/practice", label: "Practice" },
  { href: "/learn", label: "Learn" },
  { href: "/mock-interview", label: "Mock Interview" },
] as const;

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 glass-header">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <Link href="/" className="group flex items-center gap-2.5 font-semibold tracking-tight">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-fg text-canvas shadow-xs transition-transform group-hover:scale-105">
            <span className="font-mono text-xs font-bold tracking-tighter">OS</span>
            {/* Small radiant blue accent dot */}
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent ring-2 ring-canvas" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-semibold text-fg">Interview<span className="text-accent font-bold">OS</span></span>
            <span className="hidden rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] font-medium text-faint sm:inline-block border border-border">
              AI
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Main navigation" className="hidden md:block">
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
                      "relative rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150",
                      active
                        ? "bg-surface text-fg shadow-2xs border border-border"
                        : "text-muted hover:bg-surface-2 hover:text-fg",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Quick CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/practice"
            className={cn(
              buttonStyles.primary,
              "h-8 px-3.5 text-xs font-semibold tracking-tight shadow-xs",
            )}
          >
            <span className="text-accent">✦</span> Quick Practice
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-fg md:hidden"
          aria-label="Toggle navigation menu"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen ? (
        <div className="border-b border-border bg-surface px-4 py-3 md:hidden">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium",
                      active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-fg",
                    )}
                  >
                    {item.label}
                    {active ? <span className="text-xs">●</span> : null}
                  </Link>
                </li>
              );
            })}
            <li className="pt-2">
              <Link
                href="/practice"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(buttonStyles.primary, "w-full justify-center text-xs")}
              >
                Quick Practice →
              </Link>
            </li>
          </ul>
        </div>
      ) : null}
    </header>
  );
}
