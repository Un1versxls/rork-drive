import React, { useState } from "react";
import { ActivityIndicator, Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Crown, Lock, Sparkles, TrendingUp } from "lucide-react-native";
import { useRouter } from "expo-router";
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

export default function CustomScreen() {
  const router = useRouter();
  const { isPremium, setBusiness, state } = useApp();
  const [idea, setIdea] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const onGenerate = async () => {
    if (!idea.trim()) return;
    setLoading(true);
    try {
      const prompt = `The user wants to build their OWN business / project. Take their idea and turn it into a structured business plan + 6-8 daily tasks.

User's idea: "${idea.trim()}"

Return: name (2-5 words), tagline, description (2 sentences), whyFit (why it works for them), startupCost (e.g. "$0-$200"), timeToIncome (e.g. "2-4 weeks"), firstMilestones (3-5 concrete milestones), taskPool (6-8 tasks with title, description, category one of focus/skill/health/growth/mindset/hustle, difficulty 1-3). Tasks must be specific to THIS idea.`;

      const result = await generateObject({
        messages: [{ role: "user", content: prompt }],
        schema: CustomSchema,
      });

      const business: BusinessIdea = {
        id: `custom-${Date.now()}`,
        name: result.name,
        tagline: result.tagline,
        description: result.description,
        whyFit: result.whyFit,
        startupCost: result.startupCost,
        timeToIncome: result.timeToIncome,
        firstMilestones: result.firstMilestones,
      };
      const pool: TaskSeed[] = result.taskPool.map((t) => ({ ...t }));
      setBusiness(business, pool);
      Alert.alert("Done!", "Your custom business is live. Check Tasks tomorrow for your first day.");
      router.push("/(tabs)/tasks");
    } catch (e) {
      console.log("[custom]", e);
      Alert.alert("Something went wrong", "Try a clearer idea and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isPremium) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.lockedCard}>
            <View style={styles.crownBadge}>
              <Crown color="#ffffff" size={18} />
            </View>
            <Text style={styles.lockedTitle}>Build your own business.</Text>
            <Text style={styles.lockedSub}>
              Type your idea. DRIVE generates a custom daily task plan that actually moves it forward.
            </Text>

            <View style={styles.previewCard}>
              <Lock color={Colors.textMuted} size={16} />
              <Text style={styles.previewText}>Locked — upgrade to Premium</Text>
            </View>

            <View style={styles.bullets}>
              <Bullet text="Turn ANY idea into a roadmap" />
              <Bullet text="AI-generated daily tasks that fit your life" />
              <Bullet text="Included with Premium ($35/mo or $390/yr)" />
            </View>

            <GradientButton
              title="Upgrade to Premium"
              variant="gold"
              onPress={() => router.push({ pathname: "/onboarding/paywall", params: { fromUpgrade: "1" } })}
            />
          </View>

          <View style={styles.proofHeader}>
            <TrendingUp color={Colors.accentGold} size={14} />
            <Text style={styles.proofHeaderText}>REAL BUILDS FROM PREMIUM USERS</Text>
          </View>

          <ResultCard
            uri="https://images.unsplash.com/photo-1556745753-b2904692b3cd?w=800&q=80"
            headline="$8,240 / mo"
            sub="DTC coffee brand"
            tilt="-6deg"
            stat1="+$1.2k week 1"
            stat2="90 days"
          />
          <ResultCard
            uri="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&q=80"
            headline="$4,100 / mo"
            sub="AI coaching app"
            tilt="5deg"
            stat1="300 users"
            stat2="6 weeks"
          />
          <ResultCard
            uri="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80"
            headline="$12,500 / mo"
            sub="B2B agency"
            tilt="-4deg"
            stat1="3 clients"
            stat2="4 months"
          />

          <Text style={styles.proofFoot}>Unlock Premium to build yours.</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.h1}>Build your own</Text>
        <Text style={styles.sub}>Tell us what you want to build. We&apos;ll handle the daily tasks.</Text>

        <TextInput
          value={idea}
          onChangeText={setIdea}
          placeholder="e.g. I want to build an app that helps Gen Z budget money"
          placeholderTextColor={Colors.textMuted}
          multiline
          style={styles.input}
          maxLength={400}
        />

        {state.profile.business && state.profile.business.id.startsWith("custom-") ? (
          <View style={styles.currentCard}>
            <View style={styles.currentHead}>
              <Sparkles color={Colors.accentGold} size={14} />
              <Text style={styles.currentLabel}>CURRENT CUSTOM BUSINESS</Text>
            </View>
            <Text style={styles.currentName}>{state.profile.business.name}</Text>
            <Text style={styles.currentTag}>{state.profile.business.tagline}</Text>
          </View>
        ) : null}

        <View style={{ height: 16 }} />
        <GradientButton
          title={loading ? "Generating your plan…" : "Generate my plan"}
          onPress={onGenerate}
          disabled={!idea.trim() || loading}
          loading={loading}
          icon={loading ? <ActivityIndicator color="#ffffff" /> : undefined}
        />
        <Text style={styles.hint}>
          This replaces your current business. Your streak is kept.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ResultCard({ uri, headline, sub, tilt, stat1, stat2 }: { uri: string; headline: string; sub: string; tilt: string; stat1: string; stat2: string }) {
  const tiltNeg = tilt.startsWith("-") ? tilt.slice(1) : `-${tilt}`;
  return (
    <View style={styles.resultCard}>
      <Image source={{ uri }} style={styles.resultImage} resizeMode="cover" />
      <View style={styles.resultOverlay} />
      <View style={[styles.diagonalLeft, { transform: [{ rotate: tilt }] }]}>
        <Text style={styles.diagonalText}>{stat1}</Text>
      </View>
      <View style={[styles.diagonalRight, { transform: [{ rotate: tiltNeg }] }]}>
        <Text style={styles.diagonalTextAlt}>{stat2}</Text>
      </View>
      <View style={styles.resultCaption}>
        <Text style={styles.resultHeadline}>{headline}</Text>
        <Text style={styles.resultSub}>{sub}</Text>
      </View>
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bullet}>
      <View style={styles.bulletDot} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  scroll: { padding: 20, paddingBottom: Platform.OS === "ios" ? 140 : 120 },
  h1: { color: Colors.text, fontSize: 30, fontWeight: "900", letterSpacing: -0.5 },
  sub: { color: Colors.textDim, fontSize: 15, marginTop: 8, marginBottom: 20, lineHeight: 21 },
  input: { backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#eeeeee", borderRadius: 16, padding: 18, fontSize: 16, minHeight: 140, textAlignVertical: "top", color: Colors.text },

  lockedCard: { padding: 24, borderRadius: 22, backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#eeeeee", alignItems: "flex-start" },
  crownBadge: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.accentGold, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  lockedTitle: { color: Colors.text, fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  lockedSub: { color: Colors.textDim, fontSize: 15, marginTop: 8, lineHeight: 22 },
  previewCard: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 18, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#eeeeee", alignSelf: "stretch" },
  previewText: { color: Colors.textMuted, fontSize: 13, fontWeight: "700" },
  bullets: { gap: 10, marginTop: 20, marginBottom: 24, alignSelf: "stretch" },
  bullet: { flexDirection: "row", alignItems: "center", gap: 10 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accentGold },
  bulletText: { color: Colors.text, fontSize: 14, fontWeight: "600" },

  currentCard: { marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#eeeeee" },
  currentHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  currentLabel: { color: Colors.accentGold, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  currentName: { color: Colors.text, fontSize: 16, fontWeight: "900", marginTop: 6 },
  currentTag: { color: Colors.textDim, fontSize: 13, marginTop: 2 },

  hint: { color: Colors.textMuted, fontSize: 12, textAlign: "center", marginTop: 10 },

  proofHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 28, marginBottom: 12, paddingHorizontal: 4 },
  proofHeaderText: { color: Colors.accentGold, fontSize: 10, fontWeight: "900", letterSpacing: 1.6 },
  resultCard: { height: 180, borderRadius: 20, overflow: "hidden", backgroundColor: "#111111", marginBottom: 12, position: "relative" },
  resultImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%", opacity: 0.55 },
  resultOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)" },
  diagonalLeft: { position: "absolute", top: 16, left: -20, backgroundColor: Colors.accentGold, paddingHorizontal: 18, paddingVertical: 5 },
  diagonalRight: { position: "absolute", bottom: 18, right: -20, backgroundColor: "#ffffff", paddingHorizontal: 18, paddingVertical: 5 },
  diagonalText: { color: "#111111", fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  diagonalTextAlt: { color: "#111111", fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  resultCaption: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16 },
  resultHeadline: { color: "#ffffff", fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  resultSub: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600", marginTop: 2 },
  proofFoot: { color: Colors.textMuted, fontSize: 11, textAlign: "center", marginTop: 8, marginBottom: 10, fontStyle: "italic" },
});
