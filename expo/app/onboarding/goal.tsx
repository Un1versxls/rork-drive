import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Bot, Wrench } from "lucide-react-native";

import { OnboardingShell } from "@/components/OnboardingShell";
import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";
import { useApp } from "@/providers/AppProvider";
import type { PathChoice } from "@/types";

export default function GoalScreen() {
  const router = useRouter();
  const { state, setAnswers, setProfileField } = useApp();
  const [selected, setSelected] = useState<PathChoice | null>(state.profile.pathChoice);

  const onContinue = () => {
    if (!selected) return;
    const goal = selected === "ai" ? "ai_business" : "in_person_hustle";
    try {
      setProfileField("pathChoice", selected);
      setAnswers({ goal });
    } catch (e) {
      console.log("[goal] save failed", e);
    }
    requestAnimationFrame(() => {
      try {
        router.push("/onboarding/experience");
      } catch (e) {
        console.log("[goal] router.push failed", e);
      }
    });
  };

  return (
    <OnboardingShell
      step={2}
      total={11}
      title="What kind of business?"
      subtitle="Pick a path. We'll tailor everything from here."
      footer={
        <View style={styles.footerWrap}>
          <GradientButton
            title="Continue"
            disabled={!selected}
            onPress={onContinue}
            testID="cta-continue"
          />
          <Pressable
            onPress={() => router.push("/onboarding/sign-in")}
            hitSlop={10}
            style={styles.signInBtn}
            testID="goal-signin"
          >
            <Text style={styles.signInText}>
              Already have an account? <Text style={styles.signInLink}>Sign in</Text>
            </Text>
          </Pressable>
        </View>
      }
    >
      <View style={styles.cards}>
        <PathCard
          id="ai"
          title="AI Business"
          desc="Build something online with AI — automations, agencies, content."
          ageHint="Best for 17+"
          Icon={Bot}
          selected={selected === "ai"}
          onPress={() => setSelected("ai")}
        />
        <PathCard
          id="in_person"
          title="In-Person Hustle"
          desc="Make money locally — car washing, detailing, lawn care, etc."
          ageHint="Great for young teens"
          Icon={Wrench}
          selected={selected === "in_person"}
          onPress={() => setSelected("in_person")}
        />
      </View>
    </OnboardingShell>
  );
}

interface PathCardProps {
  id: PathChoice;
  title: string;
  desc: string;
  ageHint?: string;
  Icon: typeof Bot;
  selected: boolean;
  onPress: () => void;
}

function PathCard({ id, title, desc, ageHint, Icon, selected, onPress }: PathCardProps) {
  return (
    <Pressable
      onPress={onPress}
      testID={`opt-path-${id}`}
      style={({ pressed }) => [styles.card, selected && styles.cardOn, pressed && { opacity: 0.92 }]}
    >
      <View style={[styles.iconWrap, selected && styles.iconWrapOn]}>
        <Icon color={selected ? "#ffffff" : Colors.accentGold} size={26} strokeWidth={2.2} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDesc}>{desc}</Text>
      {ageHint ? (
        <View style={styles.agePill}>
          <Text style={styles.agePillText}>{ageHint}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cards: { gap: 14 },
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#eeeeee",
    backgroundColor: "#ffffff",
    padding: 22,
    gap: 8,
  },
  cardOn: {
    borderColor: Colors.text,
    backgroundColor: "#fafafa",
  },
  iconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: "rgba(212,175,55,0.12)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 6,
  },
  iconWrapOn: { backgroundColor: Colors.text },
  cardTitle: { color: Colors.text, fontSize: 20, fontWeight: "900", letterSpacing: -0.3 },
  cardDesc: { color: Colors.textDim, fontSize: 13, lineHeight: 19 },
  footerWrap: { gap: 8 },
  signInBtn: { alignSelf: "center", paddingVertical: 8, paddingHorizontal: 12 },
  signInText: { color: Colors.textDim, fontSize: 13, fontWeight: "600" },
  signInLink: { color: Colors.text, fontWeight: "800", textDecorationLine: "underline" },
  agePill: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
    backgroundColor: "rgba(212,175,55,0.10)",
    borderWidth: 1, borderColor: "rgba(212,175,55,0.30)",
  },
  agePillText: { color: Colors.accentDeep, fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },
});
