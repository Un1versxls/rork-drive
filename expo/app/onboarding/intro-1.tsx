import React from "react";
import { IntroSlide } from "@/components/IntroSlide";

export default function Intro1() {
  return (
    <IntroSlide
      index={0}
      total={4}
      showDots={false}
      next="/onboarding/used-apps"
      prev="/onboarding"
      title="Loved by 42,000+ people building something real."
      subtitle="DRIVE turns big goals into the right daily tasks — so you stop scrolling and start shipping."
    />
  );
}
