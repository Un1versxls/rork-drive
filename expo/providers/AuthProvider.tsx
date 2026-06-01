import createContextHook from "@nkzw/create-context-hook";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session } from "@supabase/supabase-js";

import { supabase, supabaseReady } from "@/lib/supabase";
import { upsertAppUser } from "@/lib/appUserTracking";
import { isDevAllowedEmail } from "@/constants/dev-allowlist";
import { isDeviceBlacklisted, stampDeviceOnAccount, setLocalRevokedFlag, readLocalRevokedFlag } from "@/lib/deviceBlacklist";
import type { AuthUser } from "@/types";

export const LAST_ACTIVE_KEY = "drive.auth.lastActiveAt";

async function touchLastActive(): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
  } catch (e) {
    console.log("[auth] touchLastActive failed", e);
  }
}

interface UserAccountRow {
  id: string;
  email: string;
  is_admin: boolean;
  is_dev: boolean;
  admin_granted_premium: boolean;
  granted_premium_plan: "base" | "premium" | null;
  is_revoked?: boolean | null;
}

async function fetchAccount(userId: string): Promise<UserAccountRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("user_accounts")
    .select("id, email, is_admin, is_dev, admin_granted_premium, granted_premium_plan, is_revoked")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.log("[auth] fetchAccount", error.message);
    return null;
  }
  return data as UserAccountRow | null;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [booting, setBooting] = useState<boolean>(true);
  const [accessRevoked, setAccessRevoked] = useState<boolean>(false);

  useEffect(() => {
    void readLocalRevokedFlag().then((v) => { if (v) setAccessRevoked(true); });
  }, []);

  useEffect(() => {
    if (!supabase) {
      setBooting(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setBooting(false);
      if (data.session?.user) {
        void touchLastActive();
        void stampDeviceOnAccount({ userId: data.session.user.id, email: data.session.user.email ?? null });
        upsertAppUser({
          userId: data.session.user.id,
          email: data.session.user.email ?? null,
          touchLastSeen: true,
        }).catch((e) => console.log("[auth] sync on boot failed", e));
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      qc.invalidateQueries({ queryKey: ["user-account"] });
      if (s?.user && (_event === "SIGNED_IN" || _event === "TOKEN_REFRESHED" || _event === "USER_UPDATED")) {
        void touchLastActive();
        void stampDeviceOnAccount({ userId: s.user.id, email: s.user.email ?? null });
        upsertAppUser({
          userId: s.user.id,
          email: s.user.email ?? null,
          touchLastSeen: true,
        }).catch((e) => console.log("[auth] sync on auth change failed", e));
      }
    });
    return () => { sub.subscription.unsubscribe(); };
  }, [qc]);

  const accountQuery = useQuery({
    queryKey: ["user-account", session?.user.id ?? null],
    queryFn: async () => {
      if (!session) return null;
      return fetchAccount(session.user.id);
    },
    enabled: !!session,
    staleTime: 30_000,
  });

  const user: AuthUser | null = useMemo(() => {
    if (!session) return null;
    const acc = accountQuery.data;
    const email = session.user.email ?? acc?.email ?? "";
    const devAllowed = isDevAllowedEmail(email);
    return {
      id: session.user.id,
      email,
      isAdmin: (acc?.is_admin ?? false) || devAllowed,
      isDev: (acc?.is_dev ?? false) || devAllowed,
      adminGrantedPremium: acc?.admin_granted_premium ?? false,
      isRevoked: acc?.is_revoked ?? false,
    };
  }, [session, accountQuery.data]);

  const signUpMutation = useMutation({
    mutationFn: async (params: { email: string; password: string; name?: string }) => {
      if (!supabase) throw new Error("Supabase not configured");
      const cleanEmail = params.email.trim().toLowerCase();
      if (!isDevAllowedEmail(cleanEmail)) {
        const blocked = await isDeviceBlacklisted();
        if (blocked) throw new Error("This device has been blocked from creating accounts. Contact support.");
      }
      const cleanName = params.name?.trim();
      const { data, error } = await supabase.auth.signUp({
        email: params.email.trim().toLowerCase(),
        password: params.password,
        options: {
          data: cleanName ? { name: cleanName, full_name: cleanName } : undefined,
        },
      });
      if (error) throw error;
      if (cleanName && data.user) {
        try {
          await supabase
            .from("user_accounts")
            .update({ name: cleanName })
            .eq("id", data.user.id);
        } catch (e) {
          console.log("[auth] save name failed", e);
        }
      }
      if (data.user) {
        upsertAppUser({
          userId: data.user.id,
          email: data.user.email ?? params.email,
          name: cleanName ?? null,
          authProvider: "email",
          touchLastSeen: true,
        }).catch((e) => console.log("[auth] app_users sync failed", e));
      }
      return data;
    },
  });

  const signInMutation = useMutation({
    mutationFn: async (params: { email: string; password: string }) => {
      if (!supabase) throw new Error("Supabase not configured");
      const cleanEmail = params.email.trim().toLowerCase();
      if (!isDevAllowedEmail(cleanEmail)) {
        const blocked = await isDeviceBlacklisted();
        if (blocked) throw new Error("This device has been blocked. Contact support.");
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: params.password,
      });
      if (error) throw error;
      return data;
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      if (!supabase) return;
      await supabase.auth.signOut();
    },
  });

  /**
   * Forcibly tear down the session because the admin revoked the user.
   * Persists the revoked flag so the RevokedScreen survives app restarts
   * until the user signs in again with a dev-allowlisted email.
   */
  const triggerAccessRevoked = useCallback(async (): Promise<void> => {
    await setLocalRevokedFlag(true);
    setAccessRevoked(true);
    try { if (supabase) await supabase.auth.signOut(); } catch (e) { console.log("[auth] revoke signOut err", e); }
  }, []);

  const clearRevoked = useCallback(async (): Promise<void> => {
    await setLocalRevokedFlag(false);
    setAccessRevoked(false);
  }, []);

  return useMemo(() => ({
    ready: supabaseReady,
    booting,
    session,
    user,
    accessRevoked,
    triggerAccessRevoked,
    clearRevoked,
    signUp: signUpMutation.mutateAsync,
    signUpPending: signUpMutation.isPending,
    signIn: signInMutation.mutateAsync,
    signInPending: signInMutation.isPending,
    signOut: signOutMutation.mutateAsync,
    refreshAccount: () => qc.invalidateQueries({ queryKey: ["user-account"] }),
  }), [booting, session, user, accessRevoked, triggerAccessRevoked, clearRevoked, signUpMutation.mutateAsync, signUpMutation.isPending, signInMutation.mutateAsync, signInMutation.isPending, signOutMutation.mutateAsync, qc]);
});
