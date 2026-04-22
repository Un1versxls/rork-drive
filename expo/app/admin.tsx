import React, { useState } from "react";
import { Alert, FlatList, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";

interface AccountRow {
  id: string;
  email: string;
  is_admin: boolean;
  is_dev: boolean;
  admin_granted_premium: boolean;
  granted_premium_plan: "base" | "premium" | null;
  created_at: string;
}

interface CodeRow {
  code: string;
  plan: "base" | "premium";
  max_uses: number;
  uses: number;
  active: boolean;
}

export default function AdminScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user, booting } = useAuth();
  const [newCode, setNewCode] = useState<string>("");
  const [newCodePlan, setNewCodePlan] = useState<"base" | "premium">("premium");
  const [newCodeUses, setNewCodeUses] = useState<string>("1");

  const isAdmin = user?.isAdmin === true;

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: async (): Promise<AccountRow[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase.from("user_accounts").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return (data ?? []) as AccountRow[];
    },
    enabled: isAdmin,
  });

  const codesQuery = useQuery({
    queryKey: ["admin-codes"],
    queryFn: async (): Promise<CodeRow[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase.from("redeem_codes").select("*").order("code", { ascending: true }).limit(200);
      if (error) throw error;
      return (data ?? []) as CodeRow[];
    },
    enabled: isAdmin,
  });

  const updateUser = useMutation({
    mutationFn: async (params: { id: string; patch: Partial<AccountRow> }) => {
      if (!supabase) return;
      const { error } = await supabase.from("user_accounts").update(params.patch).eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const createCode = useMutation({
    mutationFn: async () => {
      if (!supabase) return;
      const code = newCode.trim().toUpperCase();
      const max = Math.max(1, parseInt(newCodeUses || "1", 10));
      const { error } = await supabase.from("redeem_codes").insert({ code, plan: newCodePlan, max_uses: max });
      if (error) throw error;
    },
    onSuccess: () => { setNewCode(""); qc.invalidateQueries({ queryKey: ["admin-codes"] }); },
  });

  const toggleCode = useMutation({
    mutationFn: async (params: { code: string; active: boolean }) => {
      if (!supabase) return;
      const { error } = await supabase.from("redeem_codes").update({ active: params.active }).eq("code", params.code);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-codes"] }),
  });

  if (booting) return null;

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <Text style={styles.title}>Admin only</Text>
          <Text style={styles.sub}>Your account doesn&apos;t have admin access.</Text>
          <Pressable onPress={() => router.back()} style={styles.linkBtn}><Text style={styles.link}>Back</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["bottom"]}>
      <FlatList
        data={usersQuery.data ?? []}
        keyExtractor={(u) => u.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <Text style={styles.h2}>Redeem codes</Text>
            <View style={styles.card}>
              <TextInput
                value={newCode}
                onChangeText={(s) => setNewCode(s.toUpperCase())}
                placeholder="NEW CODE"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
                style={styles.input}
              />
              <View style={styles.row}>
                <Pressable onPress={() => setNewCodePlan("base")} style={[styles.pill, newCodePlan === "base" && styles.pillOn]}>
                  <Text style={[styles.pillText, newCodePlan === "base" && styles.pillTextOn]}>Base</Text>
                </Pressable>
                <Pressable onPress={() => setNewCodePlan("premium")} style={[styles.pill, newCodePlan === "premium" && styles.pillOn]}>
                  <Text style={[styles.pillText, newCodePlan === "premium" && styles.pillTextOn]}>Premium</Text>
                </Pressable>
                <TextInput
                  value={newCodeUses}
                  onChangeText={setNewCodeUses}
                  placeholder="uses"
                  keyboardType="number-pad"
                  placeholderTextColor={Colors.textMuted}
                  style={[styles.input, { flex: 0, width: 80, paddingVertical: 10 }]}
                />
              </View>
              <GradientButton title="Create code" onPress={() => createCode.mutate()} disabled={!newCode} />
            </View>

            {(codesQuery.data ?? []).map((c) => (
              <View key={c.code} style={styles.codeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.codeText}>{c.code}</Text>
                  <Text style={styles.codeMeta}>{c.plan.toUpperCase()} · {c.uses}/{c.max_uses} used</Text>
                </View>
                <Switch value={c.active} onValueChange={(v) => toggleCode.mutate({ code: c.code, active: v })} />
              </View>
            ))}

            <Text style={[styles.h2, { marginTop: 22 }]}>Users ({usersQuery.data?.length ?? 0})</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <Text style={styles.userEmail}>{item.email}</Text>
            <Text style={styles.userId}>{item.id}</Text>
            <View style={styles.toggleRow}>
              <Toggle label="Admin" value={item.is_admin} onChange={(v) => updateUser.mutate({ id: item.id, patch: { is_admin: v } })} />
              <Toggle label="Dev" value={item.is_dev} onChange={(v) => updateUser.mutate({ id: item.id, patch: { is_dev: v } })} />
              <Toggle
                label="Premium"
                value={item.admin_granted_premium}
                onChange={(v) => updateUser.mutate({ id: item.id, patch: { admin_granted_premium: v, granted_premium_plan: v ? "premium" : null } })}
              />
            </View>
            <Pressable
              onPress={() => {
                const doRevoke = () => updateUser.mutate({ id: item.id, patch: { admin_granted_premium: false, granted_premium_plan: null, is_dev: false } });
                if (Platform.OS === "web") { if (confirm("Revoke access for " + item.email + "?")) doRevoke(); return; }
                Alert.alert("Revoke?", `Revoke premium & dev access for ${item.email}?`, [
                  { text: "Cancel", style: "cancel" },
                  { text: "Revoke", style: "destructive", onPress: doRevoke },
                ]);
              }}
              style={({ pressed }) => [styles.revoke, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.revokeText}>Revoke access</Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggle}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: Colors.text, false: "#e5e5e5" }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  title: { color: Colors.text, fontSize: 24, fontWeight: "900" },
  sub: { color: Colors.textDim, fontSize: 14, marginTop: 6, textAlign: "center" },
  linkBtn: { marginTop: 18 },
  link: { color: Colors.text, fontWeight: "700" },
  list: { padding: 20, paddingBottom: 40 },
  h2: { color: Colors.text, fontSize: 18, fontWeight: "900", marginBottom: 12 },
  card: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#eeeeee", backgroundColor: "#fafafa", gap: 10, marginBottom: 14 },
  input: { backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#eeeeee", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, color: Colors.text, flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#eeeeee" },
  pillOn: { backgroundColor: Colors.text, borderColor: Colors.text },
  pillText: { color: Colors.text, fontWeight: "700", fontSize: 13 },
  pillTextOn: { color: "#ffffff" },
  codeRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#eeeeee", marginBottom: 8 },
  codeText: { color: Colors.text, fontSize: 15, fontWeight: "900", letterSpacing: 0.5 },
  codeMeta: { color: Colors.textDim, fontSize: 12, marginTop: 2 },
  userCard: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#eeeeee", marginBottom: 10, backgroundColor: "#ffffff" },
  userEmail: { color: Colors.text, fontSize: 15, fontWeight: "800" },
  userId: { color: Colors.textMuted, fontSize: 11, fontWeight: "600", marginTop: 2 },
  toggleRow: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  toggle: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#eeeeee" },
  toggleLabel: { color: Colors.textDim, fontSize: 12, fontWeight: "700" },
  revoke: { alignSelf: "flex-start", marginTop: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: "rgba(196,69,69,0.3)", backgroundColor: "rgba(196,69,69,0.06)" },
  revokeText: { color: Colors.danger, fontSize: 12, fontWeight: "800" },
});
