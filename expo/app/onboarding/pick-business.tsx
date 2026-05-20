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

function aiPool(): Option[] {
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
    {
      idea: {
        id: "ai-day-trading",
        name: "AI Day Trading Bot",
        tagline: "Algorithmic trading with AI-driven signals",
        description: "Run AI-driven trading strategies on stocks or crypto. Backtest, deploy, and let the bot work while you sleep.",
        whyFit: "High-skill, high-ceiling. Compounds quickly when dialed in.",
        startupCost: "$200 – $2,000",
        timeToIncome: "6–12 weeks",
        firstMilestones: ["Pick a broker w/ API", "Backtest one strategy", "Paper trade for 2 weeks", "Go live with small size"],
        isPro: true, path: "ai", incomeRange: "$0 – $25k / mo",
      },
      pool: [
        { title: "Pick a broker w/ API", description: "Alpaca, IBKR, or Coinbase.", category: "focus", difficulty: 2 },
        { title: "Backtest one strategy", description: "Test on 1+ year of data.", category: "skill", difficulty: 3 },
        { title: "Paper trade today", description: "Run it live with fake money.", category: "hustle", difficulty: 2 },
        { title: "Log every trade", description: "Track P&L + reasoning.", category: "growth", difficulty: 1 },
        { title: "Study one indicator", description: "Deep-dive RSI, EMA, or order flow.", category: "skill", difficulty: 2 },
        { title: "Set risk rules", description: "Max loss per day, position size.", category: "focus", difficulty: 2 },
      ],
    },
    {
      idea: {
        id: "ai-saas",
        name: "AI Micro-SaaS",
        tagline: "$29/mo AI products selling on autopilot",
        description: "Build a small AI-powered SaaS solving one painful niche problem. Subscription pricing.",
        whyFit: "Recurring revenue, scales without your time, sellable asset.",
        startupCost: "$50 – $500",
        timeToIncome: "4–10 weeks",
        firstMilestones: ["Validate one painful problem", "Ship MVP in a no-code stack", "Get 10 paying users", "Hit $1k MRR"],
        isPro: true, path: "ai", incomeRange: "$1k – $25k / mo",
      },
      pool: [
        { title: "Interview 5 ideal users", description: "Find a painful, paid problem.", category: "focus", difficulty: 3 },
        { title: "Mock the UI", description: "Sketch the core flow on paper or Figma.", category: "skill", difficulty: 2 },
        { title: "Ship a v0", description: "No-code or Bolt/Lovable build.", category: "skill", difficulty: 3 },
        { title: "Set up Stripe", description: "Subscription pricing live.", category: "hustle", difficulty: 2 },
        { title: "Post in 3 communities", description: "Reddit, IH, niche Discords.", category: "hustle", difficulty: 2 },
        { title: "Onboard first user", description: "Get their feedback fast.", category: "growth", difficulty: 2 },
      ],
    },
    {
      idea: {
        id: "ai-content-agency",
        name: "AI Content Agency",
        tagline: "$2k–$5k/mo retainers writing & posting with AI",
        description: "Ghostwrite Twitter / LinkedIn / blogs for founders using AI as your co-pilot.",
        whyFit: "Service business with software-like margins. Easy to start solo.",
        startupCost: "$0 – $100",
        timeToIncome: "2–4 weeks",
        firstMilestones: ["Pick a niche", "Build sample posts", "DM 30 founders", "Sign first retainer"],
        isPro: true, path: "ai", incomeRange: "$2k – $20k / mo",
      },
      pool: [
        { title: "Pick your niche", description: "SaaS founders, coaches, e-com…", category: "focus", difficulty: 2 },
        { title: "Build 5 sample posts", description: "Show off your voice + style.", category: "skill", difficulty: 2 },
        { title: "Send 10 cold DMs", description: "Personalized, value-first.", category: "hustle", difficulty: 2 },
        { title: "Write your offer page", description: "One Notion / Carrd page.", category: "skill", difficulty: 2 },
        { title: "Set up an AI workflow", description: "Draft → edit → schedule.", category: "skill", difficulty: 2 },
        { title: "Follow up warm leads", description: "Re-DM anyone interested.", category: "hustle", difficulty: 1 },
      ],
    },
    {
      idea: {
        id: "ai-newsletter",
        name: "AI-Powered Newsletter",
        tagline: "Build a paid newsletter using AI for research + drafts",
        description: "Launch a niche newsletter where AI helps you research, summarize, and draft 5x faster.",
        whyFit: "Owned audience, sponsor revenue, compounds for years.",
        startupCost: "Free – $100",
        timeToIncome: "6–10 weeks",
        firstMilestones: ["Pick a niche + name", "Publish first 4 issues", "Reach 500 subs", "Land first sponsor"],
        isPro: false, path: "ai", incomeRange: "$0 – $5k / mo",
      },
      pool: [
        { title: "Pick niche + name", description: "Narrow, specific, fun.", category: "focus", difficulty: 2 },
        { title: "Set up beehiiv", description: "Free tier is plenty to start.", category: "skill", difficulty: 1 },
        { title: "Draft issue #1", description: "AI helps — you edit + ship.", category: "skill", difficulty: 2 },
        { title: "Share with 10 friends", description: "Get the first subs from people you know.", category: "hustle", difficulty: 1 },
        { title: "Cross-post on X", description: "One thread per issue.", category: "growth", difficulty: 2 },
        { title: "Schedule next 2 issues", description: "Consistency beats everything.", category: "focus", difficulty: 1 },
      ],
    },
    {
      idea: {
        id: "ai-prompt-templates",
        name: "AI Prompt Pack Store",
        tagline: "Sell $9–$49 prompt packs on Gumroad",
        description: "Package proven prompts into bundles (marketing, sales, design) and sell on Gumroad / Etsy.",
        whyFit: "Digital product = infinite margin, easy to start solo today.",
        startupCost: "Free",
        timeToIncome: "1–2 weeks",
        firstMilestones: ["Pick a niche", "Build 25 prompts", "List on Gumroad", "Make first sale"],
        isPro: false, path: "ai", incomeRange: "$0 – $2k / mo",
      },
      pool: [
        { title: "Pick a niche", description: "Marketing, sales, design, etc.", category: "focus", difficulty: 1 },
        { title: "Build 25 prompts", description: "Test + refine each one.", category: "skill", difficulty: 2 },
        { title: "Design a cover", description: "Simple Canva mockup.", category: "skill", difficulty: 1 },
        { title: "List on Gumroad", description: "Set price between $9–$29.", category: "hustle", difficulty: 1 },
        { title: "Post launch tweet", description: "Show the result + link.", category: "hustle", difficulty: 1 },
        { title: "Collect 3 reviews", description: "Ask early buyers for feedback.", category: "growth", difficulty: 1 },
      ],
    },
  ];
}

function inPersonPool(): Option[] {
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
    {
      idea: {
        id: "lawn-care-route",
        name: "Weekend Lawn Care",
        tagline: "$30–$80 mows on a tight neighborhood route",
        description: "Solo mow-and-go service on weekends. Start with a borrowed mower and build a tight route in your zip code.",
        whyFit: "Low barrier, instant cash, easy to scale to a crew later.",
        startupCost: "Under $100",
        timeToIncome: "This weekend",
        firstMilestones: ["Print 50 flyers", "Mow 1 free lawn for photos", "Book 3 paying lawns", "Lock in 5 weekly clients"],
        isPro: false, path: "in_person", incomeRange: "$200 – $1,200 / mo",
      },
      pool: [
        { title: "Print 50 flyers", description: "Simple flyer with rate + phone.", category: "focus", difficulty: 1 },
        { title: "Drop flyers on 25 doors", description: "Stick to one tight neighborhood.", category: "hustle", difficulty: 2 },
        { title: "Mow 1 free lawn", description: "Free job for photos + review.", category: "hustle", difficulty: 2 },
        { title: "Post in local FB group", description: "Offer first 3 mows at a discount.", category: "growth", difficulty: 1 },
        { title: "Take before/after pics", description: "Build a tiny portfolio.", category: "growth", difficulty: 1 },
        { title: "Lock in next week", description: "Text past clients for a recurring slot.", category: "hustle", difficulty: 1 },
      ],
    },
    {
      idea: {
        id: "handyman-route",
        name: "Handyman Hustle",
        tagline: "$50–$200 small jobs neighbors actually need",
        description: "Mount TVs, assemble furniture, fix leaky faucets — small jobs at premium pricing in your neighborhood.",
        whyFit: "Constant demand, repeat clients, almost no startup cost if you own basic tools.",
        startupCost: "$0 – $200",
        timeToIncome: "This week",
        firstMilestones: ["List your services", "Post on Nextdoor + Thumbtack", "Book first 3 jobs", "Collect 5 reviews"],
        isPro: false, path: "in_person", incomeRange: "$400 – $2,500 / mo",
      },
      pool: [
        { title: "List your services", description: "Pick 5 jobs you're confident doing.", category: "focus", difficulty: 1 },
        { title: "Set up Thumbtack profile", description: "Photos + clear pricing.", category: "skill", difficulty: 2 },
        { title: "Post on Nextdoor", description: "Friendly intro post in your area.", category: "hustle", difficulty: 1 },
        { title: "Quote 3 leads", description: "Reply fast — speed wins jobs.", category: "hustle", difficulty: 2 },
        { title: "Ask for a review", description: "Text past helpers/family for one.", category: "growth", difficulty: 1 },
        { title: "Build a tool checklist", description: "Know what's in your kit.", category: "focus", difficulty: 1 },
      ],
    },
    {
      idea: {
        id: "vending-route",
        name: "Vending Machine Route",
        tagline: "Passive $1k–$5k/mo from a small route of machines",
        description: "Place vending machines in offices, gyms, and laundromats. Restock weekly and collect cash.",
        whyFit: "Semi-passive once placed. Each machine is a tiny business.",
        startupCost: "$1,500 – $4,000",
        timeToIncome: "3–6 weeks",
        firstMilestones: ["Find 1 location", "Buy first machine", "Stock + sign 6-mo agreement", "Add machine #2"],
        isPro: true, path: "in_person", incomeRange: "$1k – $8k / mo",
      },
      pool: [
        { title: "Map 20 locations", description: "List gyms, offices, laundromats nearby.", category: "focus", difficulty: 2 },
        { title: "Cold call 5 locations", description: "Pitch a no-cost machine.", category: "hustle", difficulty: 3 },
        { title: "Spec your first machine", description: "Pick combo vs snack vs drink.", category: "skill", difficulty: 2 },
        { title: "Write a placement agreement", description: "Simple 1-page contract.", category: "skill", difficulty: 2 },
        { title: "Source product wholesale", description: "Open Sam's Club / Costco account.", category: "hustle", difficulty: 2 },
        { title: "Schedule restock day", description: "Pick a weekly route day.", category: "focus", difficulty: 1 },
      ],
    },
    {
      idea: {
        id: "junk-removal-pro",
        name: "Junk Removal Pro",
        tagline: "$200–$800 hauls with a truck + a friend",
        description: "Same-day junk removal service. Premium pricing for fast, friendly hauling.",
        whyFit: "High ticket, repeat referrals, scales with crew + trucks.",
        startupCost: "$500 – $3,000",
        timeToIncome: "1–2 weeks",
        firstMilestones: ["Get a truck or trailer", "Set up Google profile", "Quote 10 jobs", "Book first 3 hauls"],
        isPro: true, path: "in_person", incomeRange: "$4k – $20k / mo",
      },
      pool: [
        { title: "Set up Google profile", description: "Local SEO = inbound leads.", category: "growth", difficulty: 2 },
        { title: "Build a simple booking page", description: "Square or Jobber form.", category: "skill", difficulty: 2 },
        { title: "Post 3 before/afters", description: "Reels = social proof.", category: "growth", difficulty: 2 },
        { title: "Door-knock 20 homes", description: "Drop flyers in target zip.", category: "hustle", difficulty: 3 },
        { title: "Find a dump dropoff", description: "Know your cost per load.", category: "focus", difficulty: 1 },
        { title: "Pitch 5 realtors", description: "They're a referral goldmine.", category: "hustle", difficulty: 2 },
      ],
    },
    {
      idea: {
        id: "food-pop-up",
        name: "Weekend Food Pop-Up",
        tagline: "$500–$2k Saturday pop-ups serving one signature item",
        description: "Run a Saturday pop-up serving one signature dish at markets, parks, or community events.",
        whyFit: "High margin, fun, builds brand for a future food truck or storefront.",
        startupCost: "$400 – $1,500",
        timeToIncome: "2–4 weeks",
        firstMilestones: ["Lock in your one dish", "Get permits", "Find a Saturday spot", "Sell out your first event"],
        isPro: true, path: "in_person", incomeRange: "$2k – $10k / mo",
      },
      pool: [
        { title: "Lock in your one dish", description: "Pick a signature menu item.", category: "focus", difficulty: 2 },
        { title: "Research permits", description: "Cottage food / temp food permit.", category: "skill", difficulty: 2 },
        { title: "DM 5 event organizers", description: "Markets, festivals, popups.", category: "hustle", difficulty: 2 },
        { title: "Design your signage", description: "Canva menu + price board.", category: "skill", difficulty: 2 },
        { title: "Cost out one serving", description: "Know your unit economics.", category: "focus", difficulty: 2 },
        { title: "Run a friends + family test", description: "Cook 10 servings for feedback.", category: "hustle", difficulty: 2 },
      ],
    },
  ];
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function aiOptions(): Option[] {
  const pool = aiPool();
  const pros = shuffle(pool.filter((o) => o.idea.isPro)).slice(0, 2);
  const frees = shuffle(pool.filter((o) => !o.idea.isPro)).slice(0, 1);
  return [...pros, ...frees];
}

function inPersonOptions(): Option[] {
  const pool = inPersonPool();
  const pros = shuffle(pool.filter((o) => o.idea.isPro)).slice(0, 2);
  const frees = shuffle(pool.filter((o) => !o.idea.isPro)).slice(0, 1);
  return [...pros, ...frees];
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
      setProfileField("pendingProPick", opt.idea);
      setProfileField("pendingProPickPool", opt.pool);
      if (free) {
        setProfileField("pendingFreeAlt", free.idea);
        setProfileField("pendingFreeAltPool", free.pool);
      }
      setBusiness(opt.idea, opt.pool);
      router.push({ pathname: "/onboarding/email", params: { initialPlan: "premium", initialCycle: "monthly", requirePro: "1" } });
    } else {
      setProfileField("pendingProPick", null);
      setProfileField("pendingProPickPool", []);
      setProfileField("pendingFreeAlt", null);
      setProfileField("pendingFreeAltPool", []);
      setBusiness(opt.idea, opt.pool);
      router.push({ pathname: "/onboarding/email", params: { initialPlan: "base", initialCycle: "monthly" } });
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
        <View style={styles.guideNote}>
          <Sparkles size={14} color={Colors.accentDeep} />
          <Text style={styles.guideNoteText}>We'll guide you through the process of creating one of these businesses, step by step.</Text>
        </View>
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
  guideNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(212,175,55,0.10)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.30)",
    marginBottom: 4,
  },
  guideNoteText: { flex: 1, color: Colors.text, fontSize: 12.5, fontWeight: "700", lineHeight: 17 },
});
