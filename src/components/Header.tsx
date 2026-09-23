"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { UserMenu } from "@/components/auth/UserMenu";
import { buttonStyles } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Navigation shown to signed-in users. */
const APP_NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/practice", label: "Practice" },
  { href: "/learn", label: "Learn" },
  { href: "/mock-interview", label: "Mock Interview" },
] as const;

/** Marketing anchors shown to anonymous visitors. */
const PUBLIC_NAV = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#curriculum", label: "Curriculum" },
  { href: "/#faq", label: "FAQ" },
] as const;

export function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Collapse the mobile menu whenever the route changes.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 6);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = user ? APP_NAV : PUBLIC_NAV;
  const isActive = (href: string) =>
    Boolean(user) && (pathname === href || pathname.startsWith(`${href}/`));

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-200",
        scrolled ? "glass-header border-border shadow-soft" : "border-transparent bg-canvas",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-fg text-canvas shadow-xs transition-transform duration-200 group-hover:scale-105">
            <span className="font-mono text-xs font-bold tracking-tighter">OS</span>
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent ring-2 ring-canvas" />
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-[15px] font-semibold tracking-tight text-fg">
              Interview<span className="font-bold text-accent">OS</span>
            </span>
            <span className="hidden rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] font-medium text-faint sm:inline-block">
              AI
            </span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav aria-label="Main navigation" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "relative rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150",
                    isActive(item.href)
                      ? "border border-border bg-surface text-fg shadow-2xs"
                      : "text-muted hover:bg-surface-2 hover:text-fg",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>


        {/* Desktop auth actions */}
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link
                href="/practice"
                className={cn(buttonStyles.accent, "h-8 px-3.5 text-xs font-semibold shadow-xs")}
              >
                <span aria-hidden>✦</span> Quick Practice
              </Link>
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className={cn(
                  buttonStyles.primary,
                  "h-8 px-3.5 text-xs font-semibold tracking-tight shadow-xs",
                )}
              >
                Get started
                <span aria-hidden>→</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-fg md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen ? (
        <div className="animate-fade border-b border-border bg-surface px-4 py-3 shadow-soft md:hidden">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium",
                    isActive(item.href)
                      ? "bg-accent-soft text-accent"
                      : "text-muted hover:bg-surface-2 hover:text-fg",
                  )}
                >
                  {item.label}
                  {isActive(item.href) ? <span className="text-xs">●</span> : null}
                </Link>
              </li>
            ))}

            {user ? (
              <>
                <li className="mt-1 flex items-center gap-2.5 rounded-lg border border-border bg-surface-2/60 px-3 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fg font-mono text-[11px] font-bold text-canvas">
                    {(user.name.trim() || user.email).slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-fg">
                      {user.name || "Your account"}
                    </span>
                    <span className="block truncate text-[11px] text-muted">{user.email}</span>
                  </span>
                </li>
                <li>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-fg"
                  >
                    Account settings
                  </Link>
                </li>
                <li className="pt-1">
                  <Link
                    href="/practice"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(buttonStyles.accent, "w-full justify-center text-xs")}
                  >
                    <span aria-hidden>✦</span> Quick Practice
                  </Link>
                </li>
              </>
            ) : (
              <li className="flex flex-col gap-2 pt-2">
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(buttonStyles.primary, "w-full justify-center text-xs")}
                >
                  Get started free →
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(buttonStyles.secondary, "w-full justify-center text-xs")}
                >
                  Sign in
                </Link>
              </li>
            )}
          </ul>
        </div>
      ) : null}
    </header>
  );
}
