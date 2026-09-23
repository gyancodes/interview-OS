"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { setStorageScope } from "@/lib/storage";

import type { AuthUser } from "@/lib/appwrite/types";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, isAuthenticated: false });

/**
 * Exposes the Appwrite account resolved on the server to the client tree.
 *
 * It also points LocalStorage at the signed-in user's namespace. This happens
 * during render rather than in an effect, because React runs child effects
 * before parent effects — a child page reading storage on mount must already
 * see the correct scope.
 */
export function AuthProvider({ user, children }: { user: AuthUser | null; children: ReactNode }) {
  setStorageScope(user?.id ?? null);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: Boolean(user) }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
