import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Crown, Lock, Sparkles } from "lucide-react-native";

import { OnboardingShell } from "@/components/OnboardingShell";
import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";
import { useApp } from "@/providers/AppProvider";
import type { BusinessIdea, TaskSeed } from "@/types";

interface Option {
  idea: BusinessIdea;
  pool: TaskSeed[];
}

function aiOptions(): Option[] {
  return [
    {
      idea: {
        id: "yt-automation",
        name: "YouTube Automation",
        tagline: "Faceless cash-cow channels powered by AI",
        description: "Launch a faceless YouTube channel where AI handles scripts, voiceover, and editing. Monetize through ads and affiliates.",
        whyFit: "High-leverage, scales on autopilot once your first videos hit.",
        startupCost: "$50 – $300",
        timeToIncome: "4–8 weeks",
        firstMilestones: ["Pick a niche", "Set up AI script + voice stack", "Publish your first 10 videos", "Hit 1,000 subs"],
        isPro: true, path: "ai", incomeRange: "$2k – $20k / mo",
      },
      pool: [
        { title: "Pick 1 niche", description: "Choose a high-RPM evergreen niche.", category: "focus", difficulty: 1 },
        { title: "Outline a video", description: "Write a hook + 5 beats for one script.", category: "skill", difficulty: 2 },
        { title: "Test 3 thumbnails", description: "Mock 3 thumbnail concepts in Canva.", category: "skill", difficulty: 2 },
        { title: "Publish 1 short", description: "Drop a 60-sec teaser today.", category: "hustle", difficulty: 2 },
        { title: "Spy on a top channel", description: "Pick a winner and break down its first 10 vids.", category: "growth", difficulty: 1 },
        { title: "Set up your voice stack", description: "Pick an AI voice + workflow.", category: "skill", difficulty: 2 },
      ],
    },
    {
      idea: {
        id: "ai-automation-agency",
        name: "AI Automation Agency",
        tagline: "Build AI workflows for businesses charging $1k–$5k retainers",
        description: "Sell custom AI automations (chatbots, lead capture, content) to local businesses on monthly retainers.",
        whyFit: "Premium pricing, recurring revenue, no inventory.",
        startupCost: "$0 – $200",
        timeToIncome: "2–6 weeks",
        firstMilestones: ["Pick a target niche", "Build one demo automation", "Pitch 20 prospects", "Land first retainer client"],
        isPro: true, path: "ai", incomeRange: "$3k – $15k / mo",
      },
      pool: [
        { title: "List 20 target businesses", description: "Pick a niche and find 20 local prospects.", category: "focus", difficulty: 2 },
        { title: "Build one demo", description: "Make a 2-minute Loom of an automation.", category: "skill", difficulty: 3 },
        { title: "Send 10 cold DMs", description: "Personalized outreach with the demo link.", category: "hustle", difficulty: 2 },
        { title: "Write your offer", description: "One-page proposal + retainer pricing.", category: "growth", difficulty: 2 },
        { title: "Study one automation tool", description: "Get fluent in Make.com or n8n.", category: "skill", difficulty: 2 },
        { title: "Follow up warm leads", description: "Re-message anyone interested.", category: "hustle", difficulty: 1 },
      ],
    },
    {
      idea: {
        id: "ai-side-tools",
        name: "AI Side Tools",
        tagline: "Tiny AI-powered tools that earn passive income",
        description: "Ship small, single-purpose AI tools (resume writer, name generator) and monetize via ads or one-time fees.",
        whyFit: "Beginner-friendly entry into AI products, low cost, real learning.",
        startupCost: "Free – $50",
        timeToIncome: "2–4 weeks",
        firstMilestones: ["Pick one painful task", "Ship a v1 in a no-code tool", "Get 10 users", "Add a $5 unlock"],
        isPro: false, path: "ai", incomeRange: "$0 – $1,000 / mo",
      },
      pool: [
        { title: "Brainstorm 10 tiny tools", description: "List 10 painful one-step tasks AI could solve.", category: "focus", difficulty: 1 },
        { title: "Pick winner + draft UI", description: "Choose your favorite and sketch the flow.", category: "skill", difficulty: 2 },
        { title: "Build a no-code v1", description: "Use Bolt, Lovable, or a Notion form.", category: "skill", difficulty: 3 },
        { title: "Share it once today", description: "Post on Reddit, X, or to a friend group.", category: "hustle", difficulty: 1 },
        { title: "Collect 3 user quotes", description: "Ask 3 testers what they loved or hated.", category: "growth", difficulty: 1 },
        { title: "Add a $5 unlock", description: "Set up Stripe Payment Links for paid tier.", category: "hustle", difficulty: 2 },
      ],
    },
  ];
}

function inPersonOptions(): Option[] {
  return [
    {
      idea: {
        id: "mobile-detailing-empire",
        name: "Mobile Detailing Empire",
        tagline: "Premium $200–$500 car details at customers' homes",
        description: "Premium mobile auto-detailing service that scales from solo operator to crew. High ticket, recurring clients.",
        whyFit: "High margins, repeat business, scales to 6 figures.",
        startupCost: "$500 – $2,000",
        timeToIncome: "1–2 weeks",
        firstMilestones: ["Buy core supplies + insurance", "Build a booking page", "Detail 3 free cars for reviews", "Book first paying clients"],
        isPro: true, path: "in_person", incomeRange: "$3k – $15k / mo",
      },
      pool: [
        { title: "Source supplies", description: "Make a shopping list for your starter kit.", category: "focus", difficulty: 2 },
        { title: "Build a booking page", description: "Set up Square or Jobber.", category: "skill", difficulty: 2 },
        { title: "Detail 1 free car", description: "Free job in exchange for photos + review.", category: "hustle", difficulty: 3 },
        { title: "Door-knock 20 homes", description: "Hand out flyers in target zip codes.", category: "hustle", difficulty: 3 },
        { title: "Take before/after photos", description: "Build portfolio shots.", category: "growth", difficulty: 1 },
        { title: "Set up Google profile", description: "Local SEO = inbound leads.", category: "growth", difficulty: 2 },
      ],
    },
    {
      idea: {
        id: "pressure-washing-route",
        name: "Pressure Washing Pro",
        tagline: "$300–$1,500 jobs cleaning driveways and houses",
        description: "Mobile pressure washing service for homes and driveways. Cash-flow heavy, repeatable jobs every weekend.",
        whyFit: "Tangible service, instant gratification for clients, scales fast.",
        startupCost: "$800 – $2,500",
        timeToIncome: "1–2 weeks",
        firstMilestones: ["Buy gear + insurance", "Build before/after portfolio", "Quote 10 driveways", "Book first 3 jobs"],
        isPro: true, path: "in_person", incomeRange: "$4k – $12k / mo",
      },
      pool: [
        { title: "Spec your gear", description: "Pick a pressure washer + chems.", category: "focus", difficulty: 2 },
        { title: "Knock 25 driveways", description: "Offer free quotes in your area.", category: "hustle", difficulty: 3 },
        { title: "Post one before/after", description: "Reel or carousel showing the transformation.", category: "growth", difficulty: 2 },
        { title: "Set up Facebook page", description: "Free local advertising.", category: "skill", difficulty: 1 },
        { title: "Quote 3 leads", description: "Send written quotes to warm leads.", category: "hustle", difficulty: 2 },
        { title: "Schedule your week", description: "Block 3 mornings for jobs.", category: "focus", difficulty: 1 },
      ],
    },
    {
      idea: {
        id: "car-washing-side",
        name: "Weekend Car Wash",
        tagline: "Simple $40 mobile washes — start with what you have",
        description: "Solo mobile car wash on weekends — a bucket, hose, and a smile. Build cash and reviews to upgrade later.",
        whyFit: "Almost zero startup cost — start this weekend.",
        startupCost: "Under $50",
        timeToIncome: "This weekend",
        firstMilestones: ["Buy soap + buckets", "Post in your local Facebook group", "Wash 5 cars this weekend", "Collect 5 reviews"],
        isPro: false, path: "in_person", incomeRange: "$100 – $800 / mo",
      },
      pool: [
        { title: "Buy basic supplies", description: "Soap, sponge, 2 buckets, microfiber.", category: "focus", difficulty: 1 },
        { title: "Post in Nextdoor", description: "Offer first 3 washes at $20.", category: "hustle", difficulty: 1 },
        { title: "Wash 1 car today", description: "Family or friend — get the rep.", category: "hustle", difficulty: 1 },
        { title: "Take 3 photos", description: "Document before/after shots.", category: "growth", difficulty: 1 },
        { title: "Ask for a review", description: "Friendly text to your first client.", category: "hustle", difficulty: 1 },
        { title: "Plan next weekend", description: "Block your schedule for 4 cars.", category: "focus", difficulty: 1 },
      ],
    },
  ];
}

export default function PickBusinessScreen() {
  const router = useRouter();
  const { state, setBusiness, setProfileField } = useApp();
  const path = state.profile.pathChoice ?? (state.profile.goal === "in_person_hustle" ? "in_person" : "ai");
  const options = useMemo(() => (path === "ai" ? aiOptions() : inPersonOptions()), [path]);
  const [selected, setSelected] = useState<string | null>(null);

  const freeOpt = options.find((o) => !o.idea.isPro);
  const proOpts = options.filter((o) => o.idea.isPro);

  const onContinue = () => {
    if (!selected) return;
    const opt = options.find((o) => o.idea.id === selected);
    if (!opt) return;
    const free = freeOpt;
    if (opt.idea.isPro) {
      // Stash for downgrade fallback, then go to paywall with Pro pre-selected.
      setProfileField("pendingProPick", opt.idea);
      setProfileField("pendingProPickPool", opt.pool);
      if (free) {
        setProfileField("pendingFreeAlt", free.idea);
        setProfileField("pendingFreeAltPool", free.pool);
      }
      setBusiness(opt.idea, opt.pool);
      router.push({ pathname: "/onboarding/paywall", params: { initialPlan: "premium", initialCycle: "monthly", requirePro: "1" } });
    } else {
      setProfileField("pendingProPick", null);
      setProfileField("pendingProPickPool", []);
      setProfileField("pendingFreeAlt", null);
      setProfileField("pendingFreeAltPool", []);
      setBusiness(opt.idea, opt.pool);
      router.push({ pathname: "/onboarding/paywall", params: { initialPlan: "base", initialCycle: "monthly" } });
    }
  };

  return (
    <OnboardingShell
      step={5}
      total={5}
      title="Pick your business"
      subtitle={path === "ai" ? "Three AI businesses tailored to you." : "Three in-person hustles tailored to you."}
      footer={
        <GradientButton
          title="Continue"
          variant="gold"
          disabled={!selected}
          onPress={onContinue}
          testID="cta-pick-business"
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {proOpts.map((o) => (
          <BizCard key={o.idea.id} opt={o} selected={selected === o.idea.id} onPress={() => setSelected(o.idea.id)} />
        ))}
        {freeOpt ? <BizCard key={freeOpt.idea.id} opt={freeOpt} selected={selected === freeOpt.idea.id} onPress={() => setSelected(freeOpt.idea.id)} /> : null}
      </ScrollView>
    </OnboardingShell>
  );
}

function BizCard({ opt, selected, onPress }: { opt: Option; selected: boolean; onPress: () => void }) {
  const pro = !!opt.idea.isPro;
  return (
    <Pressable
      onPress={onPress}
      testID={`biz-${opt.idea.id}`}
      style={({ pressed }) => [
        styles.card,
        pro && styles.cardPro,
        selected && styles.cardOn,
        selected && pro && styles.cardProOn,
        pressed && { opacity: 0.92 },
      ]}
    >
      {pro ? (
        <View style={styles.proBadge}>
          <Crown size={10} color="#ffffff" />
          <Text style={styles.proBadgeText}>PRO</Text>
        </View>
      ) : (
        <View style={styles.freeBadge}>
          <Sparkles size={10} color={Colors.text} />
          <Text style={styles.freeBadgeText}>FREE PICK</Text>
        </View>
      )}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{opt.idea.name}</Text>
        {pro ? <Lock color={Colors.accentGold} size={14} /> : null}
      </View>
      <Text style={styles.tagline}>{opt.idea.tagline}</Text>
      <View style={styles.metaRow}>
        {opt.idea.incomeRange ? (
          <View style={styles.metaPill}>
            <Text style={styles.metaPillText}>{opt.idea.incomeRange}</Text>
          </View>
        ) : null}
        <View style={styles.metaPill}>
          <Text style={styles.metaPillText}>{opt.idea.timeToIncome}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 24, gap: 12 },
  card: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#eeeeee",
    backgroundColor: "#ffffff",
    padding: 18,
    gap: 6,
  },
  cardOn: { borderColor: Colors.text, backgroundColor: "#fafafa" },
  cardPro: {
    borderColor: Colors.accentGold,
    borderWidth: 2,
    shadowColor: Colors.accentGold,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  cardProOn: { borderColor: Colors.accentGold, borderWidth: 2.5, backgroundColor: "#fffbf0" },
  proBadge: {
    alignSelf: "flex-start",
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: Colors.accentGold,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
    marginBottom: 4,
  },
  proBadgeText: { color: "#ffffff", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  freeBadge: {
    alignSelf: "flex-start",
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#fafafa",
    borderWidth: 1, borderColor: "#eeeeee",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
    marginBottom: 4,
  },
  freeBadgeText: { color: Colors.text, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { color: Colors.text, fontSize: 18, fontWeight: "900", letterSpacing: -0.3, flex: 1 },
  tagline: { color: Colors.textDim, fontSize: 13, lineHeight: 18 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  metaPill: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
    backgroundColor: "rgba(212,175,55,0.12)",
    borderWidth: 1, borderColor: "rgba(212,175,55,0.35)",
  },
  metaPillText: { color: Colors.accentDeep, fontSize: 11, fontWeight: "800" },
});
