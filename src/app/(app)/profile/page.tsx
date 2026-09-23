import type { Metadata } from "next";

import { AccountPanel } from "@/components/auth/AccountPanel";
import { requireUser } from "@/lib/appwrite/server";

export const metadata: Metadata = {
  title: "Account",
  description: "Your InterviewOS account and locally stored progress data.",
};

export default async function ProfilePage() {
  const user = await requireUser("/profile");

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-accent">
          Account
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-fg">Profile &amp; data</h1>
        <p className="max-w-2xl text-sm text-muted">
          Review the identity issued by Appwrite and manage the practice data stored in this
          browser.
        </p>
      </header>

      <AccountPanel user={user} />
    </div>
  );
}
