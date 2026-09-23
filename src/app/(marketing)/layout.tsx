import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";

/**
 * Public marketing area (landing page).
 *
 * Sections are full-bleed, so the width cap lives inside each section rather
 * than around the page.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="relative z-10 flex-1">{children}</main>
      <SiteFooter variant="full" />
    </>
  );
}
