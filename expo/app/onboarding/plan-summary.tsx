import React, { useEffect, useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { Clock, DollarSign, Sparkles, Target } from "lucide-react-native";

import { OnboardingShell } from "@/components/OnboardingShell";
import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";
import { useApp } from "@/providers/AppProvider";
import type { BusinessIdea, SkillTopic, TaskSeed } from "@/types";

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

export default function PlanSummaryScreen() {
  const router = useRouter();
  const { state, setBusiness } = useApp();
  const profile = state.profile;
  const isSkill = profile.goal === "build_skills";

  useEffect(() => {
    if (isSkill && !profile.business) {
      const cc = crashCourseFor(profile.skillTopic);
      setBusiness(cc.idea, cc.pool);
    }
  }, [isSkill, profile.business, profile.skillTopic, setBusiness]);

  const business = profile.business;

  const prevPath: Href = useMemo(() => {
    if (profile.goal === "grow_business") return "/onboarding/build-business";
    if (profile.goal === "build_skills") return "/onboarding/source";
    return "/onboarding/business";
  }, [profile.goal]);

  const eyebrow = useMemo(() => {
    if (isSkill) return "YOUR CRASH COURSE";
    if (profile.goal === "grow_business") return "YOUR PLAN";
    return "YOUR BUSINESS";
  }, [isSkill, profile.goal]);

  return (
    <OnboardingShell
      step={11}
      total={11}
      title={business ? `Meet ${business.name}.` : "Your plan is ready."}
      subtitle={business?.tagline ?? "Here's everything we picked for you."}
      canGoBack
      prevPath={prevPath}
      footer={
        <GradientButton
          title="Start my plan"
          variant="gold"
          onPress={() => router.push("/onboarding/try-free")}
          testID="cta-start-plan"
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.eyebrowPill}>
          <Sparkles color={Colors.accentGold} size={11} />
          <Text style={styles.eyebrowText}>{eyebrow}</Text>
        </View>

        {business ? (
          <>
            <Text style={styles.desc}>{business.description}</Text>

            <View style={styles.metaRow}>
              <MetaPill icon={<DollarSign size={12} color={Colors.accentDeep} />} text={business.startupCost} />
              <MetaPill icon={<Clock size={12} color={Colors.accentDeep} />} text={business.timeToIncome} />
            </View>

            <View style={styles.whyBox}>
              <View style={styles.whyHead}>
                <Target size={12} color={Colors.accentGold} />
                <Text style={styles.whyLabel}>WHY THIS FITS YOU</Text>
              </View>
              <Text style={styles.whyText}>{business.whyFit}</Text>
            </View>

            <Text style={styles.milestonesLabel}>FIRST MILESTONES</Text>
            <View style={styles.milestones}>
              {business.firstMilestones.map((m, i) => (
                <View key={i} style={styles.milestoneRow}>
                  <View style={styles.milestoneNum}>
                    <Text style={styles.milestoneNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.milestoneText}>{m}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.empty}>Setting up your plan...</Text>
        )}

        <View style={styles.assuranceBox}>
          <Text style={styles.assuranceTitle}>What happens next</Text>
          <Text style={styles.assuranceText}>
            Tap Start my plan and we&apos;ll set up your daily tasks, streaks, and AI guidance — free for 3 days, no charge until your trial ends.
          </Text>
        </View>
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
  scroll: { paddingBottom: 24 },
  empty: { color: Colors.textDim, fontSize: 15, marginTop: 24, textAlign: "center" },
  eyebrowPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
    backgroundColor: "rgba(212,175,55,0.12)",
    borderWidth: 1, borderColor: "rgba(212,175,55,0.4)",
    marginBottom: 4,
  },
  eyebrowText: { color: Colors.accentDeep, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  desc: { color: Colors.textDim, fontSize: 14, lineHeight: 21, marginTop: 14 },
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
  assuranceBox: {
    marginTop: 22, padding: 16, borderRadius: 16,
    backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#eeeeee",
  },
  assuranceTitle: { color: Colors.text, fontSize: 14, fontWeight: "900", marginBottom: 4 },
  assuranceText: { color: Colors.textDim, fontSize: 13, lineHeight: 19 },
});
