# Enable the purchase button so you can test subscriptions

## What changes

- Remove the "Payments unavailable" disabled state on the paywall button so it always lets you tap through to Apple's purchase sheet.
- Hide the "Payments pending App Store approval" banner.
- Keep the rest of the paywall (pricing, plan toggle, access-code option) exactly as it is.

## About testing on Expo Go

Real Apple subscription payments **will not work in Expo Go** — RevenueCat needs the native StoreKit module, which only exists in a real build (TestFlight or a dev build). In Expo Go you'll either see no offerings or get a "purchases not available" error when you tap the button.

To actually test payments you need to:
- Install the TestFlight build on a real iOS device, **or**
- Run a custom dev client build (not Expo Go).

Once you're on TestFlight, sign in with a Sandbox Apple ID under Settings → App Store → Sandbox Account, then tap the button to trigger Apple's purchase sheet.