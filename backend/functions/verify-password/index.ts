// @ts-nocheck
// Supabase Edge Function: verify-password
// Checks an email + password against app_users.password_hash. Never exposes the
// hash to the client (RLS on app_users is open for select), so verification
// happens here with the service role.

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
    const { email, password } = await req.json();
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const cleanPassword = typeof password === "string" ? password : "";
    if (!cleanEmail || !cleanPassword) {
      return json({ error: "Enter your email and password." }, 400);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!SUPABASE_URL || !SERVICE_ROLE) return json({ error: "Server not configured" }, 500);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: rows, error } = await admin
      .from("app_users")
      .select("email, password_hash")
      .eq("email", cleanEmail)
      .limit(1);

    if (error) {
      console.log("[verify-password] select error", error.message);
      return json({ error: "Sign-in failed. Try again." }, 500);
    }

    const row = rows?.[0];
    if (!row) return json({ error: "No account found for that email." }, 404);
    if (!row.password_hash) {
      return json({ error: "No password set for this account. Use 'Forgot password' or sign up again." }, 409);
    }

    const hash = await sha256(`${cleanEmail}:${cleanPassword}:drive-pw-v1`);
    if (hash !== row.password_hash) {
      return json({ error: "Incorrect password. Try again." }, 401);
    }

    console.log("[verify-password] ok", cleanEmail);
    return json({ ok: true });
  } catch (e) {
    console.log("[verify-password] exception", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
