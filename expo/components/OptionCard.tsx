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
        {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
        <View style={styles.textCol}>
          <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
          {description ? <Text style={styles.desc}>{description}</Text> : null}
        </View>
        <View style={[styles.check, selected && styles.checkSelected]}>
          {selected ? <Check color="#faf9f6" size={16} strokeWidth={3} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cardBg,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardSelected: {
    borderColor: Colors.accent,
    backgroundColor: "#fdfbf6",
    shadowColor: Colors.accent,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  emoji: { fontSize: 22 },
  textCol: { flex: 1 },
  label: { color: Colors.text, fontSize: 16, fontWeight: "700" },
  labelSelected: { color: Colors.text },
  desc: { color: Colors.textDim, fontSize: 13, marginTop: 2 },
  check: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkSelected: { backgroundColor: Colors.accent, borderColor: Colors.accent },
});
