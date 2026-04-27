import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check, Crown, type LucideIcon } from "lucide-react-native";

import { Colors } from "@/constants/colors";
import { triggerHaptic } from "@/lib/haptics";

interface Props {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  Icon?: LucideIcon;
  testID?: string;
  premium?: boolean;
}

export function OptionCard({ label, description, selected, onPress, Icon, testID, premium }: Props) {
  const handle = () => {
    triggerHaptic("select", true);
    onPress();
  };
  return (
    <Pressable
      onPress={handle}
      testID={testID}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.row}>
        {Icon ? (
          <View style={styles.emojiWrap}>
            <Icon color={Colors.accentGold} size={22} strokeWidth={2.2} />
          </View>
        ) : null}
        <View style={styles.textCol}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>{label}</Text>
            {premium ? (
              <View style={styles.premiumBadge}>
                <Crown color="#7a5a00" size={10} strokeWidth={2.6} />
                <Text style={styles.premiumText}>PREMIUM</Text>
              </View>
            ) : null}
          </View>
          {description ? <Text style={styles.desc}>{description}</Text> : null}
        </View>
        <View style={[styles.check, selected && styles.checkSelected]}>
          {selected ? <Check color="#ffffff" size={16} strokeWidth={3} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#eeeeee",
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  cardSelected: {
    borderColor: Colors.text,
    backgroundColor: "#ffffff",
  },
  pressed: { opacity: 0.9 },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  emojiWrap: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: "rgba(212,175,55,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  textCol: { flex: 1 },
  label: { color: Colors.text, fontSize: 16, fontWeight: "700" },
  desc: { color: Colors.textDim, fontSize: 13, marginTop: 2 },
  check: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 1.5, borderColor: "#e5e5e5",
    alignItems: "center", justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkSelected: { backgroundColor: Colors.text, borderColor: Colors.text },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(212,175,55,0.18)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.5)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  premiumText: { color: "#7a5a00", fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },
});
