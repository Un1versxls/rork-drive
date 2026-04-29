import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, Clock, DollarSign, Sparkles, Target } from "lucide-react-native";

import { OnboardingShell } from "@/components/OnboardingShell";
import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";
import { useApp } from "@/providers/AppProvider";
import type { BusinessIdea, TaskSeed } from "@/types";

export default function BusinessScreen() {
  const router = useRouter();
  const { setBusiness } = useApp();
  const params = useLocalSearchParams<{ payload?: string }>();

  const data = useMemo<{ ideas: BusinessIdea[]; pools: TaskSeed[][] } | null>(() => {
    try {
      if (!params.payload) return null;
      return JSON.parse(params.payload);
    } catch {
      return null;
    }
  }, [params.payload]);

  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  if (!data) {
    return (
      <OnboardingShell
        step={11}
        total={11}
        title="Pick your business"
        footer={<GradientButton title="Retry" onPress={() => router.replace("/onboarding/match")} />}
      >
        <Text style={styles.empty}>Something went wrong matching you. Let&apos;s try again.</Text>
      </OnboardingShell>
    );
  }

  const { ideas, pools } = data;

  return (
    <OnboardingShell
      step={11}
      total={11}
      title="Pick your business"
      subtitle="3 matches for you. Choose one — switch anytime."
      footer={
        <GradientButton
          title="Start with this one"
          onPress={() => {
            setBusiness(ideas[selectedIdx], pools[selectedIdx]);
            router.push("/onboarding/plan-summary");
          }}
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {ideas.map((idea, idx) => {
          const selected = idx === selectedIdx;
          return (
            <Pressable
              key={idea.id + idx}
              onPress={() => setSelectedIdx(idx)}
              style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && styles.pressed]}
            >
              <View style={styles.topRow}>
                <View style={[styles.badge, selected && styles.badgeSelected]}>
                  <Sparkles size={11} color={selected ? "#faf9f6" : Colors.accentDeep} />
                  <Text style={[styles.badgeText, selected && styles.badgeTextSelected]}>MATCH {idx + 1}</Text>
                </View>
                <View style={[styles.radio, selected && styles.radioOn]}>
                  {selected ? <Check color="#faf9f6" size={14} strokeWidth={3} /> : null}
                </View>
              </View>

              <Text style={styles.name}>{idea.name}</Text>
              <Text style={styles.tagline}>{idea.tagline}</Text>

              <Text style={styles.desc}>{idea.description}</Text>

              <View style={styles.metaRow}>
                <MetaPill icon={<DollarSign size={12} color={Colors.accentDeep} />} text={idea.startupCost} />
                <MetaPill icon={<Clock size={12} color={Colors.accentDeep} />} text={idea.timeToIncome} />
              </View>

              <View style={styles.whyBox}>
                <View style={styles.whyHead}>
                  <Target size={12} color={Colors.accent} />
                  <Text style={styles.whyLabel}>WHY IT FITS YOU</Text>
                </View>
                <Text style={styles.whyText}>{idea.whyFit}</Text>
              </View>

              <Text style={styles.milestonesLabel}>FIRST MILESTONES</Text>
              <View style={styles.milestones}>
                {idea.firstMilestones.map((m, i) => (
                  <View key={i} style={styles.milestoneRow}>
                    <View style={styles.milestoneNum}>
                      <Text style={styles.milestoneNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.milestoneText}>{m}</Text>
                  </View>
                ))}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </OnboardingShell>
  );
}

function MetaPill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.metaPill}>
      {icon}
      <Text style={styles.metaPillText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 20 },
  empty: { color: Colors.textDim, fontSize: 15 },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cardBg,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardSelected: {
    borderColor: Colors.accent,
    backgroundColor: "#fdfbf6",
    shadowColor: Colors.accent,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  pressed: { opacity: 0.96, transform: [{ scale: 0.997 }] },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  badge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: Colors.accentDim, borderWidth: 1, borderColor: Colors.borderStrong },
  badgeSelected: { backgroundColor: Colors.accentDeep, borderColor: Colors.accentDeep },
  badgeText: { color: Colors.accentDeep, fontWeight: "900", fontSize: 10, letterSpacing: 1 },
  badgeTextSelected: { color: "#faf9f6" },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  radioOn: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  name: { color: Colors.text, fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  tagline: { color: Colors.accentDeep, fontSize: 13, fontWeight: "700", marginTop: 4 },
  desc: { color: Colors.textDim, fontSize: 14, lineHeight: 20, marginTop: 10 },
  metaRow: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" },
  metaPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: Colors.accentDim, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: Colors.borderStrong },
  metaPillText: { color: Colors.accentDeep, fontWeight: "800", fontSize: 11 },
  whyBox: { marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: Colors.bgAlt, borderWidth: 1, borderColor: Colors.border },
  whyHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  whyLabel: { color: Colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  whyText: { color: Colors.text, fontSize: 13, lineHeight: 19 },
  milestonesLabel: { color: Colors.textDim, fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginTop: 16, marginBottom: 8 },
  milestones: { gap: 8 },
  milestoneRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  milestoneNum: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.accent, alignItems: "center", justifyContent: "center", marginTop: 1 },
  milestoneNumText: { color: "#faf9f6", fontWeight: "900", fontSize: 11 },
  milestoneText: { color: Colors.text, fontSize: 13, flex: 1, lineHeight: 19 },
});
