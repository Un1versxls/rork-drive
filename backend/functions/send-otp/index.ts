// @ts-nocheck
// Supabase Edge Function: send-otp
// Generates a 6-digit OTP, stores a SHA-256 hash in email_otps, and emails it via Resend.
//
// Required env vars (set in Supabase project):
//   SUPABASE_URL                (auto-set)
//   SUPABASE_SERVICE_ROLE_KEY   (auto-set)
//   RESEND_API_KEY              (from Resend dashboard)
//   RESEND_FROM                 (optional, defaults to "DRIVE <onboarding@resend.dev>")

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function renderEmail(code: string): string {
  return `<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#fafafa;padding:32px;color:#111">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #eee;border-radius:18px;padding:32px">
    <h1 style="font-size:22px;margin:0 0 8px;font-weight:900;letter-spacing:-0.3px">Your DRIVE code</h1>
    <p style="color:#555;margin:0 0 24px;font-size:14px;line-height:22px">Enter this 6-digit code to verify your email and keep building your business.</p>
    <div style="font-size:38px;font-weight:900;letter-spacing:10px;background:#f5f5f5;border-radius:14px;padding:20px;text-align:center">${code}</div>
    <p style="color:#888;margin:20px 0 0;font-size:12px;line-height:20px">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
  </div>
</body></html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { email } = await req.json();
    const clean = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      return json({ error: "Invalid email" }, 400);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
    const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "DRIVE <onboarding@resend.dev>";

    if (!SUPABASE_URL || !SERVICE_ROLE) return json({ error: "Server not configured" }, 500);
    if (!RESEND_API_KEY) return json({ error: "Email service not configured" }, 500);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Basic rate limit: no more than 4 codes in last 10 min for this email.
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("email_otps")
      .select("id", { count: "exact", head: true })
      .eq("email", clean)
      .gte("created_at", tenMinAgo);
    if ((count ?? 0) >= 4) {
      return json({ error: "Too many codes requested. Try again in a few minutes." }, 429);
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await sha256(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: insErr } = await admin
      .from("email_otps")
      .insert({ email: clean, code_hash: codeHash, expires_at: expiresAt });
    if (insErr) {
      console.log("[send-otp] insert error", insErr.message);
      return json({ error: "Couldn't prepare code. Try again." }, 500);
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [clean],
        subject: "Your DRIVE verification code",
        html: renderEmail(code),
        text: `Your DRIVE verification code is ${code}. It expires in 10 minutes.`,
      }),
    });

    if (!emailRes.ok) {
      const body = await emailRes.text();
      console.log("[send-otp] resend error", emailRes.status, body);
      return json({ error: "Couldn't send email. Check the address and try again." }, 502);
    }

    console.log("[send-otp] sent to", clean);
    return json({ ok: true });
  } catch (e) {
    console.log("[send-otp] exception", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
