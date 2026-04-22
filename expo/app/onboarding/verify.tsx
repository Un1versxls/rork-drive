import React, { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { OnboardingShell } from "@/components/OnboardingShell";
import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";

const CODE_LEN = 6;

export default function VerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = (params.email ?? "").toString();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LEN).fill(""));
  const [verifying, setVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState<number>(30);
  const [resending, setResending] = useState<boolean>(false);
  const inputs = useRef<Array<TextInput | null>>([]);

  const code = useMemo(() => digits.join(""), [digits]);
  const complete = code.length === CODE_LEN && /^\d{6}$/.test(code);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const setDigit = (i: number, val: string) => {
    const clean = val.replace(/\D/g, "");
    if (clean.length > 1) {
      const chars = clean.slice(0, CODE_LEN).split("");
      const next = Array(CODE_LEN).fill("");
      for (let j = 0; j < CODE_LEN; j++) next[j] = chars[j] ?? "";
      setDigits(next);
      const focusIdx = Math.min(chars.length, CODE_LEN - 1);
      inputs.current[focusIdx]?.focus();
      return;
    }
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < CODE_LEN - 1) inputs.current[i + 1]?.focus();
  };

  const onKeyPress = (i: number, key: string) => {
    if (key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
      const next = [...digits];
      next[i - 1] = "";
      setDigits(next);
    }
  };

  const onVerify = async () => {
    if (!complete || verifying) return;
    setVerifying(true);
    setError(null);
    try {
      if (!supabase) {
        router.replace("/onboarding/source");
        return;
      }
      const { error: vErr } = await supabase.auth.verifyOtp({
        email: email.toLowerCase(),
        token: code,
        type: "email",
      });
      if (vErr) {
        console.log("[verify] otp", vErr.message);
        setError("Invalid or expired code. Try again.");
        return;
      }
      router.replace("/onboarding/source");
    } catch (e) {
      console.log("[verify] exception", e);
      setError("Something went wrong. Try again.");
    } finally {
      setVerifying(false);
    }
  };

  const onResend = async () => {
    if (resendIn > 0 || resending || !supabase) return;
    setResending(true);
    setError(null);
    try {
      const { error: rErr } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase(),
        options: { shouldCreateUser: true },
      });
      if (rErr) {
        setError("Couldn't resend. Try again in a moment.");
        return;
      }
      setResendIn(30);
      setDigits(Array(CODE_LEN).fill(""));
      inputs.current[0]?.focus();
    } finally {
      setResending(false);
    }
  };

  return (
    <OnboardingShell
      step={10}
      total={12}
      title="Check your email"
      subtitle={`We sent a 6-digit code to ${email || "your email"}.`}
      footer={
        <GradientButton
          title={verifying ? "Verifying…" : "Verify & continue"}
          disabled={!complete || verifying}
          onPress={onVerify}
        />
      }
    >
      <View style={styles.wrap}>
        <View style={styles.row}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(r) => { inputs.current[i] = r; }}
              value={d}
              onChangeText={(t) => setDigit(i, t)}
              onKeyPress={(e) => onKeyPress(i, e.nativeEvent.key)}
              keyboardType={Platform.OS === "web" ? "numeric" : "number-pad"}
              maxLength={CODE_LEN}
              style={[styles.cell, d ? styles.cellFilled : null, error ? styles.cellError : null]}
              autoFocus={i === 0}
              textContentType="oneTimeCode"
              autoComplete={Platform.OS === "ios" ? "one-time-code" : "sms-otp"}
              testID={`otp-${i}`}
            />
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable onPress={onResend} disabled={resendIn > 0 || resending} style={styles.resendBtn}>
          <Text style={[styles.resendText, resendIn > 0 ? styles.resendDisabled : null]}>
            {resendIn > 0 ? `Resend code in ${resendIn}s` : resending ? "Sending…" : "Resend code"}
          </Text>
        </Pressable>

        <Text style={styles.hint}>Didn&apos;t get it? Check your spam folder.</Text>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  cell: {
    flex: 1,
    height: 64,
    borderWidth: 1.5,
    borderColor: "#eeeeee",
    borderRadius: 14,
    textAlign: "center",
    fontSize: 26,
    fontWeight: "800",
    color: Colors.text,
    backgroundColor: "#ffffff",
  },
  cellFilled: { borderColor: Colors.text },
  cellError: { borderColor: Colors.danger },
  error: { color: Colors.danger, fontSize: 13, marginTop: 16, fontWeight: "600", textAlign: "center" },
  resendBtn: { alignSelf: "center", marginTop: 22, paddingVertical: 10, paddingHorizontal: 14 },
  resendText: { color: Colors.text, fontWeight: "700", fontSize: 14 },
  resendDisabled: { color: Colors.textDim },
  hint: { color: Colors.textDim, fontSize: 12, marginTop: 8, textAlign: "center" },
});
