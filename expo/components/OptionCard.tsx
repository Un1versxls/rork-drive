import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check } from "lucide-react-native";

import { Colors } from "@/constants/colors";
import { triggerHaptic } from "@/lib/haptics";

interface Props {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  emoji?: string;
  testID?: string;
}

export function OptionCard({ label, description, selected, onPress, emoji, testID }: Props) {
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
        {emoji ? (
          <View style={styles.emojiWrap}>
            <Text style={styles.emoji}>{emoji}</Text>
          </View>
        ) : null}
        <View style={styles.textCol}>
          <Text style={styles.label}>{label}</Text>
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
  emoji: { fontSize: 22, color: Colors.accentGold },
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
});
