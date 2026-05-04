import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Bitcoin, Briefcase, CandlestickChart, GraduationCap, LineChart, type LucideIcon, Target, TrendingUp, Wallet } from "lucide-react-native";

import { OnboardingShell } from "@/components/OnboardingShell";
import { OptionCard } from "@/components/OptionCard";
import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";
import { useApp } from "@/providers/AppProvider";
import type { BusinessIdea, DayTradingCapital, DayTradingMarket, DayTradingMode, TaskSeed } from "@/types";

const MODE_OPTIONS: { id: DayTradingMode; label: string; description: string; Icon: LucideIcon }[] = [
  { id: "hustle", label: "Start a side hustle", description: "I want to actually trade and make income", Icon: Briefcase },
  { id: "learn", label: "Learn the fundamentals", description: "I want to study before risking real money", Icon: GraduationCap },
];

const MARKET_OPTIONS: { id: DayTradingMarket; label: string; description: string; Icon: LucideIcon }[] = [
  { id: "stocks", label: "Stocks", description: "Equities, ETFs, blue chips", Icon: LineChart },
  { id: "crypto", label: "Crypto", description: "Bitcoin, Ethereum, alts \u2014 24/7", Icon: Bitcoin },
  { id: "forex", label: "Forex", description: "Currency pairs, deep liquidity", Icon: TrendingUp },
  { id: "options", label: "Options", description: "Leverage, defined risk plays", Icon: Target },
];

const CAPITAL_OPTIONS: { id: DayTradingCapital; label: string; description: string }[] = [
  { id: "under_500", label: "Under $500", description: "Starting small, paper-first" },
  { id: "500_2000", label: "$500 \u2013 $2,000", description: "Real money, tight risk" },
  { id: "2000_10000", label: "$2,000 \u2013 $10,000", description: "Building real positions" },
  { id: "10000_plus", label: "$10,000+", description: "Funded and scaling" },
];

const HUSTLE_TASKS: TaskSeed[] = [
  { title: "Open a broker account", description: "Pick a broker that fits your market and fund it.", category: "hustle", difficulty: 2 },
  { title: "Define your edge", description: "Write the exact setup you'll only take \u2014 nothing else.", category: "focus", difficulty: 2 },
  { title: "Set your risk per trade", description: "Decide a fixed % (1\u20132%) you'll risk on every trade.", category: "mindset", difficulty: 1 },
  { title: "Trade your plan today", description: "Execute only A+ setups. Skip if it's not there.", category: "hustle", difficulty: 3 },
  { title: "Journal every trade", description: "Screenshot, thesis, outcome \u2014 one row per trade.", category: "skill", difficulty: 1 },
  { title: "Review the tape", description: "Re-watch today's session \u2014 spot what you missed.", category: "skill", difficulty: 2 },
  { title: "Hit your daily loss limit", description: "Stop the moment you reach it. No revenge trades.", category: "mindset", difficulty: 1 },
  { title: "Compound one win", description: "Take a piece of profit and protect it \u2014 don't give it back.", category: "growth", difficulty: 2 },
];

const LEARN_TASKS: TaskSeed[] = [
  { title: "Study one chart pattern", description: "Pick a setup (flag, breakout, double-top) and find 5 examples.", category: "skill", difficulty: 2 },
  { title: "Read 10 mins on risk", description: "Position sizing, stops, and capital preservation.", category: "skill", difficulty: 1 },
  { title: "Paper-trade 30 minutes", description: "Practice on a sim \u2014 prove the edge before risking cash.", category: "skill", difficulty: 2 },
  { title: "Watch one market open", description: "Observe price action for the first 30 minutes.", category: "focus", difficulty: 1 },
  { title: "Backtest 20 setups", description: "Did your edge actually work historically?", category: "skill", difficulty: 3 },
  { title: "Take notes on a pro", description: "Watch a trader you respect \u2014 write 3 takeaways.", category: "mindset", difficulty: 1 },
  { title: "Define your daily loss limit", description: "Even on paper \u2014 build the discipline now.", category: "focus", difficulty: 1 },
  { title: "Write one trading rule", description: "One non-negotiable rule you'll never break.", category: "mindset", difficulty: 1 },
];

function buildPlan(mode: DayTradingMode, market: DayTradingMarket, capital: DayTradingCapital): { idea: BusinessIdea; pool: TaskSeed[] } {
  const marketLabel = MARKET_OPTIONS.find((m) => m.id === market)?.label ?? "Stocks";
  const capitalLabel = CAPITAL_OPTIONS.find((c) => c.id === capital)?.label ?? "Under $500";
  const pool = mode === "hustle" ? HUSTLE_TASKS : LEARN_TASKS;
  const idea: BusinessIdea = {
    id: `daytrading-${mode}-${market}`,
    name: mode === "hustle" ? `${marketLabel} Day Trader` : `${marketLabel} Trading Crash Course`,
    tagline: mode === "hustle"
      ? `Daily reps to trade ${marketLabel.toLowerCase()} with discipline`
      : `Learn ${marketLabel.toLowerCase()} trading the right way \u2014 no blowing up`,
    description: mode === "hustle"
      ? `A daily playbook for trading ${marketLabel.toLowerCase()} on ${capitalLabel} of capital. Tight risk, journaled trades, real reps.`
      : `A focused crash course on ${marketLabel.toLowerCase()} trading. Build the foundations \u2014 setups, risk, psychology \u2014 before going live.`,
    whyFit: mode === "hustle"
      ? `You're ready to trade. These tasks keep you disciplined while compounding edge.`
      : `You picked learn-first \u2014 the best traders study before they swing size. Smart move.`,
    startupCost: mode === "hustle" ? capitalLabel : "Free (paper)",
    timeToIncome: mode === "hustle" ? "30\u201390 days of consistency" : "Skill > income at first",
    firstMilestones: mode === "hustle"
      ? [
          "Open and fund your broker account",
          "Trade only your A+ setup for 14 days",
          "Hit a 7-day green week (any size)",
          "Journal 30 trades and review patterns",
        ]
      : [
          "Finish your first 7 days without skipping",
          "Backtest 50 historical setups",
          "Paper-trade 2 weeks profitably",
          "Write your full trading playbook",
        ],
  };
  return { idea, pool };
}

export default function DayTradingScreen() {
  const router = useRouter();
  const { state, setAnswers, setBusiness, setProfileField } = useApp();
  const [mode, setMode] = useState<DayTradingMode | null>(state.profile.dayTradingMode);
  const [market, setMarket] = useState<DayTradingMarket | null>(state.profile.dayTradingMarket);
  const [capital, setCapital] = useState<DayTradingCapital | null>(state.profile.dayTradingCapital);

  const ready = !!mode && !!market && !!capital;

  const onContinue = () => {
    if (!mode || !market || !capital) return;
    setAnswers({ goal: "day_trading" });
    setProfileField("dayTradingMode", mode);
    setProfileField("dayTradingMarket", market);
    setProfileField("dayTradingCapital", capital);
    const plan = buildPlan(mode, market, capital);
    setBusiness(plan.idea, plan.pool);
    router.push("/onboarding/experience");
  };

  return (
    <OnboardingShell
      step={2}
      total={11}
      title="Set up your day-trading plan."
      subtitle="Three quick questions \u2014 we'll build your daily playbook."
      canGoBack
      footer={
        <GradientButton
          title="Continue"
          disabled={!ready}
          onPress={onContinue}
          testID="cta-continue"
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <CandlestickChart color={Colors.accentGold} size={22} />
          </View>
          <Text style={styles.heroTitle}>Day Trading</Text>
          <Text style={styles.heroSub}>
            Discipline beats prediction. We'll set up daily tasks tuned to how you want to trade.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>I want to...</Text>
        {MODE_OPTIONS.map((o) => (
          <OptionCard
            key={o.id}
            label={o.label}
            description={o.description}
            Icon={o.Icon}
            selected={mode === o.id}
            onPress={() => setMode(o.id)}
            testID={`dt-mode-${o.id}`}
          />
        ))}

        <Text style={[styles.sectionLabel, { marginTop: 18 }]}>Market</Text>
        {MARKET_OPTIONS.map((o) => (
          <OptionCard
            key={o.id}
            label={o.label}
            description={o.description}
            Icon={o.Icon}
            selected={market === o.id}
            onPress={() => setMarket(o.id)}
            testID={`dt-market-${o.id}`}
          />
        ))}

        <Text style={[styles.sectionLabel, { marginTop: 18 }]}>Starting capital</Text>
        {CAPITAL_OPTIONS.map((o) => (
          <OptionCard
            key={o.id}
            label={o.label}
            description={o.description}
            Icon={Wallet}
            selected={capital === o.id}
            onPress={() => setCapital(o.id)}
            testID={`dt-capital-${o.id}`}
          />
        ))}
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 18 },
  heroCard: {
    alignItems: "center",
    padding: 20,
    borderRadius: 18,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eeeeee",
    marginBottom: 18,
  },
  heroIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(212,175,55,0.14)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 10,
  },
  heroTitle: { color: Colors.text, fontSize: 20, fontWeight: "900", letterSpacing: -0.4 },
  heroSub: { color: Colors.textDim, fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 6 },
  sectionLabel: {
    color: Colors.textDim, fontSize: 11, fontWeight: "900",
    letterSpacing: 1.2, textTransform: "uppercase",
    marginBottom: 10, paddingHorizontal: 2,
  },
});
