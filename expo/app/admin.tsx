import React, { useMemo, useState } from "react";
import { Alert, LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, UIManager, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronDown, Search } from "lucide-react-native";

import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { blacklistDeviceId, unblacklistDeviceId } from "@/lib/deviceBlacklist";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AccountRow {
  id: string;
  email: string;
  is_admin: boolean;
  is_dev: boolean;
  admin_granted_premium: boolean;
  granted_premium_plan: "base" | "premium" | null;
  is_revoked?: boolean | null;
  last_device_id?: string | null;
  created_at: string;
}

interface AppUserStatsRow {
  id: string;
  user_id: string | null;
  email: string | null;
  name: string | null;
  age: number | null;
  streak: number | null;
  best_streak: number | null;
  points: number | null;
  business_switch_bonus: number | null;
  total_completed: number | null;
  total_sessions: number | null;
  sessions_today: number | null;
  avg_tasks_per_day: number | null;
  last_session_at: string | null;
  last_device_id?: string | null;
  state_blob: Record<string, unknown> | null;
}

interface CodeRow {
  code: string;
  plan: "base" | "premium";
  max_uses: number;
  uses: number;
  active: boolean;
}

interface BlacklistRow {
  device_id: string;
  reason: string | null;
  email: string | null;
  user_id: string | null;
  created_at: string;
}

export default function AdminScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user, booting } = useAuth();

  // Section open/closed state. Collapsed by default so a long list of
  // users doesn't dominate the screen.
  const [openCodes, setOpenCodes] = useState<boolean>(true);
  const [openStats, setOpenStats] = useState<boolean>(false);
  const [openUsers, setOpenUsers] = useState<boolean>(false);
  const [openBlacklist, setOpenBlacklist] = useState<boolean>(false);

  // Per-section search queries.
  const [codeSearch, setCodeSearch] = useState<string>("");
  const [statsSearch, setStatsSearch] = useState<string>("");
  const [userSearch, setUserSearch] = useState<string>("");
  const [blacklistSearch, setBlacklistSearch] = useState<string>("");

  const [newCode, setNewCode] = useState<string>("");
  const [newCodePlan, setNewCodePlan] = useState<"base" | "premium">("premium");
  const [newCodeUses, setNewCodeUses] = useState<string>("1");

  const isAdmin = user?.isAdmin === true;

  const toggle = (setter: (v: boolean) => void, current: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(180, "easeInEaseOut", "opacity"));
    setter(!current);
  };

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: async (): Promise<AccountRow[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase.from("user_accounts").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return (data ?? []) as AccountRow[];
    },
    enabled: isAdmin,
  });

  const codesQuery = useQuery({
    queryKey: ["admin-codes"],
    queryFn: async (): Promise<CodeRow[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase.from("redeem_codes").select("*").order("code", { ascending: true }).limit(500);
      if (error) throw error;
      return (data ?? []) as CodeRow[];
    },
    enabled: isAdmin,
  });

  const appUserStatsQuery = useQuery({
    queryKey: ["admin-app-users-stats"],
    queryFn: async (): Promise<AppUserStatsRow[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from("app_users")
        .select("*")
        .order("updated_at", { ascending: false, nullsFirst: false })
        .limit(1000);
      if (error) {
        console.log("[admin] app_users select error", error.message);
        throw error;
      }
      return (data ?? []) as AppUserStatsRow[];
    },
    enabled: isAdmin,
  });

  const blacklistQuery = useQuery({
    queryKey: ["admin-blacklist"],
    queryFn: async (): Promise<BlacklistRow[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase.from("blacklisted_devices").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) {
        console.log("[admin] blacklist select error", error.message);
        return [];
      }
      return (data ?? []) as BlacklistRow[];
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

  const editAppUser = useMutation({
    mutationFn: async (params: { id: string; blob: Record<string, unknown> | null; patch: { streak?: number; best_streak?: number; points?: number; business_switch_bonus?: number; age?: number } }) => {
      if (!supabase) return;
      const blob = (params.blob && typeof params.blob === "object") ? { ...params.blob } : {};
      const blobProfile = (blob.profile && typeof blob.profile === "object") ? { ...(blob.profile as Record<string, unknown>) } : {};
      const payload: Record<string, unknown> = { ...params.patch, updated_at: new Date().toISOString() };
      if (params.patch.streak !== undefined) blob.streak = params.patch.streak;
      if (params.patch.best_streak !== undefined) blob.bestStreak = params.patch.best_streak;
      if (params.patch.points !== undefined) blob.points = params.patch.points;
      if (params.patch.business_switch_bonus !== undefined) blobProfile.businessSwitchBonus = params.patch.business_switch_bonus;
      if (params.patch.age !== undefined) blobProfile.age = params.patch.age;
      blob.profile = blobProfile;
      payload.state_blob = blob;
      const { error } = await supabase.from("app_users").update(payload).eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-app-users-stats"] }),
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Update failed";
      Alert.alert("Update failed", msg);
    },
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

  /**
   * Revoke a user's access:
   *   1. Flip is_revoked + clear premium grants so 60s client refresh
   *      signs them out and shows the RevokedScreen.
   *   2. If we have their last_device_id (stamped at sign-in), add it
   *      to blacklisted_devices so a sign-up from that iPhone is
   *      blocked unless they use a dev-allowlisted email.
   */
  const revokeAccess = useMutation({
    mutationFn: async (row: AccountRow) => {
      if (!supabase) return;
      const { error } = await supabase
        .from("user_accounts")
        .update({
          is_revoked: true,
          revoked_at: new Date().toISOString(),
          admin_granted_premium: false,
          granted_premium_plan: null,
          is_dev: false,
        })
        .eq("id", row.id);
      if (error) throw error;
      // Look up the user's last device id from either table.
      let deviceId = row.last_device_id ?? null;
      if (!deviceId) {
        try {
          const { data } = await supabase
            .from("app_users")
            .select("last_device_id")
            .eq("user_id", row.id)
            .maybeSingle();
          deviceId = (data?.last_device_id as string | null) ?? null;
        } catch {}
      }
      if (deviceId) {
        await blacklistDeviceId({ deviceId, reason: "admin_revoked", userId: row.id, email: row.email });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-blacklist"] });
    },
    onError: (e: unknown) => Alert.alert("Revoke failed", e instanceof Error ? e.message : "Unknown error"),
  });

  const restoreAccess = useMutation({
    mutationFn: async (row: AccountRow) => {
      if (!supabase) return;
      const { error } = await supabase
        .from("user_accounts")
        .update({ is_revoked: false, revoked_at: null })
        .eq("id", row.id);
      if (error) throw error;
      if (row.last_device_id) await unblacklistDeviceId(row.last_device_id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-blacklist"] });
    },
  });

  const removeBlacklist = useMutation({
    mutationFn: async (deviceId: string) => {
      await unblacklistDeviceId(deviceId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-blacklist"] }),
  });

  const codes = codesQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const appUserStats = appUserStatsQuery.data ?? [];
  const blacklist = blacklistQuery.data ?? [];

  const filteredCodes = useMemo(() => {
    const q = codeSearch.trim().toLowerCase();
    if (!q) return codes;
    return codes.filter((c) => c.code.toLowerCase().includes(q) || c.plan.toLowerCase().includes(q));
  }, [codes, codeSearch]);

  const filteredStats = useMemo(() => {
    const q = statsSearch.trim().toLowerCase();
    if (!q) return appUserStats;
    return appUserStats.filter((r) => {
      const hay = [r.email, r.name, r.user_id, r.id].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [appUserStats, statsSearch]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => `${u.email} ${u.id}`.toLowerCase().includes(q));
  }, [users, userSearch]);

  const filteredBlacklist = useMemo(() => {
    const q = blacklistSearch.trim().toLowerCase();
    if (!q) return blacklist;
    return blacklist.filter((b) => `${b.device_id} ${b.email ?? ""} ${b.reason ?? ""}`.toLowerCase().includes(q));
  }, [blacklist, blacklistSearch]);

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
      <ScrollView
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/* Redeem codes ------------------------------------------------- */}
        <SectionHeader title={`Redeem codes (${codes.length})`} open={openCodes} onToggle={() => toggle(setOpenCodes, openCodes)} />
        {openCodes ? (
          <View>
            <View style={styles.card}>
              <TextInput
                value={newCode}
                onChangeText={(s) => setNewCode(s.toUpperCase())}
                placeholder="NEW CODE"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
                autoCorrect={false}
                style={styles.input}
                testID="admin-code-input"
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

            <SearchBar value={codeSearch} onChange={setCodeSearch} placeholder="Search codes…" />

            {filteredCodes.map((c) => (
              <View key={c.code} style={styles.codeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.codeText}>{c.code}</Text>
                  <Text style={styles.codeMeta}>{c.plan.toUpperCase()} · {c.uses}/{c.max_uses} used</Text>
                </View>
                <Switch value={c.active} onValueChange={(v) => toggleCode.mutate({ code: c.code, active: v })} />
              </View>
            ))}
            {filteredCodes.length === 0 ? <Text style={styles.empty}>No matches.</Text> : null}
          </View>
        ) : null}

        {/* Edit user data ---------------------------------------------- */}
        <SectionHeader title={`Edit user data (${appUserStats.length})`} open={openStats} onToggle={() => toggle(setOpenStats, openStats)} />
        {openStats ? (
          <View>
            <Text style={[styles.sub, { textAlign: "left", marginBottom: 10 }]}>Streak, points, bonuses, age. Applies live on the user&apos;s next refresh (within 60s).</Text>
            <SearchBar value={statsSearch} onChange={setStatsSearch} placeholder="Search by name, email, id…" />
            {filteredStats.slice(0, 100).map((r) => (
              <AppUserEditor
                key={r.id}
                row={r}
                onSave={(patch) => editAppUser.mutate({ id: r.id, blob: r.state_blob, patch })}
              />
            ))}
            {filteredStats.length === 0 ? <Text style={styles.empty}>No matches.</Text> : null}
            {filteredStats.length > 100 ? <Text style={styles.empty}>Showing first 100 — refine your search to see more.</Text> : null}
          </View>
        ) : null}

        {/* Manage users ------------------------------------------------- */}
        <SectionHeader title={`Manage users (${users.length})`} open={openUsers} onToggle={() => toggle(setOpenUsers, openUsers)} />
        {openUsers ? (
          <View>
            <SearchBar value={userSearch} onChange={setUserSearch} placeholder="Search by email or id…" />
            {filteredUsers.slice(0, 100).map((item) => (
              <View key={item.id} style={[styles.userCard, item.is_revoked ? styles.userCardRevoked : null]}>
                <View style={styles.userHeader}>
                  <Text style={styles.userEmail}>{item.email}</Text>
                  {item.is_revoked ? <Text style={styles.revokedTag}>REVOKED</Text> : null}
                </View>
                <Text style={styles.userId}>{item.id}</Text>
                {item.last_device_id ? <Text style={styles.userId}>device: {item.last_device_id}</Text> : null}
                <View style={styles.toggleRow}>
                  <Toggle label="Admin" value={item.is_admin} onChange={(v) => updateUser.mutate({ id: item.id, patch: { is_admin: v } })} />
                  <Toggle label="Dev" value={item.is_dev} onChange={(v) => updateUser.mutate({ id: item.id, patch: { is_dev: v } })} />
                  <Toggle
                    label="Premium"
                    value={item.admin_granted_premium}
                    onChange={(v) => updateUser.mutate({ id: item.id, patch: { admin_granted_premium: v, granted_premium_plan: v ? "premium" : null } })}
                  />
                </View>
                {item.is_revoked ? (
                  <Pressable
                    onPress={() => restoreAccess.mutate(item)}
                    style={({ pressed }) => [styles.restore, pressed && { opacity: 0.7 }]}
                  >
                    <Text style={styles.restoreText}>Restore access</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => {
                      const doRevoke = () => revokeAccess.mutate(item);
                      const msg = `Revoke ${item.email}? This signs them out, locks their app, and blacklists their iPhone${item.last_device_id ? "" : " (no device id stamped yet — they'll be locked out only on next sign-in)"}. Dev emails can still sign up.`;
                      if (Platform.OS === "web") { if (confirm(msg)) doRevoke(); return; }
                      Alert.alert("Revoke access?", msg, [
                        { text: "Cancel", style: "cancel" },
                        { text: "Revoke", style: "destructive", onPress: doRevoke },
                      ]);
                    }}
                    style={({ pressed }) => [styles.revoke, pressed && { opacity: 0.7 }]}
                  >
                    <Text style={styles.revokeText}>Revoke & blacklist device</Text>
                  </Pressable>
                )}
              </View>
            ))}
            {filteredUsers.length === 0 ? <Text style={styles.empty}>No matches.</Text> : null}
            {filteredUsers.length > 100 ? <Text style={styles.empty}>Showing first 100 — refine your search to see more.</Text> : null}
          </View>
        ) : null}

        {/* Blacklisted devices ----------------------------------------- */}
        <SectionHeader title={`Blacklisted devices (${blacklist.length})`} open={openBlacklist} onToggle={() => toggle(setOpenBlacklist, openBlacklist)} />
        {openBlacklist ? (
          <View>
            <SearchBar value={blacklistSearch} onChange={setBlacklistSearch} placeholder="Search devices, emails…" />
            {filteredBlacklist.map((b) => (
              <View key={b.device_id} style={styles.codeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.codeText} numberOfLines={1}>{b.device_id}</Text>
                  <Text style={styles.codeMeta}>{(b.email ?? "—")} · {(b.reason ?? "revoked")}</Text>
                </View>
                <Pressable
                  onPress={() => removeBlacklist.mutate(b.device_id)}
                  style={({ pressed }) => [styles.restore, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.restoreText}>Unban</Text>
                </Pressable>
              </View>
            ))}
            {filteredBlacklist.length === 0 ? <Text style={styles.empty}>No blacklisted devices.</Text> : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title, open, onToggle }: { title: string; open: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} style={styles.sectionHeader} testID={`section-${title}`}>
      <Text style={styles.h2}>{title}</Text>
      <View style={[styles.chev, open ? styles.chevOpen : null]}>
        <ChevronDown color={Colors.text} size={18} />
      </View>
    </Pressable>
  );
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <View style={styles.searchWrap}>
      <Search color={Colors.textMuted} size={16} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.searchInput}
      />
    </View>
  );
}

interface AppUserEditorProps {
  row: AppUserStatsRow;
  onSave: (patch: { streak?: number; best_streak?: number; points?: number; business_switch_bonus?: number; age?: number }) => void;
}

function AppUserEditor({ row, onSave }: AppUserEditorProps) {
  const [streak, setStreak] = useState<string>(String(row.streak ?? 0));
  const [best, setBest] = useState<string>(String(row.best_streak ?? 0));
  const [points, setPoints] = useState<string>(String(row.points ?? 0));
  const [bonus, setBonus] = useState<string>(String(row.business_switch_bonus ?? 0));
  const [age, setAge] = useState<string>(row.age === null || row.age === undefined ? "" : String(row.age));
  const label = row.name?.trim() || row.email || row.user_id || row.id;

  const handleSave = () => {
    const patch: { streak?: number; best_streak?: number; points?: number; business_switch_bonus?: number; age?: number } = {};
    const s = parseInt(streak, 10); if (!Number.isNaN(s)) patch.streak = Math.max(0, s);
    const b = parseInt(best, 10); if (!Number.isNaN(b)) patch.best_streak = Math.max(0, b);
    const p = parseInt(points, 10); if (!Number.isNaN(p)) patch.points = Math.max(0, p);
    const bb = parseInt(bonus, 10); if (!Number.isNaN(bb)) patch.business_switch_bonus = Math.max(0, bb);
    if (age.trim().length > 0) {
      const a = parseInt(age, 10); if (!Number.isNaN(a)) patch.age = Math.max(0, Math.min(120, a));
    }
    onSave(patch);
  };

  return (
    <View style={styles.editorCard}>
      <Text style={styles.userEmail} numberOfLines={1}>{label}</Text>
      <Text style={styles.userId} numberOfLines={1}>
        sessions {row.total_sessions ?? 0} · today {row.sessions_today ?? 0} · avg tasks/day {row.avg_tasks_per_day ?? 0} · total done {row.total_completed ?? 0}
      </Text>
      <View style={styles.editorGrid}>
        <EditorField label="Streak" value={streak} onChange={setStreak} />
        <EditorField label="Best streak" value={best} onChange={setBest} />
        <EditorField label="Points" value={points} onChange={setPoints} />
        <EditorField label="Switch bonus" value={bonus} onChange={setBonus} />
        <EditorField label="Age" value={age} onChange={setAge} />
      </View>
      <Pressable onPress={handleSave} style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.7 }]} testID={`admin-save-${row.id}`}>
        <Text style={styles.saveBtnText}>Save</Text>
      </Pressable>
    </View>
  );
}

function EditorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.editorField}>
      <Text style={styles.editorLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="number-pad"
        style={styles.editorInput}
        placeholderTextColor={Colors.textMuted}
      />
    </View>
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
  sub: { color: Colors.textDim, fontSize: 13, marginTop: 6, textAlign: "center" },
  linkBtn: { marginTop: 18 },
  link: { color: Colors.text, fontWeight: "700" },
  list: { padding: 20, paddingBottom: 40 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, marginTop: 8 },
  h2: { color: Colors.text, fontSize: 17, fontWeight: "900" },
  chev: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#f4f4f4" },
  chevOpen: { transform: [{ rotate: "180deg" }] },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: "#eeeeee", backgroundColor: "#fafafa", marginBottom: 10 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: Colors.text, fontWeight: "600" },
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
  userCardRevoked: { backgroundColor: "rgba(196,69,69,0.05)", borderColor: "rgba(196,69,69,0.3)" },
  userHeader: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "space-between" },
  userEmail: { color: Colors.text, fontSize: 15, fontWeight: "800" },
  userId: { color: Colors.textMuted, fontSize: 11, fontWeight: "600", marginTop: 2 },
  revokedTag: { color: Colors.danger, fontSize: 10, fontWeight: "900", letterSpacing: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: "rgba(196,69,69,0.1)" },
  toggleRow: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  toggle: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#eeeeee" },
  toggleLabel: { color: Colors.textDim, fontSize: 12, fontWeight: "700" },
  revoke: { alignSelf: "flex-start", marginTop: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: "rgba(196,69,69,0.3)", backgroundColor: "rgba(196,69,69,0.06)" },
  revokeText: { color: Colors.danger, fontSize: 12, fontWeight: "800" },
  restore: { alignSelf: "flex-start", marginTop: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: "rgba(0,0,0,0.15)", backgroundColor: "#fafafa" },
  restoreText: { color: Colors.text, fontSize: 12, fontWeight: "800" },
  editorCard: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#eeeeee", marginBottom: 10, backgroundColor: "#ffffff", gap: 8 },
  editorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  editorField: { width: "31%", minWidth: 90 },
  editorLabel: { color: Colors.textDim, fontSize: 11, fontWeight: "700", marginBottom: 4, letterSpacing: 0.3 },
  editorInput: { backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#eeeeee", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: Colors.text, fontWeight: "700" },
  saveBtn: { alignSelf: "flex-start", marginTop: 10, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, backgroundColor: Colors.text },
  saveBtnText: { color: "#ffffff", fontSize: 13, fontWeight: "800" },
  empty: { color: Colors.textMuted, fontSize: 12, fontWeight: "700", textAlign: "center", paddingVertical: 14 },
});
