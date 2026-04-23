import { supabase, supabaseReady } from "@/lib/supabase";

export interface SendResult {
  ok: boolean;
  error?: string;
}

export interface VerifyResult {
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

export async function sendVerificationCode(email: string): Promise<SendResult> {
  const clean = email.trim().toLowerCase();
  if (!clean) return { ok: false, error: "Enter your email" };
  if (!supabaseReady || !supabase) {
    return { ok: false, error: "Email service is not configured yet. Use an access code to continue." };
  }
  try {
    console.log("[email-verify] invoking send-otp for", clean);
    const { data, error } = await supabase.functions.invoke("send-otp", {
      body: { email: clean },
    });
    if (error) {
      console.log("[email-verify] send error", error.message);
      const msg = parseFnError(data, error.message || "Couldn't send the code. Try again.");
      return { ok: false, error: msg };
    }
    if (data && typeof data === "object" && (data as { ok?: boolean }).ok === true) {
      return { ok: true };
    }
    return { ok: false, error: parseFnError(data, "Couldn't send the code. Try again.") };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    console.log("[email-verify] send exception", msg);
    return { ok: false, error: "Network issue — please check your connection and retry." };
  }
}

export async function verifyCode(email: string, token: string): Promise<VerifyResult> {
  const clean = email.trim().toLowerCase();
  if (!supabaseReady || !supabase) {
    return { ok: false, error: "Verification service unavailable." };
  }
  try {
    console.log("[email-verify] invoking verify-otp for", clean);
    const { data, error } = await supabase.functions.invoke("verify-otp", {
      body: { email: clean, code: token.trim() },
    });
    if (error) {
      console.log("[email-verify] verify error", error.message);
      const msg = parseFnError(data, error.message || "Invalid code. Try again.");
      return { ok: false, error: msg };
    }
    if (data && typeof data === "object" && (data as { ok?: boolean }).ok === true) {
      return { ok: true };
    }
    return { ok: false, error: parseFnError(data, "Invalid code. Try again.") };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    console.log("[email-verify] verify exception", msg);
    return { ok: false, error: "Network issue — please retry." };
  }
}
