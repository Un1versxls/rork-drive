import { supabase, supabaseReady } from "@/lib/supabase";

export interface DeleteResult {
  ok: boolean;
  error?: string;
}

function parseFnError(raw: unknown, fallback: string): string {
  if (raw && typeof raw === "object") {
    const obj = raw as { error?: unknown; message?: unknown };
    if (typeof obj.error === "string") return obj.error;
    if (typeof obj.message === "string") return obj.message;
  }
  return fallback;
}

/**
 * Permanently delete the signed-in user's account and all their cloud data.
 * Calls the `delete-account` edge function with the user's access token,
 * then signs the local session out so the app returns to the welcome screen.
 */
export async function deleteAccount(): Promise<DeleteResult> {
  if (!supabaseReady || !supabase) {
    return { ok: false, error: "Account service is unavailable. Please try again later." };
  }
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      return { ok: false, error: "You need to be signed in to delete your account." };
    }

    const { data, error } = await supabase.functions.invoke("delete-account", {
      body: {},
      headers: { Authorization: `Bearer ${token}` },
    });
    if (error) {
      console.log("[delete-account] invoke error", error.message);
      return { ok: false, error: parseFnError(data, error.message || "Couldn't delete your account. Try again.") };
    }
    if (data && typeof data === "object" && (data as { ok?: boolean }).ok === true) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.log("[delete-account] signOut after delete", e);
      }
      return { ok: true };
    }
    return { ok: false, error: parseFnError(data, "Couldn't delete your account. Try again.") };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    console.log("[delete-account] exception", msg);
    return { ok: false, error: "Network issue — please check your connection and retry." };
  }
}
