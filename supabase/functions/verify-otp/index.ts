// @ts-nocheck
// Supabase Edge Function: verify-otp
// Validates a 6-digit code for the given email against email_otps.

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { email, code } = await req.json();
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const cleanCode = typeof code === "string" ? code.trim() : "";
    if (!cleanEmail || !/^\d{6}$/.test(cleanCode)) {
      return json({ error: "Invalid request" }, 400);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!SUPABASE_URL || !SERVICE_ROLE) return json({ error: "Server not configured" }, 500);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const nowIso = new Date().toISOString();

    const { data: rows, error } = await admin
      .from("email_otps")
      .select("id, code_hash, expires_at, consumed_at, attempts")
      .eq("email", cleanEmail)
      .is("consumed_at", null)
      .gte("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.log("[verify-otp] select error", error.message);
      return json({ error: "Verification failed. Try again." }, 500);
    }

    const row = rows?.[0];
    if (!row) return json({ error: "Code expired. Tap resend to get a new one." }, 400);
    if ((row.attempts ?? 0) >= 6) {
      return json({ error: "Too many attempts. Request a new code." }, 429);
    }

    const hash = await sha256(cleanCode);
    if (hash !== row.code_hash) {
      await admin
        .from("email_otps")
        .update({ attempts: (row.attempts ?? 0) + 1 })
        .eq("id", row.id);
      return json({ error: "Invalid code. Double-check and try again." }, 400);
    }

    await admin
      .from("email_otps")
      .update({ consumed_at: nowIso })
      .eq("id", row.id);

    console.log("[verify-otp] verified", cleanEmail);
    return json({ ok: true });
  } catch (e) {
    console.log("[verify-otp] exception", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
