import { supabase, supabaseReady } from "@/lib/supabase";

export interface SendResult {
  ok: boolean;
  error?: string;
}

export interface VerifyResult {
  ok: boolean;
  error?: string;
}

export async function sendVerificationCode(email: string): Promise<SendResult> {
  const clean = email.trim().toLowerCase();
  if (!clean) return { ok: false, error: "Enter your email" };
  if (!supabaseReady || !supabase) {
    return { ok: false, error: "Email service is not configured yet. Use an access code to continue." };
  }
  try {
    console.log("[email-verify] sending OTP to", clean);
    const { error } = await supabase.auth.signInWithOtp({
      email: clean,
      options: { shouldCreateUser: true },
    });
    if (error) {
      console.log("[email-verify] send error", error.message, error.status);
      if (error.status === 429 || /rate/i.test(error.message)) {
        return { ok: false, error: "Too many attempts. Please wait a moment and try again." };
      }
      return { ok: false, error: "Couldn't send the code. Check your email and try again." };
    }
    return { ok: true };
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
    console.log("[email-verify] verifying code for", clean);
    const { error } = await supabase.auth.verifyOtp({
      email: clean,
      token: token.trim(),
      type: "email",
    });
    if (error) {
      console.log("[email-verify] verify error", error.message, error.status);
      if (/expired/i.test(error.message)) return { ok: false, error: "Code expired. Tap resend to get a new one." };
      return { ok: false, error: "Invalid code. Double-check and try again." };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    console.log("[email-verify] verify exception", msg);
    return { ok: false, error: "Network issue — please retry." };
  }
}
