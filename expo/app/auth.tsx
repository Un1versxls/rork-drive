import React, { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/providers/AuthProvider";

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp, signInPending, signUpPending, ready } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const busy = signInPending || signUpPending;

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
        await signUp({ email, password, name: name.trim() });
        Alert.alert("Account created", "You're signed in and synced across devices.");
      } else {
        await signIn({ email, password });
      }
      router.back();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
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

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.close}><Text style={styles.closeText}>✕</Text></Pressable>

          <Text style={styles.title}>{mode === "signin" ? "Welcome back." : "Create account."}</Text>
          <Text style={styles.sub}>Sync your progress across devices.</Text>

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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  scroll: { padding: 24, flexGrow: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  close: { alignSelf: "flex-end", width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  closeText: { color: Colors.textDim, fontSize: 22 },
  title: { color: Colors.text, fontSize: 30, fontWeight: "900", letterSpacing: -0.5, marginTop: 8 },
  sub: { color: Colors.textDim, fontSize: 15, marginTop: 6 },
  form: { marginTop: 28 },
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
