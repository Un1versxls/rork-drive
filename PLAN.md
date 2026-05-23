# Rebuild the age slider from scratch with a crash-proof design

## The problem

The current age slider is the source of the launch crash. It mixes a hand-rolled finger-tracking gesture, a looping auto-demo animation, and several animated effects (shadows, pulsing hint pill, knob glow) all sharing values across JS and native animation drivers. Even after two rounds of patching, the moment the cold-start redirect lands the user back on this screen, the tear-down + re-init race fires and the app dies before anything renders.

## What I'll build instead

A brand-new age slider built on the standard, battle-tested gesture library that the rest of the app already uses — no PanResponder, no auto-demo loop, no mixed animation drivers.

**Feel & interaction**

- A clean horizontal track with a single round knob you drag left and right.
- Big age number that updates live as you drag (e.g. "24 years old").
- Subtle haptic tick every time the number changes.
- A small static "Slide to set your age" hint underneath the track on first view — no pulsing, no looping animation.
- Min 13, max 65+, same as today.
- Tap anywhere on the track to jump the knob there instantly.

**Visuals**

- Same black-and-white aesthetic as the rest of onboarding.
- Filled portion of the track in solid black; unfilled in light grey.
- White knob with a black border and a soft static shadow (no animated shadow).
- A small descriptive card below ("Builder", "Early-career", etc.) that fades between states with a single safe opacity transition.

**Behavior**

- Continue button saves the age and moves to the next screen exactly like before.
- No auto-demo, no looping shimmer, no pulsing pill — these were the crash surface and aren't needed for usability.
- Safe against being navigated back to from any previous screen.

## Result

Same question, same data captured, same look-and-feel direction — but with all the fragile animation machinery removed. The launch crash goes away because the screen no longer contains the code path that triggers it.

Then ship it straight to TestFlight.