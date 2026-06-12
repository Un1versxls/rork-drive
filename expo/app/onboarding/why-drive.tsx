import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Check, Minus } from "lucide-react-native";

import { OnboardingStory } from "@/components/OnboardingStory";
import { Colors } from "@/constants/colors";

interface RowData {
  label: string;
  drive: boolean;
  others: boolean;
}

const ROWS: RowData[] = [
  { label: "Tells you exactly what to do today", drive: true, others: false },
  { label: "Built around your goal & schedule", drive: true, others: false },
  { label: "A coach when you get stuck", drive: true, others: false },
  { label: "Streaks that keep you showing up", drive: true, others: true },
  { label: "Endless setup before you start", drive: false, others: true },
];

/**
 * Premium comparison shown to everyone after the productivity question.
 * Simple, clean two-column table: DRIVE vs. a typical productivity app.
 */
export default function WhyDriveScreen() {
  const router = useRouter();

  return (
    <OnboardingStory
      eyebrow="WHY DRIVE"
      title={"Other apps organize.\nDRIVE moves you."}
      subtitle="Most apps hand you an empty page. DRIVE hands you the next step."
      prev="/onboarding/used-apps"
      ctaTitle="Let's set it up"
      onContinue={() => router.push("/onboarding/age")}
    >
      <View style={styles.table}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }} />
          <View style={[styles.colHead, styles.colDrive]}>
            <Text style={styles.colHeadDrive}>DRIVE</Text>
          </View>
          <View style={styles.colHead}>
            <Text style={styles.colHeadOther}>Others</Text>
          </View>
        </View>

        {ROWS.map((r, i) => (
          <Row key={r.label} data={r} index={i} last={i === ROWS.length - 1} />
        ))}
      </View>

      <Text style={styles.footnote}>Built to end the &ldquo;what do I even do now?&rdquo; feeling for good.</Text>
    </OnboardingStory>
  );
}

function Row({ data, index, last }: { data: RowData; index: number; last: boolean }) {
  const fade = useRef(new Animated.Value(0)).current;
  const shift = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(120 + index * 90),
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.timing(shift, { toValue: 0, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();
  }, [fade, shift, index]);

  return (
    <Animated.View style={[styles.row, !last && styles.rowBorder, { opacity: fade, transform: [{ translateY: shift }] }]}>
      <Text style={styles.rowLabel}>{data.label}</Text>
      <View style={[styles.cell, styles.colDrive]}>
        <Mark on={data.drive} gold />
      </View>
      <View style={styles.cell}>
        <Mark on={data.others} />
      </View>
    </Animated.View>
  );
}

function Mark({ on, gold }: { on: boolean; gold?: boolean }) {
  if (on) {
    return (
      <View style={[styles.markOn, gold && styles.markGold]}>
        <Check size={14} color="#ffffff" strokeWidth={3.5} />
      </View>
    );
  }
  return (
    <View style={styles.markOff}>
      <Minus size={14} color={Colors.textMuted} strokeWidth={3} />
    </View>
  );
}

const COL_W = 64;

const styles = StyleSheet.create({
  table: {
    borderRadius: 22,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#eeeeee",
    paddingHorizontal: 16,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  headerRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  colHead: { width: COL_W, alignItems: "center" },
  colDrive: {
    backgroundColor: "rgba(212,175,55,0.08)",
    borderRadius: 12,
  },
  colHeadDrive: { color: Colors.accentDeep, fontSize: 12, fontWeight: "900", letterSpacing: 0.6 },
  colHeadOther: { color: Colors.textMuted, fontSize: 12, fontWeight: "800", letterSpacing: 0.4 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#f3f3f3" },
  rowLabel: { flex: 1, color: Colors.text, fontSize: 13.5, fontWeight: "700", lineHeight: 18, paddingRight: 8 },
  cell: { width: COL_W, alignItems: "center" },
  markOn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#cfcfcf",
    alignItems: "center",
    justifyContent: "center",
  },
  markGold: {
    backgroundColor: Colors.accentGold,
    shadowColor: "#d4af37",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  markOff: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#f3f3f3",
    alignItems: "center",
    justifyContent: "center",
  },
  footnote: { color: Colors.textMuted, fontSize: 11.5, marginTop: 16, lineHeight: 16, textAlign: "center" },
});
