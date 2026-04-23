# Fix email verification, Supabase connection, and explain Apple payments

## What I'll fix in the app

### 1. Real email verification that actually sends a code
- Replace the Supabase magic-link flow with a custom 6-digit code sent from a lightweight backend endpoint so codes always arrive (this is what Apple flagged).
- The email will be a clean, branded HTML message with your app name, the 6-digit code, and a short security note.
- The verify screen will call the same backend to check the code — no more "Email service unavailable" fallback.
- "Resend code" will work with a 30-second cooldown and will actually re-send.
- If email fails for any reason, the user sees a clear retry message instead of being silently pushed forward.

### 2. Supabase "connected" state across the app
- Add a one-time connection check at app start that pings your Supabase project and caches the result.
- Remove the persistent "Connect" banner you're seeing at the top of every screen (it was a leftover status indicator that stayed visible even when keys were set).
- Add a tiny green dot in the Profile screen that confirms "Connected to cloud" so you can verify at a glance.
- Make sure your admin codes, user accounts, and survey responses actually read/write to your Supabase tables — right now some writes silently skip when the client thinks it isn't ready.
- Add clear console logs on every Supabase call so if something fails you'll see exactly why.

### 3. Apple payments — what's possible right now
I'll add a clear explanation screen in the app (and below) since this part can't be "coded" — it's configured in Apple's dashboard:

**What you need to do in App Store Connect (one-time, ~30 min):**
1. Sign paid apps agreement in **Agreements, Tax, and Banking** (this is the #1 reason payments show "unavailable").
2. Go to your app → **Features → In-App Purchases** → create your subscription (e.g. "Monthly Pro") with a product ID like `com.yourapp.pro.monthly`.
3. Add a localized display name, description, and price.
4. Create a **Subscription Group** and add the product to it.
5. Submit the subscription for review **together with** your next app build.

**In RevenueCat dashboard:**
1. Add the same product ID under your RevenueCat project.
2. Attach it to an "Offering" called `default` with a package called `$rc_monthly`.
3. Paste your App Store Connect shared secret into RevenueCat.

**In the app:**
- I'll make the paywall gracefully show "Payments will be available after App Store approval" when RevenueCat returns no offerings, instead of a scary error.
- I'll keep your admin code bypass working so you can still use premium features while Apple reviews.

**What you can't do right now:**
- Real purchases only work on a TestFlight build or App Store build with a sandbox tester account — not in Expo Go.
- You can't test Apple payments in the web preview.

### What stays the same
- Your admin code `1111` still works for instant premium access.
- Onboarding flow, tabs, and tasks are untouched.
- All existing data and screens remain the same.