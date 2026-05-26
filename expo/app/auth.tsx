import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, Platform, Pressable, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, ScrollView } from "react-native";
import { RefreshCcw } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";

import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/providers/AuthProvider";
import { useApp } from "@/providers/AppProvider";
import { fetchAppUser } from "@/lib/appUserTracking";

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp, signInPending, signUpPending, signInWithApple, signInWithApplePending, ready } = useAuth();
  const { hydrateFromAppUser, setProfileField } = useApp();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncLabel, setSyncLabel] = useState<string>("Syncing your account…");
  const [syncPercent, setSyncPercent] = useState<number>(0);
  const [syncDone, setSyncDone] = useState<boolean>(false);

  const busy = signInPending || signUpPending || signInWithApplePending;

  const syncAfterAuth = async (userId: string, userEmail: string | null) => {
    setSyncLabel("Connecting to your account…");
    setSyncPercent(0);
    setSyncDone(false);
    setSyncing(true);
    try {
      // Animate progress in steps so the user sees real momentum.
      const step = (to: number, label: string, ms: number) =>
        new Promise<void>((resolve) => {
          setSyncLabel(label);
          const start = Date.now();
          const from = to - 25;
          const tick = () => {
            const t = Math.min(1, (Date.now() - start) / ms);
            const eased = 1 - Math.pow(1 - t, 2);
            setSyncPercent(Math.round(from + (to - from) * eased));
            if (t < 1) requestAnimationFrame(tick);
            else resolve();
          };
          tick();
        });

      await step(25, "Connecting to your account…", 500);
      const row = await fetchAppUser({ userId, email: userEmail });
      await step(60, "Loading your tasks…", 600);
      if (row) hydrateFromAppUser(row);
      await step(85, "Restoring streak & badges…", 600);
      await step(100, "Almost there…", 500);
      setSyncDone(true);
    } catch (e) {
      console.log("[auth] post-signin hydrate err", e);
      setSyncPercent(100);
      setSyncDone(true);
    }
  };

  const onSubmit = async () => {
    setError(null);
    if (!email.includes("@") || password.length < 6) {
      setError("Enter a valid email and a password with at least 6 characters.");
      return;
    }
    if (mode === "signup" && name.trim().length < 2) {
      setError("Enter your name to create an account.");
      return;
    }
    try {
      if (mode === "signup") {
        const res = await signUp({ email, password, name: name.trim() });
        if (res?.user) {
          await syncAfterAuth(res.user.id, res.user.email ?? email);
        }
      } else {
        const res = await signIn({ email, password });
        if (res?.user) {
          await syncAfterAuth(res.user.id, res.user.email ?? email);
        }
      }
      // Note: we do NOT router.back() — the user must close & reopen the app
      // so all providers re-hydrate cleanly. The sync overlay stays up.
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
    }
  };

  const onApple = async () => {
    setError(null);
    try {
      const { userId, email: appleEmail, name: appleName } = await signInWithApple();
      if (appleEmail) setProfileField("email", appleEmail.toLowerCase());
      if (appleName) setProfileField("name", appleName);
      await syncAfterAuth(userId, appleEmail);
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err?.code === "ERR_REQUEST_CANCELED") return;
      const msg = err?.message ?? "Apple sign in failed";
      setError(msg);
    }
  };

  if (!ready) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <Text style={styles.title}>Accounts unavailable</Text>
          <Text style={styles.sub}>We couldn&apos;t connect to the server. Try again later.</Text>
          <Pressable onPress={() => router.back()} style={styles.linkBtn}>
            <Text style={styles.link}>Close</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (syncing) {
    return <SyncOverlay label={syncLabel} percent={syncPercent} done={syncDone} />;
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.close}><Text style={styles.closeText}>✕</Text></Pressable>

          <Text style={styles.title}>{mode === "signin" ? "Welcome back." : "Create account."}</Text>
          <Text style={styles.sub}>Sync your progress across devices.</Text>

          {Platform.OS === "ios" ? (
            <View style={styles.appleWrap}>
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={
                  mode === "signin"
                    ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                    : AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
                }
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={14}
                style={styles.appleBtn}
                onPress={onApple}
              />
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>
            </View>
          ) : null}

          <View style={styles.form}>
            {mode === "signup" ? (
              <>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="words"
                  autoComplete="name"
                  style={styles.input}
                />
                <View style={{ height: 14 }} />
              </>
            ) : null}
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              style={styles.input}
            />
            <Text style={[styles.label, { marginTop: 14 }]}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              style={styles.input}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={{ height: 18 }} />
            <GradientButton
              title={mode === "signin" ? "Sign in" : "Create account"}
              onPress={onSubmit}
              loading={busy}
            />
            <Pressable onPress={() => setMode(mode === "signin" ? "signup" : "signin")} style={styles.linkBtn}>
              <Text style={styles.link}>
                {mode === "signin" ? "No account? Create one" : "Have an account? Sign in"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function SyncOverlay({ label, percent, done }: { label: string; percent: number; done: boolean }) {
  const spin = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const barWidth = useRef(new Animated.Value(0)).current;
  const donePulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 240, useNativeDriver: true }).start();
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, [spin, fade]);

  useEffect(() => {
    Animated.timing(barWidth, {
      toValue: percent,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percent, barWidth]);

  useEffect(() => {
    if (!done) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(donePulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(donePulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, [done, donePulse]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const widthInterp = barWidth.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });
  const iconScale = donePulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <View style={overlay.root}>
      <Animated.View style={[overlay.center, { opacity: fade }]} testID="sync-overlay">
        {!done ? (
          <>
            <View style={overlay.ringWrap}>
              <Animated.View style={[overlay.ring, { transform: [{ rotate }] }]} />
              <ActivityIndicator color={Colors.accentGold} size="small" style={overlay.spinner} />
            </View>
            <Text style={overlay.title}>{label}</Text>
            <View style={overlay.barWrap}>
              <Animated.View style={[overlay.barFill, { width: widthInterp }]} />
            </View>
            <Text style={overlay.percent}>{percent}%</Text>
            <Text style={overlay.sub}>Hang tight — pulling your latest progress.</Text>
          </>
        ) : (
          <>
            <Animated.View style={[overlay.doneIcon, { transform: [{ scale: iconScale }] }]}>
              <RefreshCcw color={Colors.accentGold} size={30} strokeWidth={2.4} />
            </Animated.View>
            <Text style={overlay.title}>You&apos;re all synced.</Text>
            <Text style={overlay.doneCopy}>
              Please <Text style={overlay.bold}>close and reopen DRIVE</Text> to finish loading your updated profile.
            </Text>
            <View style={overlay.steps}>
              <View style={overlay.stepRow}><Text style={overlay.stepDot}>1.</Text><Text style={overlay.stepText}>Swipe up to close DRIVE</Text></View>
              <View style={overlay.stepRow}><Text style={overlay.stepDot}>2.</Text><Text style={overlay.stepText}>Reopen from your home screen</Text></View>
              <View style={overlay.stepRow}><Text style={overlay.stepDot}>3.</Text><Text style={overlay.stepText}>Your tasks & streak will be there</Text></View>
            </View>
            <Text style={overlay.lock}>The app is locked until you reopen it.</Text>
          </>
        )}
      </Animated.View>
    </View>
  );
}

const overlay = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  ringWrap: { width: 84, height: 84, alignItems: "center", justifyContent: "center", marginBottom: 22 },
  ring: {
    position: "absolute",
    width: 84, height: 84, borderRadius: 42,
    borderWidth: 3,
    borderColor: "rgba(212,175,55,0.15)",
    borderTopColor: Colors.accentGold,
  },
  spinner: { opacity: 0.6 },
  title: { color: Colors.text, fontSize: 19, fontWeight: "900", letterSpacing: -0.2, textAlign: "center" },
  sub: { color: Colors.textDim, fontSize: 13, marginTop: 12, textAlign: "center", fontWeight: "600" },
  barWrap: {
    width: 240, height: 8, borderRadius: 6,
    backgroundColor: "#f3eccc",
    overflow: "hidden", marginTop: 18,
  },
  barFill: {
    height: 8, borderRadius: 6,
    backgroundColor: Colors.accentGold,
  },
  percent: { color: Colors.accentDeep, fontSize: 13, fontWeight: "900", letterSpacing: 0.6, marginTop: 10 },
  doneIcon: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#fffaeb",
    borderWidth: 1.5, borderColor: "rgba(212,175,55,0.4)",
    marginBottom: 22,
    shadowColor: "#d4af37", shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 6 },
  },
  doneCopy: { color: Colors.textDim, fontSize: 14, lineHeight: 20, marginTop: 12, textAlign: "center", fontWeight: "600" },
  bold: { color: Colors.text, fontWeight: "900" },
  steps: { marginTop: 22, alignSelf: "stretch", gap: 10, paddingHorizontal: 12 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  stepDot: { color: Colors.accentDeep, fontSize: 13, fontWeight: "900", width: 18 },
  stepText: { color: Colors.text, fontSize: 13, fontWeight: "700", flex: 1 },
  lock: { color: Colors.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 26 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  scroll: { padding: 24, flexGrow: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  close: { alignSelf: "flex-end", width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  closeText: { color: Colors.textDim, fontSize: 22 },
  title: { color: Colors.text, fontSize: 30, fontWeight: "900", letterSpacing: -0.5, marginTop: 8 },
  sub: { color: Colors.textDim, fontSize: 15, marginTop: 6 },
  appleWrap: { marginTop: 24 },
  appleBtn: { width: "100%", height: 52 },
  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#eeeeee" },
  dividerText: { color: Colors.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  form: { marginTop: 18 },
  label: { color: Colors.textDim, fontSize: 12, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8 },
  input: {
    backgroundColor: "#ffffff", borderWidth: 1.5, borderColor: "#eeeeee",
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: Colors.text,
  },
  error: { color: Colors.danger, marginTop: 12, fontSize: 13, fontWeight: "600" },
  linkBtn: { alignSelf: "center", paddingVertical: 14, marginTop: 6 },
  link: { color: Colors.text, fontWeight: "700", fontSize: 14 },
});
