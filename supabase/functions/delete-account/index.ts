// @ts-nocheck
// Supabase Edge Function: delete-account
// Permanently deletes the calling user's account and all their cloud data.
//
// The client must call this with the user's access token in the
// Authorization header. We verify the token, then use the service-role
// key to erase every row tied to the user and finally remove the auth user.
//
// Required env vars (auto-set in Supabase projects):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!SUPABASE_URL || !SERVICE_ROLE) return json({ error: "Server not configured" }, 500);

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Verify the caller's token and resolve their user id.
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      console.log("[delete-account] invalid token", userErr?.message);
      return json({ error: "Not authenticated" }, 401);
    }

    const userId = userData.user.id;
    const email = userData.user.email?.toLowerCase() ?? null;

    // Erase all rows tied to this user. Failures are logged but don't
    // block deletion of the auth user itself.
    const cleanup: Promise<unknown>[] = [
      admin.from("app_users").delete().eq("id", userId),
      admin.from("user_accounts").delete().eq("id", userId),
    ];
    if (email) {
      cleanup.push(admin.from("app_users").delete().eq("email", email));
      cleanup.push(admin.from("survey_responses").delete().eq("email", email));
      cleanup.push(admin.from("email_otps").delete().eq("email", email));
    }
    const results = await Promise.allSettled(cleanup);
    results.forEach((r, i) => {
      if (r.status === "rejected") console.log("[delete-account] cleanup", i, r.reason);
    });

    // Finally, delete the auth user. This is the irreversible step.
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) {
      console.log("[delete-account] deleteUser error", delErr.message);
      return json({ error: "Could not delete account. Please try again." }, 500);
    }

    console.log("[delete-account] deleted", userId);
    return json({ ok: true });
  } catch (e) {
    console.log("[delete-account] exception", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
