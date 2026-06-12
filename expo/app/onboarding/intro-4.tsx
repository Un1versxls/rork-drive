import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Brain, Flame, Target } from "lucide-react-native";
import { IntroSlide } from "@/components/IntroSlide";
import { Colors } from "@/constants/colors";

export default function Intro4() {
  return (
    <IntroSlide
      index={3}
      total={4}
      showDots={false}
      next="/onboarding/confidence"
      prev="/onboarding/experience"
      title="Why people pick DRIVE."
      subtitle="A focused system, not another to-do list."
    >
      <View style={styles.list}>
        <Row
          Icon={Target}
          title="Personal roadmap"
          body="Tasks built around your goal, time, and skill level."
        />
        <Row
          Icon={Brain}
          title="DRIVE AI coach"
          body="Get unstuck the moment you hit a wall — answers in seconds."
        />
        <Row
          Icon={Flame}
          title="Streaks that stick"
          body="Daily momentum, badges, and wins that keep you showing up."
        />
      </View>
    </IntroSlide>
  );
}

function Row({ Icon, title, body }: { Icon: React.ComponentType<{ color: string; size: number }>; title: string; body: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Icon color={Colors.accentGold} size={20} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { marginTop: 18, gap: 12, alignSelf: "stretch" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#eeeeee",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(212,175,55,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: Colors.text, fontSize: 15, fontWeight: "800" },
  body: { color: Colors.textDim, fontSize: 13, fontWeight: "600", marginTop: 2, lineHeight: 18 },
});
