// @ts-nocheck
// Supabase Edge Function: signup
// Creates (or updates) an account directly from name + email + password.
// No email verification code — used by the native claim flow which signs the
// user up the moment they enter their name, email, and password.

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
    const { email, name, password } = await req.json();
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanPassword = typeof password === "string" ? password : "";

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return json({ error: "Invalid email" }, 400);
    }
    if (cleanPassword.length < 6) {
      return json({ error: "Password must be at least 6 characters." }, 400);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!SUPABASE_URL || !SERVICE_ROLE) return json({ error: "Server not configured" }, 500);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const pwHash = await sha256(`${cleanEmail}:${cleanPassword}:drive-pw-v1`);

    // If an account already exists with a password, block silent overwrite so a
    // claim can't hijack someone else's account.
    const { data: existing, error: selErr } = await admin
      .from("app_users")
      .select("email, password_hash")
      .eq("email", cleanEmail)
      .limit(1);
    if (selErr) {
      console.log("[signup] select error", selErr.message);
      return json({ error: "Sign-up failed. Try again." }, 500);
    }

    const row = existing?.[0];
    if (row?.password_hash && row.password_hash !== pwHash) {
      return json({ error: "An account already exists for this email. Sign in instead." }, 409);
    }

    const payload: Record<string, unknown> = {
      email: cleanEmail,
      password_hash: pwHash,
      auth_provider: "email",
    };
    if (cleanName) payload.name = cleanName;

    const { error: upErr } = await admin
      .from("app_users")
      .upsert(payload, { onConflict: "email" });
    if (upErr) {
      console.log("[signup] upsert error", upErr.message);
      return json({ error: "Sign-up failed. Try again." }, 500);
    }

    console.log("[signup] created", cleanEmail);
    return json({ ok: true });
  } catch (e) {
    console.log("[signup] exception", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
