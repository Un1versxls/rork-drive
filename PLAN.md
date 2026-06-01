# Fix all App Store rejection issues + manual checklist

## What I'll change in the app

**1. Remove Apple Sign In (fixes the reviewer's error – 2.1a)**
- Take out the "Sign in with Apple" button everywhere it appears (the sign-in screen and the onboarding account screen).
- Onboarding will continue straight to email sign-up / "skip for now", so there's no broken Apple button to crash on.
- Email + password sign-in stays exactly as it is.

**2. Add "Delete account" (required – 5.1.1v)**
- A new "Delete account" option in the Profile screen, in a red "danger" style.
- Tapping it shows a clear confirmation ("This permanently deletes your account and all your data. This can't be undone.").
- On confirm, a secure server function permanently erases the account and all the user's cloud data, then signs them out and returns them to the welcome screen.

**3. Remove promo/access codes & beta features (fixes 3.1.1 and 2.2)**
- Remove "Redeem a code" from Profile.
- Remove the "Have an access code (skip payment)" link from the paywall and the email verification screen.
- Remove the two redeem code screens entirely.
- Hide the Admin panel so it never appears in the shipped app.

**4. Add Terms of Use & Privacy Policy links (fixes 3.1.2c)**
- On the paywall: add clearly visible "Terms of Use" and "Privacy Policy" links, plus a line stating the subscription title, length, and price, and that it auto-renews.
- In Profile: add the same two links under a "Legal" section.
- I'll wire in Apple's standard Terms of Use link and a placeholder Privacy Policy URL for you to swap in your real one.

**5. Make the paywall sturdier (helps 2.1b)**
- If the subscription products can't load, show a friendly "Subscriptions are temporarily unavailable, please try again" message instead of a raw error.
- (The core subscribe bug is mostly an App Store Connect configuration issue — covered in the manual steps below.)

## Design
- New buttons/links match the existing clean white + gold DRIVE style. "Delete account" uses the existing red danger styling. Legal links are small, muted, tappable text.

## After I finish — your simple manual checklist (App Store Connect)

**A. Screenshots (2.3.3)** — Replace the 6.7-inch iPhone screenshots with real in-app screens (tasks list, progress/roadmap, your business plan, badges). Avoid splash/login-only shots. Path: App Store Connect → your app → the version → Previews and Screenshots → "View All Sizes in Media Manager".

**B. Paid content labelling (2.3.2)** — In the app description and screenshot captions, clearly state that premium features require a paid subscription (e.g. "Subscription required for full access").

**C. Terms of Use in metadata (3.1.2c)** — Add a Terms of Use (EULA) link in the App Description, and confirm the Privacy Policy URL is filled in the Privacy Policy field.

**D. Subscribe error (2.1b)** — In App Store Connect: confirm the Paid Apps Agreement is signed (Business section), make sure the subscription products are "Ready to Submit" with price/title filled in, and test once in the Sandbox.

**E. Resubmit** — Reply to Apple in Resolution Center with a screen recording showing: sign in → open Profile → tap Delete account → confirm deletion. Put that note in App Review Information → Notes.

I'll bump the build version and run a full build check before handing it back so it's ready to upload to TestFlight.