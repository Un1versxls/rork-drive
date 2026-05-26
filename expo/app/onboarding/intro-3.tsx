import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { IntroSlide } from "@/components/IntroSlide";
import { Colors } from "@/constants/colors";

export default function Intro3() {
  return (
    <IntroSlide
      index={2}
      total={4}
      next="/onboarding/intro-4"
      prev="/onboarding/intro-2"
      title={"\u201CFirst $500 month in 3 weeks\u201D"}
      subtitle="The daily task system pushed me past every excuse I used to make."
    >
      <View style={styles.card}>
        <View style={styles.avatarRow}>
          <View style={[styles.avatar, { backgroundColor: "#fde68a" }]}>
            <Text style={styles.avatarText}>J</Text>
          </View>
          <View>
            <Text style={styles.name}>Jordan, 19</Text>
            <View style={styles.verifiedRow}>
              <View style={styles.dot} />
              <Text style={styles.verified}>Verified user</Text>
            </View>
          </View>
        </View>
      </View>
    </IntroSlide>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 22,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#eeeeee",
  },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { color: Colors.text, fontSize: 16, fontWeight: "900" },
  name: { color: Colors.text, fontSize: 15, fontWeight: "800" },
  verifiedRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#16a34a" },
  verified: { color: Colors.textDim, fontSize: 12, fontWeight: "700" },
});
