import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { requireUser } from "@/lib/appwrite/server";

/**
 * Authenticated app shell.
 *
 * `requireUser()` performs the real Appwrite verification (middleware only
 * checks for the cookie), so a revoked or expired session can never render the
 * dashboard.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <>
      <Header />
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-8 sm:px-6">
        {children}
      </main>
      <SiteFooter variant="slim" />
    </>
  );
}
