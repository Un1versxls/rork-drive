import createContextHook from "@nkzw/create-context-hook";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase, supabaseReady } from "@/lib/supabase";
import { findLocalCode } from "@/constants/local-codes";
import { upsertAppUser } from "@/lib/appUserTracking";
import type { AuthUser } from "@/types";

interface UserAccountRow {
  id: string;
  email: string;
  is_admin: boolean;
  is_dev: boolean;
  admin_granted_premium: boolean;
  granted_premium_plan: "base" | "premium" | null;
}

async function fetchAccount(userId: string): Promise<UserAccountRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("user_accounts")
    .select("id, email, is_admin, is_dev, admin_granted_premium, granted_premium_plan")
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

  useEffect(() => {
    if (!supabase) {
      setBooting(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setBooting(false);
      if (data.session?.user) {
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
    return {
      id: session.user.id,
      email: session.user.email ?? acc?.email ?? "",
      isAdmin: acc?.is_admin ?? false,
      isDev: acc?.is_dev ?? false,
      adminGrantedPremium: acc?.admin_granted_premium ?? false,
    };
  }, [session, accountQuery.data]);

  const signUpMutation = useMutation({
    mutationFn: async (params: { email: string; password: string; name?: string }) => {
      if (!supabase) throw new Error("Supabase not configured");
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
      return data;
    },
  });

  const signInMutation = useMutation({
    mutationFn: async (params: { email: string; password: string }) => {
      if (!supabase) throw new Error("Supabase not configured");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: params.email.trim().toLowerCase(),
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

  const redeemCodeMutation = useMutation({
    mutationFn: async (rawCode: string) => {
      const code = rawCode.trim().toUpperCase();
      if (!code) throw new Error("Enter a code");

      const local = findLocalCode(code);

      if (supabase && session) {
        try {
          const { data: existing, error: fetchErr } = await supabase
            .from("redeem_codes")
            .select("*")
            .eq("code", code)
            .eq("active", true)
            .maybeSingle();

          if (!fetchErr && existing) {
            if (existing.uses >= existing.max_uses) throw new Error("Code has been used up");

            const { error: updErr } = await supabase
              .from("redeem_codes")
              .update({
                uses: existing.uses + 1,
                claimed_by: session.user.id,
                active: existing.uses + 1 < existing.max_uses,
              })
              .eq("code", code);
            if (updErr) console.log("[redeem] update code error", updErr.message);

            const grantsAdmin = existing.grants_admin === true || existing.plan === "admin";
            const patch: Record<string, unknown> = {};
            if (grantsAdmin) patch.is_admin = true;
            if (existing.plan === "base" || existing.plan === "premium") {
              patch.admin_granted_premium = true;
              patch.granted_premium_plan = existing.plan;
            } else if (grantsAdmin) {
              patch.admin_granted_premium = true;
              patch.granted_premium_plan = "premium";
            }

            const { error: grantErr } = await supabase
              .from("user_accounts")
              .update(patch)
              .eq("id", session.user.id);
            if (grantErr) console.log("[redeem] grant error", grantErr.message);

            return (existing.plan === "admin" ? "premium" : existing.plan) as "base" | "premium";
          }
          if (fetchErr) console.log("[redeem] fetch error, falling back", fetchErr.message);
        } catch (e) {
          console.log("[redeem] network error, falling back to local", e);
        }
      }

      if (local) {
        if (supabase && session) {
          const patch: Record<string, unknown> = {};
          if (local.grantsAdmin) patch.is_admin = true;
          patch.admin_granted_premium = true;
          patch.granted_premium_plan = local.plan === "admin" ? "premium" : local.plan;
          try {
            await supabase.from("user_accounts").update(patch).eq("id", session.user.id);
          } catch (e) {
            console.log("[redeem] local grant sync failed", e);
          }
        }
        return (local.plan === "admin" ? "premium" : local.plan) as "base" | "premium";
      }

      throw new Error("Code not found");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-account"] });
    },
  });

  return useMemo(() => ({
    ready: supabaseReady,
    booting,
    session,
    user,
    signUp: signUpMutation.mutateAsync,
    signUpPending: signUpMutation.isPending,
    signIn: signInMutation.mutateAsync,
    signInPending: signInMutation.isPending,
    signOut: signOutMutation.mutateAsync,
    redeemCode: redeemCodeMutation.mutateAsync,
    redeemPending: redeemCodeMutation.isPending,
    refreshAccount: () => qc.invalidateQueries({ queryKey: ["user-account"] }),
  }), [booting, session, user, signUpMutation.mutateAsync, signUpMutation.isPending, signInMutation.mutateAsync, signInMutation.isPending, signOutMutation.mutateAsync, redeemCodeMutation.mutateAsync, redeemCodeMutation.isPending, qc]);
});
