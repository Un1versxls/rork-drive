import React, { useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Clock, DollarSign, Sparkles, Target, X } from "lucide-react-native";
import { z } from "zod";
import { generateObject } from "@rork-ai/toolkit-sdk";

import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";
import { useApp } from "@/providers/AppProvider";
import type { BusinessIdea, TaskSeed } from "@/types";

const TaskSeedSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.enum(["focus", "skill", "health", "growth", "mindset", "hustle"]),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

const CustomSchema = z.object({
  name: z.string(),
  tagline: z.string(),
  description: z.string(),
  whyFit: z.string(),
  startupCost: z.string(),
  timeToIncome: z.string(),
  firstMilestones: z.array(z.string()).min(3).max(5),
  taskPool: z.array(TaskSeedSchema).min(6).max(10),
});

export default function BuildBusinessScreen() {
  const router = useRouter();
  const { setBusiness } = useApp();

  const [name, setName] = useState<string>("");
  const [stage, setStage] = useState<string>("");
  const [revenue, setRevenue] = useState<string>("");
  const [goal, setGoal] = useState<string>("");
  const [biggestBlock, setBiggestBlock] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [generated, setGenerated] = useState<{ business: BusinessIdea; pool: TaskSeed[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(20)).current;

  const valid = name.trim().length > 1 && stage.trim().length > 1;

  const onGenerate = async () => {
    if (!valid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const prompt = `The user already runs a real business and wants DRIVE to generate a daily task plan tailored to it.

User's business:
- Name: ${name.trim()}
- Stage / what it does: ${stage.trim()}
${revenue.trim() ? `- Current monthly revenue: ${revenue.trim()}\n` : ""}${goal.trim() ? `- Their main goal right now: ${goal.trim()}\n` : ""}${biggestBlock.trim() ? `- Biggest blocker: ${biggestBlock.trim()}\n` : ""}
Return:
- name: keep their business name as-is (don't rename it)
- tagline: a punchy one-line tagline for their business
- description: 2 sentence summary of what their business does and where it's headed
- whyFit: 1-2 sentences on why their next 90 days look promising
- startupCost: keep this realistic for an EXISTING business (e.g. "Already running")
- timeToIncome: their realistic next-revenue-step (e.g. "2-4 weeks to next $1k")
- firstMilestones: 3-5 concrete milestones FOR THEIR EXISTING BUSINESS (not from scratch)
- taskPool: 6-8 daily tasks SPECIFIC to their business — title (action verb), description, category (focus/skill/health/growth/mindset/hustle), difficulty 1-3.`;

      const result = await generateObject({
        messages: [{ role: "user", content: prompt }],
        schema: CustomSchema,
      });

      const business: BusinessIdea = {
        id: `custom-${Date.now()}`,
        name: result.name || name.trim(),
        tagline: result.tagline,
        description: result.description,
        whyFit: result.whyFit,
        startupCost: result.startupCost,
        timeToIncome: result.timeToIncome,
        firstMilestones: result.firstMilestones,
      };
      const pool: TaskSeed[] = result.taskPool.map((t) => ({ ...t }));
      setBusiness(business, pool);
      setGenerated({ business, pool });

      fade.setValue(0);
      lift.setValue(20);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(lift, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    } catch (e) {
      console.log("[build-business] error", e);
      setError("Couldn't generate your plan. Try once more with a bit more detail.");
    } finally {
      setLoading(false);
    }
  };

  const onClose = () => {
    router.replace("/onboarding/goal");
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={14} style={styles.closeBtn} testID="bb-close">
            <X color={Colors.text} size={20} />
          </Pressable>
          <View style={styles.crumb}>
            <Sparkles color={Colors.accentGold} size={12} />
            <Text style={styles.crumbText}>YOUR BUSINESS</Text>
          </View>
          <View style={styles.closeBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!generated ? (
            <>
              <Text style={styles.h1}>Tell us about your business.</Text>
              <Text style={styles.sub}>
                We&apos;ll build a daily task plan tailored to where it actually is — not a generic side hustle.
              </Text>

              <Field
                label="Business name"
                placeholder="e.g. Northside Detail Co."
                value={name}
                onChangeText={setName}
              />
              <Field
                label="What does it do? Where is it now?"
                placeholder="Mobile car detailing in Austin. Solo, 3 clients/week."
                value={stage}
                onChangeText={setStage}
                multiline
              />
              <Field
                label="Current monthly revenue (optional)"
                placeholder="$0 / $500 / $4k / etc."
                value={revenue}
                onChangeText={setRevenue}
              />
              <Field
                label="Main goal right now (optional)"
                placeholder="Hit $5k/mo, hire first detailer, go full-time…"
                value={goal}
                onChangeText={setGoal}
                multiline
              />
              <Field
                label="Biggest blocker (optional)"
                placeholder="No leads, pricing, time, marketing…"
                value={biggestBlock}
                onChangeText={setBiggestBlock}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={{ height: 16 }} />
              <GradientButton
                title={loading ? "Building your plan…" : "Generate my plan"}
                onPress={onGenerate}
                disabled={!valid || loading}
                loading={loading}
                icon={loading ? <ActivityIndicator color="#ffffff" /> : undefined}
              />
              <Text style={styles.hint}>Takes about 10 seconds.</Text>
            </>
          ) : (
            <Animated.View style={{ opacity: fade, transform: [{ translateY: lift }] }}>
              <View style={styles.resultBadge}>
                <Sparkles color={Colors.accentGold} size={12} />
                <Text style={styles.resultBadgeText}>YOUR PLAN IS READY</Text>
              </View>
              <Text style={styles.resultName}>{generated.business.name}</Text>
              <Text style={styles.resultTag}>{generated.business.tagline}</Text>
              <Text style={styles.resultDesc}>{generated.business.description}</Text>

              <View style={styles.metaRow}>
                <MetaPill icon={<DollarSign size={12} color={Colors.accentDeep} />} text={generated.business.startupCost} />
                <MetaPill icon={<Clock size={12} color={Colors.accentDeep} />} text={generated.business.timeToIncome} />
              </View>

              <View style={styles.whyBox}>
                <View style={styles.whyHead}>
                  <Target size={12} color={Colors.accentGold} />
                  <Text style={styles.whyLabel}>WHY THIS PLAN FITS YOU</Text>
                </View>
                <Text style={styles.whyText}>{generated.business.whyFit}</Text>
              </View>

              <Text style={styles.milestonesLabel}>FIRST 90 DAYS</Text>
              <View style={styles.milestones}>
                {generated.business.firstMilestones.map((m, i) => (
                  <View key={i} style={styles.milestoneRow}>
                    <View style={styles.milestoneNum}>
                      <Text style={styles.milestoneNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.milestoneText}>{m}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {generated ? (
          <View style={styles.footer}>
            <GradientButton
              title="Create my tasks"
              variant="gold"
              onPress={() => router.push("/onboarding/apple-signin")}
              testID="bb-create-tasks"
            />
            <Pressable
              onPress={() => setGenerated(null)}
              hitSlop={10}
              style={styles.regenBtn}
            >
              <Text style={styles.regenText}>Tweak my answers</Text>
            </Pressable>
          </View>
        ) : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  multiline,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        style={[styles.input, multiline ? styles.inputMulti : null]}
        multiline={!!multiline}
        maxLength={multiline ? 220 : 80}
        autoCapitalize="sentences"
      />
    </View>
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
  root: { flex: 1, backgroundColor: "#ffffff" },
  safe: { flex: 1, paddingHorizontal: 22 },
  kav: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 6, paddingBottom: 12 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eeeeee",
  },
  crumb: { flexDirection: "row", alignItems: "center", gap: 6 },
  crumbText: { color: Colors.accentGold, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  scroll: { paddingBottom: 24, paddingTop: 8 },
  h1: { color: Colors.text, fontSize: 28, fontWeight: "900", letterSpacing: -0.5, lineHeight: 34 },
  sub: { color: Colors.textDim, fontSize: 15, marginTop: 8, marginBottom: 22, lineHeight: 21 },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { color: Colors.text, fontSize: 13, fontWeight: "800", marginBottom: 6 },
  input: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eeeeee",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
    fontWeight: "600",
  },
  inputMulti: { minHeight: 80, textAlignVertical: "top" },
  hint: { color: Colors.textMuted, fontSize: 12, textAlign: "center", marginTop: 12 },
  error: { color: Colors.danger, fontSize: 13, marginTop: 8, fontWeight: "600" },

  resultBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(212,175,55,0.12)", borderWidth: 1, borderColor: "rgba(212,175,55,0.4)" },
  resultBadgeText: { color: Colors.accentDeep, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  resultName: { color: Colors.text, fontSize: 30, fontWeight: "900", letterSpacing: -0.6, marginTop: 14 },
  resultTag: { color: Colors.accentDeep, fontSize: 14, fontWeight: "700", marginTop: 4 },
  resultDesc: { color: Colors.textDim, fontSize: 14, lineHeight: 21, marginTop: 12 },

  metaRow: { flexDirection: "row", gap: 8, marginTop: 14, flexWrap: "wrap" },
  metaPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(212,175,55,0.1)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: "rgba(212,175,55,0.3)" },
  metaPillText: { color: Colors.accentDeep, fontWeight: "800", fontSize: 11 },

  whyBox: { marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#eeeeee" },
  whyHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  whyLabel: { color: Colors.accentGold, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  whyText: { color: Colors.text, fontSize: 13, lineHeight: 20 },

  milestonesLabel: { color: Colors.textDim, fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginTop: 18, marginBottom: 10 },
  milestones: { gap: 8 },
  milestoneRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  milestoneNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.accentGold, alignItems: "center", justifyContent: "center", marginTop: 1 },
  milestoneNumText: { color: "#ffffff", fontWeight: "900", fontSize: 11 },
  milestoneText: { color: Colors.text, fontSize: 13, flex: 1, lineHeight: 19 },

  footer: { paddingBottom: 12, paddingTop: 10, gap: 6 },
  regenBtn: { alignSelf: "center", paddingVertical: 8 },
  regenText: { color: Colors.textDim, fontSize: 13, fontWeight: "700", textDecorationLine: "underline" },
});
