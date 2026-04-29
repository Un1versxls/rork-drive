import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Check, Crown, Sparkles } from "lucide-react-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { PurchasesOffering, PurchasesPackage } from "react-native-purchases";

import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";
import { useApp } from "@/providers/AppProvider";
import { useAuth } from "@/providers/AuthProvider";
import { submitSurveyResponse } from "@/lib/surveyTracking";
import { upsertAppUser } from "@/lib/appUserTracking";
import { PLANS, priceFor, monthlyEquivalent, yearlySavings } from "@/constants/plans";
import { configurePurchases, getOfferings, purchasePackage, hasActiveEntitlement } from "@/lib/purchases";
import type { BillingCycle, BusinessIdea, PlanId, SkillTopic, TaskSeed } from "@/types";

const SKILL_LABELS: Record<SkillTopic, string> = {
  code: "Code",
  business: "Business",
  marketing: "Marketing",
  design: "Design",
  content: "Content & Writing",
  languages: "Languages",
  speaking: "Public Speaking",
  finance: "Personal Finance",
};

const SKILL_TASKS: Record<SkillTopic, TaskSeed[]> = {
  code: [
    { title: "Build one tiny feature", description: "Write code for a small piece of a real project today.", category: "skill", difficulty: 2 },
    { title: "Read 10 mins of docs", description: "Pick a tool you use and dig into its docs.", category: "skill", difficulty: 1 },
    { title: "Solve one practice problem", description: "LeetCode, codewars, or rebuild something from scratch.", category: "skill", difficulty: 3 },
    { title: "Refactor your worst file", description: "Take 15 minutes to clean up something messy you wrote.", category: "focus", difficulty: 2 },
    { title: "Ship a commit", description: "Anything — just push code today.", category: "hustle", difficulty: 1 },
    { title: "Read someone else's code", description: "Pick an open-source repo and read for 10 minutes.", category: "mindset", difficulty: 1 },
  ],
  business: [
    { title: "Study one great company", description: "Pick a company and figure out exactly how they make money.", category: "skill", difficulty: 2 },
    { title: "Negotiate something small", description: "A bill, a price, a deadline — practice the skill.", category: "hustle", difficulty: 3 },
    { title: "Write a 1-page strategy", description: "Pick a problem, draft how you'd solve it as an operator.", category: "focus", difficulty: 2 },
    { title: "Read 10 mins on leadership", description: "Article, podcast, or book on leading people.", category: "skill", difficulty: 1 },
    { title: "Map your network", description: "List 5 people you should reach out to this month.", category: "growth", difficulty: 1 },
    { title: "Reflect on a decision", description: "Write what you'd do differently next time.", category: "mindset", difficulty: 1 },
  ],
  marketing: [
    { title: "Write 5 hooks", description: "Punchy opening lines for posts, ads or emails.", category: "skill", difficulty: 2 },
    { title: "Study a viral post", description: "Break down structure, hook, and emotion.", category: "skill", difficulty: 1 },
    { title: "Post one thing publicly", description: "Tweet, short, or reel — ship it.", category: "hustle", difficulty: 2 },
    { title: "Audit a brand", description: "Pick a brand you like and write 3 things they nail.", category: "growth", difficulty: 2 },
    { title: "Draft an email", description: "Write a short marketing email someone would actually open.", category: "focus", difficulty: 2 },
    { title: "Track one metric", description: "Pick one number that matters and check on it.", category: "mindset", difficulty: 1 },
  ],
  design: [
    { title: "Redesign one screen", description: "Take an app screen and make a better version in Figma.", category: "skill", difficulty: 3 },
    { title: "Copy a great UI", description: "Pixel-clone something you admire to learn the moves.", category: "skill", difficulty: 2 },
    { title: "Daily UI prompt", description: "15 mins on one Daily UI challenge.", category: "focus", difficulty: 1 },
    { title: "Refine your typography", description: "Pick one project and fix the type system.", category: "skill", difficulty: 2 },
    { title: "Save 3 inspirations", description: "Build your taste — collect refs that hit you.", category: "growth", difficulty: 1 },
    { title: "Get a critique", description: "Share work and ask for one piece of feedback.", category: "mindset", difficulty: 2 },
  ],
  content: [
    { title: "Write 200 words", description: "On anything — the reps build the muscle.", category: "skill", difficulty: 1 },
    { title: "Outline one piece", description: "Headline, hook, 3 beats, CTA.", category: "focus", difficulty: 2 },
    { title: "Edit ruthlessly", description: "Cut 20% from something you've written.", category: "skill", difficulty: 2 },
    { title: "Study a great writer", description: "Read 10 mins of someone you want to write like.", category: "mindset", difficulty: 1 },
    { title: "Publish a draft", description: "Hit post on something imperfect.", category: "hustle", difficulty: 3 },
    { title: "Steal one structure", description: "Borrow a hook or format and remix it for your topic.", category: "growth", difficulty: 1 },
  ],
  languages: [
    { title: "15 mins of practice", description: "App, flashcards, or a podcast in your target language.", category: "skill", difficulty: 1 },
    { title: "Learn 10 new words", description: "Real ones you'd actually use in conversation.", category: "skill", difficulty: 2 },
    { title: "Speak out loud", description: "5 minutes describing your day in the new language.", category: "hustle", difficulty: 2 },
    { title: "Watch with subs", description: "10 mins of TV or YouTube in your target language.", category: "mindset", difficulty: 1 },
    { title: "Write 3 sentences", description: "Journal a few lines about today.", category: "focus", difficulty: 1 },
    { title: "Find a partner", description: "Message someone to chat or swap languages.", category: "growth", difficulty: 2 },
  ],
  speaking: [
    { title: "Record a 60-sec take", description: "Talk about one idea on camera, no edits.", category: "skill", difficulty: 2 },
    { title: "Study a great talk", description: "Watch 10 mins of a speaker you admire — note their moves.", category: "skill", difficulty: 1 },
    { title: "Practice one story", description: "Tell a 90-second story out loud, twice.", category: "focus", difficulty: 2 },
    { title: "Drill your filler words", description: "Speak for 2 mins without 'um' or 'like'.", category: "skill", difficulty: 3 },
    { title: "Write your hook", description: "Draft an opening line that earns attention.", category: "growth", difficulty: 1 },
    { title: "Pitch a friend", description: "Give your elevator pitch and ask for honest feedback.", category: "hustle", difficulty: 2 },
  ],
  finance: [
    { title: "Track every dollar", description: "Log today's spending honestly.", category: "focus", difficulty: 1 },
    { title: "Read 10 mins on money", description: "Article, chapter or essay about finance.", category: "skill", difficulty: 1 },
    { title: "Review a subscription", description: "Audit one recurring charge — keep or kill.", category: "hustle", difficulty: 1 },
    { title: "Run a 5-yr projection", description: "Quick napkin math on saving + investing.", category: "skill", difficulty: 3 },
    { title: "Auto-invest something", description: "Even $5. Build the habit, not the size.", category: "growth", difficulty: 2 },
    { title: "Write your money goal", description: "One number you want to hit by year-end.", category: "mindset", difficulty: 1 },
  ],
};

function crashCourseFor(topic: SkillTopic | null): { idea: BusinessIdea; pool: TaskSeed[] } {
  const t: SkillTopic = topic ?? "code";
  const label = SKILL_LABELS[t];
  const idea: BusinessIdea = {
    id: `crashcourse-${t}`,
    name: `${label} Crash Course`,
    tagline: `Daily reps to actually learn ${label.toLowerCase()}`,
    description: `A focused daily plan that turns ${label.toLowerCase()} from a topic you read about into a skill you actually own. Small reps, every day.`,
    whyFit: `You picked ${label.toLowerCase()} — these tasks are tuned to compound week over week.`,
    startupCost: "Free",
    timeToIncome: "Skill > income",
    firstMilestones: [
      "Finish your first 7 days without skipping",
      "Hit a 14-day streak",
      "Ship something you can show someone",
      "Teach what you learned in your own words",
    ],
  };
  return { idea, pool: SKILL_TASKS[t] };
}

type PkgMap = {
  base_monthly?: PurchasesPackage;
  base_yearly?: PurchasesPackage;
  premium_monthly?: PurchasesPackage;
  premium_yearly?: PurchasesPackage;
};

export default function PaywallScreen() {
  const router = useRouter();
  const { state, startSubscription, resetOnboarding, setBusiness } = useApp();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ retry?: string; fromUpgrade?: string; initialPlan?: string; initialCycle?: string }>();
  const retry = params.retry === "1";
  const fromUpgrade = params.fromUpgrade === "1";

  const [planId, setPlanId] = useState<PlanId>(params.initialPlan === "premium" ? "premium" : "base");
  const [cycle, setCycle] = useState<BillingCycle>(params.initialCycle === "monthly" ? "monthly" : "yearly");

  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0];

  useEffect(() => {
    configurePurchases();
  }, []);

  const offeringsQuery = useQuery({
    queryKey: ["rc-offerings"],
    queryFn: async (): Promise<PurchasesOffering | null> => {
      return getOfferings();
    },
    enabled: Platform.OS !== "web",
    staleTime: 5 * 60 * 1000,
  });

  const pkgs: PkgMap = React.useMemo(() => {
    const off = offeringsQuery.data;
    if (!off) return {};
    const out: PkgMap = {};
    for (const p of off.availablePackages) {
      const k = p.identifier;
      if (k === "base_monthly" || k === "$rc_monthly" && planId === "base") out.base_monthly = p;
      if (k === "base_yearly") out.base_yearly = p;
      if (k === "premium_monthly") out.premium_monthly = p;
      if (k === "premium_yearly") out.premium_yearly = p;
    }
    return out;
  }, [offeringsQuery.data, planId]);

  const currentPkg: PurchasesPackage | undefined =
    planId === "base"
      ? cycle === "yearly" ? pkgs.base_yearly : pkgs.base_monthly
      : cycle === "yearly" ? pkgs.premium_yearly : pkgs.premium_monthly;

  const storePrice = currentPkg?.product?.priceString;
  const fallbackPrice = cycle === "yearly"
    ? `$${priceFor(plan, "yearly").toFixed(2)} / year`
    : `$${plan.monthlyPrice.toFixed(2)} / month`;

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      if (Platform.OS === "web") {
        return { ok: true as const };
      }
      if (!currentPkg) {
        throw new Error("Subscription not available. Please try again.");
      }
      const info = await purchasePackage(currentPkg);
      const entKey: "base" | "premium" = planId;
      const ok = hasActiveEntitlement(info, entKey);
      return { ok };
    },
    onSuccess: (res) => {
      if (res.ok) {
        startSubscription(planId, cycle);
        if (state.profile.email) {
          submitSurveyResponse(state.profile, state.profile.email, user?.id ?? null).catch(() => {});
        }
        upsertAppUser({
          appleUserId: state.profile.appleUserId ?? null,
          email: state.profile.email || null,
          name: state.profile.name || null,
          subscription: {
            plan: planId,
            cycle,
            active: true,
            trial: true,
            source: "trial",
            startedAt: new Date().toISOString(),
          },
        }).catch((e) => console.log("[paywall] app_users", e));
        if (fromUpgrade) {
          if (router.canGoBack()) router.back();
          else router.replace("/(tabs)/tasks");
          return;
        }
        const goal = state.profile.goal;
        if (goal === "earn_income") {
          router.replace("/onboarding/match");
        } else {
          if (goal === "build_skills") {
            const cc = crashCourseFor(state.profile.skillTopic);
            setBusiness(cc.idea, cc.pool);
          }
          router.replace("/onboarding/complete");
        }
      } else {
        Alert.alert("Payment not completed", "We couldn't verify your subscription. Try again.");
      }
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Purchase failed";
      const isCancel = msg.toLowerCase().includes("cancel");
      if (!isCancel) {
        Alert.alert("Purchase failed", msg);
      }
      console.log("[paywall] purchase error", err);
    },
  });

  const onStart = () => {
    if (Platform.OS === "web") {
      startSubscription(planId, cycle);
      upsertAppUser({
        appleUserId: state.profile.appleUserId ?? null,
        email: state.profile.email || null,
        name: state.profile.name || null,
        subscription: {
          plan: planId,
          cycle,
          active: true,
          trial: true,
          source: "trial",
          startedAt: new Date().toISOString(),
        },
      }).catch((e) => console.log("[paywall] app_users web", e));
      if (fromUpgrade) {
        if (router.canGoBack()) router.back();
        else router.replace("/(tabs)/tasks");
        return;
      }
      const goal = state.profile.goal;
      if (goal === "earn_income") {
        router.replace("/onboarding/match");
      } else {
        if (goal === "build_skills") {
          const cc = crashCourseFor(state.profile.skillTopic);
          setBusiness(cc.idea, cc.pool);
        }
        router.replace("/onboarding/complete");
      }
      return;
    }
    purchaseMutation.mutate();
  };

  const onDecline = () => {
    if (fromUpgrade) {
      if (router.canGoBack()) router.back();
      else router.replace("/(tabs)/tasks");
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace("/onboarding/goal");
  };

  const loadingPkgs = Platform.OS !== "web" && offeringsQuery.isLoading;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <Pressable onPress={onDecline} hitSlop={16} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>{retry ? "ONE MORE LOOK" : "LAST STEP"}</Text>
          <Text style={styles.title}>
            {planId === "premium"
              ? "Unlock Premium."
              : retry
              ? "Your first 3 days\nare on us."
              : "We want you to\ntry it free."}
          </Text>
          <Text style={styles.subtitle}>
            {planId === "premium"
              ? "Full access to big-money ideas. Cancel anytime."
              : "3 days free. Cancel anytime. No charge until the trial ends."}
          </Text>

          <View style={styles.planSwitcher}>
            <PlanToggle
              label="Base"
              sub="$50 – $1,500/mo ideas"
              selected={planId === "base"}
              onPress={() => setPlanId("base")}
            />
            <PlanToggle
              label="Premium"
              sub="$1,500 – $10k ideas"
              selected={planId === "premium"}
              onPress={() => setPlanId("premium")}
              tag="BEST"
            />
          </View>

          <View style={styles.cycles}>
            <CycleCard
              cycle="yearly"
              selected={cycle === "yearly"}
              onPress={() => setCycle("yearly")}
              headline={`${priceFor(plan, "yearly").toFixed(2)} / year`}
              sub={yearlySavings(plan) > 0
                ? `Just ${monthlyEquivalent(plan, "yearly").toFixed(2)}/mo — save ${yearlySavings(plan).toFixed(2)}`
                : `Just ${monthlyEquivalent(plan, "yearly").toFixed(2)}/mo`}
              savings="BEST VALUE"
            />
            <CycleCard
              cycle="monthly"
              selected={cycle === "monthly"}
              onPress={() => setCycle("monthly")}
              headline={`$${plan.monthlyPrice.toFixed(2)} / month`}
              sub="Auto-renews monthly"
            />
          </View>

          <View style={styles.perks}>
            {planId === "premium" ? (
              <View style={styles.premiumBanner}>
                <Crown size={14} color="#ffffff" />
                <Text style={styles.premiumBannerText}>
                  For people actually trying to make real money.
                </Text>
              </View>
            ) : null}
            {plan.perks.map((p) => (
              <View key={p} style={styles.perkRow}>
                <View style={styles.perkCheck}>
                  <Check size={12} color="#ffffff" strokeWidth={3} />
                </View>
                <Text style={styles.perkText}>{p}</Text>
              </View>
            ))}
            {planId === "base" ? (
              <Pressable onPress={() => setPlanId("premium")} style={styles.teaser}>
                <Sparkles size={14} color={Colors.accentGold} />
                <Text style={styles.teaserText}>
                  Want big-money ideas ($1.5k–$10k) + custom business builder? Tap to see Premium.
                </Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <GradientButton
            title={
              purchaseMutation.isPending
                ? "Opening Apple…"
                : planId === "premium"
                ? "Unlock Premium"
                : "Start 3-day free trial"
            }
            variant="gold"
            onPress={onStart}
            disabled={purchaseMutation.isPending}
            testID="cta-start-trial"
          />
          <Text style={styles.legal}>
            {loadingPkgs ? (
              "Loading…"
            ) : (
              <>
                {planId === "premium" ? (
                  <>
                    {storePrice ?? fallbackPrice} {cycle === "yearly" ? "/ yr" : "/ mo"} billed through Apple. Cancel anytime.
                  </>
                ) : (
                  <>
                    3 days free, then {storePrice ?? fallbackPrice} {cycle === "yearly" ? "/ yr" : "/ mo"} through Apple. Cancel anytime.
                  </>
                )}
              </>
            )}
          </Text>
          {purchaseMutation.isPending ? (
            <ActivityIndicator size="small" color={Colors.textDim} />
          ) : null}
          {!fromUpgrade ? (
            <Pressable onPress={() => router.push("/redeem-code")} hitSlop={10} style={styles.codeBtn} testID="paywall-code-btn">
              <Text style={styles.codeBtnText}>Have an access code? (skip payment)</Text>
            </Pressable>
          ) : null}
          {!fromUpgrade ? (
            <Pressable
              onPress={() => {
                const go = () => { resetOnboarding(); router.replace("/onboarding"); };
                if (Platform.OS === "web") {
                  if (typeof window !== "undefined" && window.confirm("Restart onboarding from the beginning?")) go();
                  return;
                }
                Alert.alert("Restart?", "This will take you back to the start screen.", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Restart", style: "destructive", onPress: go },
                ]);
              }}
              hitSlop={8}
              style={styles.restartBtn}
              testID="paywall-restart-btn"
            >
              <Text style={styles.restartText}>Restart</Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

function PlanToggle({ label, sub, selected, onPress, tag }: { label: string; sub: string; selected: boolean; onPress: () => void; tag?: string }) {
  return (
    <Pressable onPress={onPress} style={[styles.planToggle, selected && styles.planToggleOn]}>
      {tag ? <View style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View> : null}
      <Text style={[styles.planToggleLabel, selected && styles.planToggleLabelOn]}>{label}</Text>
      <Text style={styles.planToggleSub}>{sub}</Text>
    </Pressable>
  );
}

function CycleCard({ selected, onPress, headline, sub, savings }: { cycle: BillingCycle; selected: boolean; onPress: () => void; headline: string; sub: string; savings?: string }) {
  return (
    <Pressable onPress={onPress} style={[styles.cycleCard, selected && styles.cycleCardOn]}>
      <View style={styles.cycleRow}>
        <View style={[styles.radio, selected && styles.radioOn]}>
          {selected ? <View style={styles.radioDot} /> : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cycleHeadline}>{headline}</Text>
          <Text style={styles.cycleSub}>{sub}</Text>
        </View>
        {savings ? <View style={styles.savings}><Text style={styles.savingsText}>{savings}</Text></View> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  safe: { flex: 1, paddingHorizontal: 22 },
  closeBtn: { alignSelf: "flex-end", width: 32, height: 32, alignItems: "center", justifyContent: "center", marginTop: 4 },
  closeText: { color: Colors.textDim, fontSize: 22, fontWeight: "400" },
  scroll: { paddingBottom: 20 },
  eyebrow: { color: Colors.accentGold, letterSpacing: 3, fontWeight: "900", fontSize: 11, marginTop: 6 },
  title: { color: Colors.text, fontSize: 34, fontWeight: "900", letterSpacing: -0.8, marginTop: 8, lineHeight: 40 },
  subtitle: { color: Colors.textDim, fontSize: 15, marginTop: 10, lineHeight: 21 },

  planSwitcher: { flexDirection: "row", gap: 10, marginTop: 24 },
  planToggle: {
    flex: 1, padding: 14, borderRadius: 16,
    borderWidth: 1.5, borderColor: "#eeeeee", backgroundColor: "#ffffff",
    position: "relative",
  },
  planToggleOn: { borderColor: Colors.text, backgroundColor: "#fafafa" },
  planToggleLabel: { color: Colors.text, fontSize: 17, fontWeight: "900" },
  planToggleLabelOn: {},
  planToggleSub: { color: Colors.textDim, fontSize: 12, marginTop: 3, fontWeight: "600" },
  tag: {
    position: "absolute", top: -8, right: 10,
    backgroundColor: Colors.accentGold,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
  tagText: { color: "#ffffff", fontSize: 9, fontWeight: "900", letterSpacing: 1 },

  cycles: { gap: 8, marginTop: 16 },
  cycleCard: {
    padding: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: "#eeeeee", backgroundColor: "#ffffff",
  },
  cycleCardOn: { borderColor: Colors.text },
  cycleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: "#dddddd", alignItems: "center", justifyContent: "center" },
  radioOn: { borderColor: Colors.text },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.text },
  cycleHeadline: { color: Colors.text, fontSize: 14, fontWeight: "800" },
  cycleSub: { color: Colors.textDim, fontSize: 11, fontWeight: "600", marginTop: 2 },
  savings: { backgroundColor: Colors.accentGold, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  savingsText: { color: "#ffffff", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },

  perks: { marginTop: 20, gap: 10 },
  premiumBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.text, paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 12, marginBottom: 4,
  },
  premiumBannerText: { color: "#ffffff", fontSize: 13, fontWeight: "700", flex: 1 },
  perkRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  perkCheck: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.accentGold, alignItems: "center", justifyContent: "center" },
  perkText: { color: Colors.text, fontSize: 14, flex: 1, lineHeight: 19 },
  teaser: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 6, padding: 12, borderRadius: 12,
    backgroundColor: "rgba(212,175,55,0.08)",
    borderWidth: 1, borderColor: "rgba(212,175,55,0.3)",
  },
  teaserText: { color: Colors.text, fontSize: 12, fontWeight: "600", flex: 1 },

  footer: { paddingBottom: 8, paddingTop: 4, gap: 6 },
  legal: { color: Colors.textMuted, fontSize: 10, textAlign: "center", lineHeight: 14 },
  codeBtn: { alignSelf: "center", paddingVertical: 6, paddingHorizontal: 10, marginTop: 2 },
  codeBtnText: { color: Colors.textMuted, fontSize: 11, fontWeight: "600", textDecorationLine: "underline" },
  restartBtn: { alignSelf: "center", paddingVertical: 4, paddingHorizontal: 8, marginTop: 2, opacity: 0.55 },
  restartText: { color: "#c0392b", fontSize: 9, fontWeight: "600", letterSpacing: 0.4 },
});
