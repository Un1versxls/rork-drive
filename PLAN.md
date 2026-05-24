# Update 2.5 — multi-page "What's New" + limited-time badge promo

## Multi-page showcase template

- ShowcaseUpdate now supports `pages: ShowcasePage[]` with per-page variant
  (`ai-coach` or `badge-promo`), headline, body, eyebrow ("UPDATE 2.5"), and
  CTA copy.
- Each page enforces a **5-second hold** before the user can advance.
  Visualized as a progress fill inside the CTA button (left-to-right).
- Page 1 (`ai-coach`) reuses the existing Ask-the-Coach phone-mockup
  animation. Page 2 (`badge-promo`) shows an animated trophy / badge
  shower preview of the limited-time offer.
- On the final page the CTA dismisses and routes to `/badges` so the user
  lands on the offer screen.

## Limited-time offer (badges page)

- Banner pinned at the top of the Badge Room: "Collect every badge
  (except Membership) by ⌛ → 1 free month of Premium."
- Gold gradient with countdown pill and trophy icon.

## Notification queue

- Only one overlay at a time. RatePrompt is gated while the current
  showcase has not been dismissed (`profile.lastShowcaseSeen !==
  currentShowcase.id`) and while the BadgeToast is on screen.
- `BadgeToast` only triggers for badges flagged `important: true`. The
  rest still unlock silently in state and show up on the badges page.
- Tapping a BadgeToast routes to `/badges`.

## Update 2.5 first-launch behavior

- The 2.5 showcase shows on the **first** dashboard open after the
  tutorial (no longer deferred to the second launch). Subsequent
  releases can opt into either behavior via `showOnFirstLaunch`.

## Reusable template

When the user asks for "create an update 2.1" (or similar), copy the
2.5 entry, bump the id + eyebrow + headline, swap the first page's
content to the most prominent new feature (always with at least one
animation variant), and append additional pages for other recent
features.

## Delivery

- Bump app to **2.5.0** and push to TestFlight.
