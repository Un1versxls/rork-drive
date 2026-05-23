import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Colors } from "@/constants/colors";

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level error boundary. Catches any crash inside the React tree and
 * shows a recovery screen instead of letting the whole app die at launch.
 *
 * Includes a "Reset app data" button so a user stuck in a bad persisted
 * state can self-recover without reinstalling.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }): void {
    console.log("[ErrorBoundary] caught", error?.message, info?.componentStack);
  }

  handleReset = async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.log("[ErrorBoundary] AsyncStorage.clear failed", e);
    }
    this.setState({ error: null });
  };

  handleRetry = (): void => {
    this.setState({ error: null });
  };

  render(): React.ReactNode {
    if (!this.state.error) return this.props.children;
    const msg = this.state.error?.message ?? "Unknown error";
    return (
      <View style={styles.root}>
        <View style={styles.card}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.sub}>The app hit an unexpected error. You can try again, or reset your local data if it keeps happening.</Text>
          <Text style={styles.errText} numberOfLines={4}>{msg}</Text>
          <Pressable onPress={this.handleRetry} style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]} testID="eb-retry">
            <Text style={styles.btnLabel}>Try again</Text>
          </Pressable>
          <Pressable onPress={this.handleReset} style={({ pressed }) => [styles.btnGhost, pressed && styles.btnGhostPressed]} testID="eb-reset">
            <Text style={styles.btnGhostLabel}>Reset app data</Text>
          </Pressable>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center", padding: 24 },
  card: {
    width: "100%",
    maxWidth: 420,
    padding: 22,
    borderRadius: 20,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eeeeee",
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 3 },
      default: {},
    }),
  },
  title: { color: Colors.text, fontSize: 22, fontWeight: "900", letterSpacing: -0.3 },
  sub: { color: Colors.textDim, fontSize: 14, lineHeight: 20 },
  errText: { color: Colors.textMuted, fontSize: 12, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", backgroundColor: "#f1f1f1", padding: 10, borderRadius: 10 },
  btn: { marginTop: 6, backgroundColor: Colors.text, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  btnPressed: { opacity: 0.85 },
  btnLabel: { color: "#fff", fontSize: 15, fontWeight: "900", letterSpacing: 0.3 },
  btnGhost: { borderRadius: 14, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: "#dcdcdc" },
  btnGhostPressed: { backgroundColor: "#f4f4f4" },
  btnGhostLabel: { color: Colors.text, fontSize: 14, fontWeight: "800" },
});
