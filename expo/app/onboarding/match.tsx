import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { z } from "zod";

import { BackgroundGlow } from "@/components/BackgroundGlow";
import { Colors } from "@/constants/colors";
import { useApp } from "@/providers/AppProvider";
import { getPlan } from "@/constants/plans";
import type { BusinessIdea, Industry, TaskSeed } from "@/types";
import { generateObject } from "@rork-ai/toolkit-sdk";
import { entryToIdea, fetchActiveLibrary, syncIdeasToLibrary } from "@/lib/businessLibrary";

const STEPS = [
  "Checking the library",
  "Matching your goals",
  "Factoring in your time & obstacles",
  "Drafting business ideas",
  "Building your task roadmap",
];

const BusinessSchema = z.object({
  id: z.string(),
  name: z.string(),
  tagline: z.string(),
  description: z.string(),
  whyFit: z.string(),
  startupCost: z.string(),
  timeToIncome: z.string(),
  firstMilestones: z.array(z.string()).min(3).max(5),
});

const TaskSeedSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.enum(["focus", "skill", "health", "growth", "mindset", "hustle"]),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

const MatchSchema = z.object({
  ideas: z.array(BusinessSchema).length(3),
  taskPools: z.array(z.array(TaskSeedSchema).min(6).max(10)).length(3),
});

const INDUSTRY_LABEL: Record<Industry, string> = {
  tech: "tech & software",
  creative: "creative & design",
  services: "local services",
  ecommerce: "e-commerce",
  content: "content creation",
  education: "coaching & education",
  health: "health & wellness",
  food: "food & hospitality",
  open: "open to anything",
};

export default function MatchScreen() {
  const router = useRouter();
  const { state } = useApp();
  const plan = getPlan(state.profile.subscription.plan);
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [error] = useState<string | null>(null);

  const pulse = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.timing(rotate, { toValue: 1, duration: 3600, easing: Easing.linear, useNativeDriver: true })
    ).start();

    const iv = setInterval(() => {
      setStepIdx((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 900);
    return () => clearInterval(iv);
  }, [pulse, rotate]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const p = state.profile;

      try {
        // Step 1: check library for matching entries first
        const library = await fetchActiveLibrary();
        const matching = library.filter((entry) => {
          if (entry.matching_goals.length === 0) return true;
          if (!p.goal) return true;
          return entry.matching_goals.includes(p.goal);
        });

        const prompt = `You are a business matchmaker. Generate exactly 3 personalized, realistic business ideas the user could start this month. Each idea must feel tangible and specific — not generic.

User profile:
- Name: ${p.name || "the user"}
- Primary goal: ${p.goal}
- Experience level: ${p.experience}
- Daily time available: ${p.time}
- What matters most: ${p.priority}
- Industry interest: ${p.industry ? INDUSTRY_LABEL[p.industry] : "any"}
- Starting budget: ${p.budget}
- Biggest obstacle: ${p.obstacle}
- Plan tier: ${plan.name} (${plan.incomeTier})
- Target monthly income range: ${plan.incomeRange}
${plan.premiumBusinesses ? "- PREMIUM MODE: user has unlocked high-ticket businesses. Prefer scalable, higher-revenue ideas (agencies, SaaS, premium services, e-commerce brands, consulting, productized services) with realistic paths to $1,000\u2013$10,000+/month." : "- Standard tier: focus on beginner-friendly side hustles and starter businesses with realistic earnings of $0\u2013$1,000/month. Avoid suggesting capital-heavy or enterprise-scale ideas."}

IMPORTANT: All 3 ideas MUST match the user's income tier. Their startupCost and timeToIncome should fit the tier. Do NOT suggest $10k/mo businesses to a Free user, and do NOT suggest $20/mo hustles to an Elite/Unlimited user.

${matching.length > 0 ? `Existing library entries you may REUSE (preferred if a great fit). Keep the same id if reusing:
${matching.slice(0, 12).map((e) => `- id:${e.id} | ${e.name} — ${e.tagline ?? ""}`).join("\n")}
` : ""}

Return:
- ideas: an array of exactly 3 businesses with id (short kebab-case), name (2-5 words, catchy), tagline (under 10 words), description (2 sentences), whyFit (1-2 sentences tying to the user's inputs), startupCost (string like "$0–$200"), timeToIncome (string like "2–4 weeks"), firstMilestones (3-5 concrete first milestones).
- taskPools: an array of exactly 3 task arrays (one per idea, in the same order). Each pool has 6-8 tasks with title (short, action-verb), description (one concrete sentence), category (one of: focus, skill, health, growth, mindset, hustle), difficulty (1, 2, or 3). Tasks must be specific to that business.

Mix: prefer reusing 1-2 library entries when they fit, and invent 1-2 fresh ones.`;

        const result = await generateObject({
          messages: [{ role: "user", content: prompt }],
          schema: MatchSchema,
        });

        if (cancelled) return;

        const ideas: BusinessIdea[] = result.ideas.map((i) => ({ ...i }));
        const pools: TaskSeed[][] = result.taskPools.map((pool) => pool.map((t) => ({ ...t })));

        // Sync any new ideas to the central library
        syncIdeasToLibrary(ideas, pools, { goal: p.goal, experience: p.experience }).catch(() => {});

        setStepIdx(STEPS.length - 1);

        setTimeout(() => {
          if (cancelled) return;
          router.replace({
            pathname: "/onboarding/business",
            params: {
              payload: JSON.stringify({ ideas, pools }),
            },
          });
        }, 500);
      } catch (e) {
        console.log("[match] error", e);
        if (cancelled) return;

        // Try pure library fallback
        const library = await fetchActiveLibrary();
        if (library.length >= 3) {
          const picked = library.slice(0, 3).map(entryToIdea);
          const ideas = picked.map((p2) => p2.idea);
          const pools = picked.map((p2) => p2.pool);
          router.replace({
            pathname: "/onboarding/business",
            params: { payload: JSON.stringify({ ideas, pools }) },
          });
          return;
        }

        const fallback = fallbackIdeas();
        // Seed library with fallback so user has something editable
        syncIdeasToLibrary(fallback.ideas, fallback.pools, { goal: p.goal, experience: p.experience }).catch(() => {});
        router.replace({
          pathname: "/onboarding/business",
          params: { payload: JSON.stringify(fallback) },
        });
      }
    };
    run();
    return () => { cancelled = true; };
  }, [state.profile, router]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const glow = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={styles.root}>
      <BackgroundGlow />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.center}>
          <View style={styles.ringWrap}>
            <Animated.View style={[styles.glowRing, { opacity: glow, transform: [{ scale }] }]}>
              <LinearGradient
                colors={["rgba(212,175,55,0.55)", "rgba(201,168,124,0)"]}
                style={styles.glowFill}
              />
            </Animated.View>
            <Animated.View style={[styles.ring, { transform: [{ rotate: spin }] }]}>
              <LinearGradient
                colors={["#d4af37", "#c9a87c", "#e8d5b7", "#c9a87c", "#d4af37"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            <View style={styles.ringInner}>
              <Image
                source={{ uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ildjxbdtuicbf06zk7zn0.jpeg" }}
                style={styles.ringLogo}
                resizeMode="contain"
              />
            </View>
          </View>

          <Text style={styles.eyebrow}>BUILDING YOUR MATCH</Text>
          <Text style={styles.title}>Crafting 3 businesses{`\n`}tailored to you</Text>

          <View style={styles.stepsBox}>
            {STEPS.map((s, i) => (
              <StepRow key={s} label={s} active={i === stepIdx} done={i < stepIdx} />
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

function StepRow({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <View style={styles.stepRow}>
      <View style={[styles.stepDot, active && styles.stepDotActive, done && styles.stepDotDone]} />
      <Text style={[styles.stepText, active && styles.stepTextActive, done && styles.stepTextDone]}>{label}</Text>
    </View>
  );
}

function fallbackIdeas(): { ideas: BusinessIdea[]; pools: TaskSeed[][] } {
  const ideas: BusinessIdea[] = [
    { id: "local-boost-studio", name: "Local Boost Studio", tagline: "Done-for-you marketing for local shops", description: "A service that runs Instagram, Google, and email for small local businesses. You handle content + ads while owners focus on operations.", whyFit: "Low startup cost, high demand in every city, fits around your schedule.", startupCost: "$0–$200", timeToIncome: "2–4 weeks", firstMilestones: ["Pick a niche (gyms, cafes, salons)", "Build a 1-page portfolio site", "Pitch 20 local businesses", "Land first paying client"] },
    { id: "skill-shorts", name: "Skill Shorts", tagline: "Teach one skill in 60-second videos", description: "Short-form content channel focused on one teachable skill. Monetize through ads, sponsors, and a small digital product.", whyFit: "Plays to the time you have and compounds over months.", startupCost: "$0–$100", timeToIncome: "6–12 weeks", firstMilestones: ["Choose your skill niche", "Record 10 shorts", "Post daily for 30 days", "Launch a $9 digital guide"] },
    { id: "clean-crew-concierge", name: "Clean Crew Concierge", tagline: "Premium cleaning for busy professionals", description: "High-end recurring cleaning service booked online. Start solo, then subcontract as demand grows.", whyFit: "Cash-flow fast and doesn't require expertise to start.", startupCost: "$100–$400", timeToIncome: "1–2 weeks", firstMilestones: ["Buy supplies + insurance", "Build a Square booking page", "Flyer 3 affluent zip codes", "Book first 3 recurring clients"] },
  ];
  const pools: TaskSeed[][] = [
    [
      { title: "List 10 local niches", description: "Write down 10 local business types you'd enjoy serving.", category: "focus", difficulty: 1 },
      { title: "Pitch 5 local shops", description: "Send personalized DMs or emails offering a free audit.", category: "hustle", difficulty: 2 },
      { title: "Build a 1-page site", description: "Use Carrd or Framer and publish a simple portfolio page.", category: "skill", difficulty: 2 },
      { title: "Write 3 offer bullets", description: "Outline exactly what clients get and the price.", category: "growth", difficulty: 1 },
      { title: "Post one case-study idea", description: "Share a before/after or mini strategy on LinkedIn.", category: "growth", difficulty: 2 },
      { title: "Follow up with warm leads", description: "Re-message anyone who showed interest.", category: "hustle", difficulty: 1 },
    ],
    [
      { title: "Record 1 short video", description: "60 seconds teaching one thing in your skill niche.", category: "skill", difficulty: 2 },
      { title: "Write 5 hook ideas", description: "Draft 5 punchy opening lines for future shorts.", category: "growth", difficulty: 1 },
      { title: "Engage with 10 creators", description: "Leave thoughtful comments on bigger accounts.", category: "growth", difficulty: 1 },
      { title: "Study 3 viral posts", description: "Note structure, hook, and pacing.", category: "skill", difficulty: 2 },
      { title: "Plan tomorrow's script", description: "One hook, one lesson, one call to action.", category: "focus", difficulty: 1 },
      { title: "Outline a $9 guide", description: "5 section headings for your first digital product.", category: "hustle", difficulty: 3 },
    ],
    [
      { title: "Research local pricing", description: "Check 5 competitors and note their offers.", category: "focus", difficulty: 1 },
      { title: "Set up booking page", description: "Use Square or Jobber to accept first bookings.", category: "skill", difficulty: 2 },
      { title: "Design a flyer", description: "Make a clean postcard in Canva.", category: "skill", difficulty: 1 },
      { title: "Door-knock 20 homes", description: "Hand out flyers in a target neighborhood.", category: "hustle", difficulty: 3 },
      { title: "Ask for a referral", description: "Message one past client or friend for a warm intro.", category: "hustle", difficulty: 1 },
      { title: "Post on Nextdoor", description: "Introduce your service in your local community.", category: "growth", difficulty: 1 },
    ],
  ];
  return { ideas, pools };
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1, paddingHorizontal: 24 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  ringWrap: { width: 140, height: 140, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  glowRing: { position: "absolute", width: 230, height: 230, borderRadius: 999 },
  glowFill: { flex: 1, borderRadius: 999 },
  ring: { position: "absolute", width: 118, height: 118, borderRadius: 999, overflow: "hidden" },
  ringInner: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#0a0a0a", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(212,175,55,0.4)", overflow: "hidden" },
  ringLogo: { width: 72, height: 72 },
  eyebrow: { color: Colors.accent, letterSpacing: 3, fontWeight: "800", fontSize: 11 },
  title: { color: Colors.text, fontSize: 26, fontWeight: "900", letterSpacing: -0.5, textAlign: "center", marginTop: 8, lineHeight: 32 },
  stepsBox: { marginTop: 28, alignSelf: "stretch", gap: 10, paddingHorizontal: 12 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "rgba(0,0,0,0.1)" },
  stepDotActive: { backgroundColor: Colors.accent, shadowColor: Colors.accent, shadowOpacity: 0.8, shadowRadius: 8 },
  stepDotDone: { backgroundColor: Colors.accentDeep },
  stepText: { color: Colors.textMuted, fontSize: 14, fontWeight: "600" },
  stepTextActive: { color: Colors.text, fontWeight: "800" },
  stepTextDone: { color: Colors.textDim, fontWeight: "700" },
  error: { color: Colors.danger, marginTop: 16, textAlign: "center" },
});
