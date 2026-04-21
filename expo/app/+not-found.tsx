import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";
import { BackgroundGlow } from "@/components/BackgroundGlow";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Lost the road" }} />
      <View style={styles.container}>
        <BackgroundGlow />
        <Text style={styles.title}>You took a wrong turn</Text>
        <Text style={styles.text}>This screen doesn&apos;t exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Back to DRIVE</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: Colors.bg },
  title: { fontSize: 22, fontWeight: "800", color: Colors.text, marginBottom: 8 },
  text: { color: Colors.textDim, marginBottom: 24 },
  link: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 999, backgroundColor: Colors.primarySoft },
  linkText: { color: Colors.primary, fontWeight: "700" },
});
