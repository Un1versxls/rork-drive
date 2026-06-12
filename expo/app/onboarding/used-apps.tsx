import React, { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Check, X } from "lucide-react-native";

import { OnboardingStory } from "@/components/OnboardingStory";
import { Colors } from "@/constants/colors";

type Answer = "yes" | "no";

/**
 * Cal AI–style branching question. If the user has NOT used productivity apps,
 * we first show them why such apps help (the bar graph) before the DRIVE
 * comparison. If they HAVE, we jump straight to why DRIVE beats the rest.
 */
export default function UsedAppsScreen() {
  const router = useRouter();
  const [answer, setAnswer] = useState<Answer | null>(null);
  const lock = useRef<boolean>(false);

  const onContinue = () => {
    if (!answer || lock.current) return;
    lock.current = true;
    const next = answer === "no" ? "/onboarding/why-apps" : "/onboarding/why-drive";
    requestAnimationFrame(() => {
      try { router.push(next); } catch (e) { console.log("[used-apps] nav failed", e); lock.current = false; }
    });
  };

  return (
    <OnboardingStory
      eyebrow="QUICK QUESTION"
      title={"Have you used a\nproductivity app before?"}
      subtitle="Be honest — it helps us show you the right thing next."
      prev="/onboarding/intro-1"
      ctaTitle="Continue"
      onContinue={onContinue}
    >
      <View style={styles.options}>
        <Choice
          label="No, this is new to me"
          sub="I've mostly tried to stay on track on my own."
          Icon={X}
          selected={answer === "no"}
          onPress={() => setAnswer("no")}
        />
        <Choice
          label="Yes, I've used some"
          sub="Notion, Todoist, Habitica, calendars… you name it."
          Icon={Check}
          selected={answer === "yes"}
          onPress={() => setAnswer("yes")}
        />
      </View>
    </OnboardingStory>
  );
}

function Choice({
  label,
  sub,
  Icon,
  selected,
  onPress,
}: {
  label: string;
  sub: string;
  Icon: React.ComponentType<{ color: string; size: number; strokeWidth?: number }>;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, selected && styles.cardOn, pressed && { opacity: 0.92 }]}>
      <View style={[styles.iconWrap, selected && styles.iconWrapOn]}>
        <Icon color={selected ? "#ffffff" : Colors.accentGold} size={20} strokeWidth={3} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardSub}>{sub}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  options: { gap: 14 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#eeeeee",
    backgroundColor: "#ffffff",
  },
  cardOn: { borderColor: Colors.text, backgroundColor: "#fafafa" },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "rgba(212,175,55,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapOn: { backgroundColor: Colors.text },
  cardLabel: { color: Colors.text, fontSize: 16, fontWeight: "900", letterSpacing: -0.2 },
  cardSub: { color: Colors.textDim, fontSize: 13, lineHeight: 18, marginTop: 3 },
});
