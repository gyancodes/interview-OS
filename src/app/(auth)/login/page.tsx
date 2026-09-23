import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppwriteSetupNotice } from "@/components/auth/AppwriteSetupNotice";
import { AuthForm } from "@/components/auth/AuthForm";
import { isAppwriteAuthConfigured } from "@/lib/appwrite/config";
import { DEFAULT_AUTHENTICATED_ROUTE } from "@/lib/appwrite/constants";
import { getLoggedInUser } from "@/lib/appwrite/server";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to InterviewOS to continue your interview preparation.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // Verified against Appwrite, so a stale cookie still renders the form and
  // signing in simply replaces it.
  const user = await getLoggedInUser();
  if (user) redirect(DEFAULT_AUTHENTICATED_ROUTE);

  const { next } = await searchParams;
  const safeNext = typeof next === "string" && next.startsWith("/") ? next : undefined;

  return (
    <div className="flex flex-col gap-6">
      {isAppwriteAuthConfigured() ? null : <AppwriteSetupNotice />}
      <AuthForm mode="signin" next={safeNext} />
    </div>
  );
}
