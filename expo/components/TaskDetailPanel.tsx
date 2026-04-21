import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  BrainCircuit,
  Check,
  ChevronDown,
  Clock,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from "lucide-react-native";
import { generateText } from "@rork-ai/toolkit-sdk";

import { Colors } from "@/constants/colors";
import { CATEGORY_META } from "@/constants/task-pool";
import { triggerHaptic } from "@/lib/haptics";
import { generateSteps, type TaskStep } from "@/lib/taskSteps";
import type { Task, BusinessIdea } from "@/types";

interface Props {
  task: Task | null;
  business: BusinessIdea | null;
  hapticsEnabled: boolean;
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
  onSkip: () => void;
}

interface ChatMsg {
  id: string;
  role: "coach" | "user";
  text: string;
}

const COACH_SYSTEM = `You are DRIVE Coach, a Socratic thinking partner.
STRICT RULES:
- You ONLY ask questions. Never give instructions, advice, answers, or do work.
- Never write content, copy, code, outlines, or drafts.
- If the user asks you to do something, respond by asking a question that helps them think it through themselves.
- Keep every response to 1-2 short, warm questions (max ~30 words total).
- Use simple, encouraging language. No lists, no headings.
- Every reply must end with a question mark.`;

export function TaskDetailPanel({ task, business, hapticsEnabled, visible, onClose, onComplete, onSkip }: Props) {
  const translateY = useRef(new Animated.Value(600)).current;
  const fade = useRef(new Animated.Value(0)).current;

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState<string>("");
  const [thinking, setThinking] = useState<boolean>(false);

  const steps = useMemo<TaskStep[]>(() => (task ? generateSteps(task) : []), [task]);
  const meta = task ? CATEGORY_META[task.category] : null;

  useEffect(() => {
    if (visible) {
      translateY.setValue(600);
      fade.setValue(0);
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
      triggerHaptic("tap", hapticsEnabled);
    }
  }, [visible, translateY, fade, hapticsEnabled]);

  useEffect(() => {
    if (!visible) {
      setChecked({});
      setMessages([]);
      setInput("");
      setChatOpen(false);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 600, duration: 260, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => onClose());
    triggerHaptic("tap", hapticsEnabled);
  };

  const toggleStep = (id: string) => {
    triggerHaptic("select", hapticsEnabled);
    setChecked((c) => ({ ...c, [id]: !c[id] }));
  };

  const sendToCoach = async () => {
    if (!input.trim() || thinking || !task) return;
    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: "user", text: input.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setThinking(true);
    triggerHaptic("tap", hapticsEnabled);

    try {
      const history = nextMessages.map((m) => ({
        role: m.role === "coach" ? ("assistant" as const) : ("user" as const),
        content: m.text,
      }));
      const contextNote = `Context for coach (do not repeat): task "${task.title}" — ${task.description}. Business: ${business?.name ?? "none"}.`;
      const reply = await generateText({
        messages: [
          { role: "user", content: COACH_SYSTEM },
          { role: "assistant", content: "Understood. I will only ask questions." },
          { role: "user", content: contextNote },
          { role: "assistant", content: "Got it." },
          ...history,
        ],
      });
      let text = (reply ?? "").trim();
      if (!text.endsWith("?")) {
        text = text.replace(/[.!…]*$/, "") + "?";
      }
      const coachMsg: ChatMsg = { id: `c-${Date.now()}`, role: "coach", text };
      setMessages((prev) => [...prev, coachMsg]);
      triggerHaptic("select", hapticsEnabled);
    } catch (e) {
      console.log("[coach] error", e);
      const fallback: ChatMsg = {
        id: `c-${Date.now()}`,
        role: "coach",
        text: "If you could only do one tiny step in the next five minutes, what would it be?",
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setThinking(false);
    }
  };

  const askQuickStart = async () => {
    if (!task) return;
    const seed: ChatMsg = {
      id: `c-${Date.now()}`,
      role: "coach",
      text: `What does a finished version of "${task.title}" actually look like to you?`,
    };
    setMessages([seed]);
    setChatOpen(true);
    triggerHaptic("select", hapticsEnabled);
  };

  if (!task || !meta) {
    return (
      <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
        <View style={styles.backdrop} />
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={StyleSheet.absoluteFill}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <SafeAreaView edges={["bottom"]} style={{ flex: 1 }}>
            <View style={styles.grabber} />
            <View style={styles.sheetHeader}>
              <View style={[styles.pill, { backgroundColor: meta.color + "18", borderColor: meta.color + "55" }]}>
                <View style={[styles.pillDot, { backgroundColor: meta.color }]} />
                <Text style={[styles.pillText, { color: meta.color }]}>{meta.label}</Text>
              </View>
              <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={12} testID="panel-close">
                <X color={Colors.textDim} size={18} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.title}>{task.title}</Text>
              <Text style={styles.desc}>{task.description}</Text>

              <View style={styles.metaRow}>
                <View style={styles.metaChip}>
                  <Clock size={12} color={Colors.accentDeep} />
                  <Text style={styles.metaChipText}>~{task.difficulty * 10} min</Text>
                </View>
                <View style={styles.metaChip}>
                  <Sparkles size={12} color={Colors.accentDeep} />
                  <Text style={styles.metaChipText}>+{task.basePoints} pts base</Text>
                </View>
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipText}>
                    Difficulty {task.difficulty === 1 ? "Easy" : task.difficulty === 2 ? "Medium" : "Hard"}
                  </Text>
                </View>
              </View>

              {business ? (
                <View style={styles.whyBox}>
                  <Text style={styles.whyLabel}>WHY THIS MATTERS</Text>
                  <Text style={styles.whyText}>
                    For {business.name}, this compounds toward: {business.firstMilestones[0] ?? business.tagline}.
                  </Text>
                </View>
              ) : null}

              <Text style={styles.sectionTitle}>Step by step</Text>
              <View style={styles.steps}>
                {steps.map((s, i) => {
                  const on = !!checked[s.id];
                  return (
                    <Pressable key={s.id} onPress={() => toggleStep(s.id)} style={styles.stepRow}>
                      <View style={[styles.stepCheck, on && styles.stepCheckOn]}>
                        {on ? <Check color="#faf9f6" size={14} strokeWidth={3} /> : <Text style={styles.stepNum}>{i + 1}</Text>}
                      </View>
                      <Text style={[styles.stepLabel, on && styles.stepLabelOn]}>{s.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable onPress={() => { setChatOpen((v) => !v); triggerHaptic("tap", hapticsEnabled); if (!chatOpen && messages.length === 0) askQuickStart(); }} style={styles.coachToggle}>
                <View style={styles.coachIcon}>
                  <BrainCircuit color={Colors.accentDeep} size={16} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.coachTitle}>Ask the Coach</Text>
                  <Text style={styles.coachSub}>A thinking partner that only asks questions</Text>
                </View>
                <ChevronDown
                  color={Colors.textDim}
                  size={18}
                  style={{ transform: [{ rotate: chatOpen ? "180deg" : "0deg" }] }}
                />
              </Pressable>

              {chatOpen ? (
                <View style={styles.chatBox}>
                  <View style={styles.chatBanner}>
                    <MessageCircle color={Colors.accentDeep} size={12} />
                    <Text style={styles.chatBannerText}>The coach only asks questions — it won&apos;t do the work for you.</Text>
                  </View>
                  <View style={styles.chatMsgs}>
                    {messages.map((m) => (
                      <View key={m.id} style={[styles.msg, m.role === "user" ? styles.msgUser : styles.msgCoach]}>
                        <Text style={[styles.msgText, m.role === "user" && styles.msgTextUser]}>{m.text}</Text>
                      </View>
                    ))}
                    {thinking ? (
                      <View style={[styles.msg, styles.msgCoach]}>
                        <Text style={styles.msgText}>…</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.inputRow}>
                    <TextInput
                      value={input}
                      onChangeText={setInput}
                      placeholder="Share what you're stuck on…"
                      placeholderTextColor={Colors.textMuted}
                      style={styles.input}
                      multiline
                      testID="coach-input"
                    />
                    <Pressable
                      onPress={sendToCoach}
                      disabled={!input.trim() || thinking}
                      style={({ pressed }) => [
                        styles.sendBtn,
                        (!input.trim() || thinking) && { opacity: 0.4 },
                        pressed && { transform: [{ scale: 0.96 }] },
                      ]}
                      testID="coach-send"
                    >
                      <Send color="#faf9f6" size={16} />
                    </Pressable>
                  </View>
                </View>
              ) : null}

              <View style={{ height: 16 }} />
            </ScrollView>

            <View style={styles.footerRow}>
              <Pressable
                onPress={() => { onSkip(); handleClose(); }}
                style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.7 }]}
                testID="panel-skip"
              >
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
              <Pressable
                onPress={() => { onComplete(); handleClose(); }}
                style={({ pressed }) => [styles.completeBtn, pressed && { transform: [{ scale: 0.98 }] }]}
                testID="panel-complete"
              >
                <LinearGradient colors={["#1a1a1a", "#2a2a2a"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                <Check color="#faf9f6" size={18} strokeWidth={3} />
                <Text style={styles.completeText}>Mark complete</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: "rgba(20,16,10,0.5)" },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "92%",
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 20,
    paddingHorizontal: 20,
  },
  grabber: { alignSelf: "center", width: 44, height: 5, borderRadius: 3, backgroundColor: "rgba(0,0,0,0.1)", marginTop: 10, marginBottom: 8 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: Colors.bgAlt, borderWidth: 1, borderColor: Colors.border },
  scroll: { paddingBottom: 16 },
  title: { color: Colors.text, fontSize: 24, fontWeight: "900", letterSpacing: -0.5, lineHeight: 28 },
  desc: { color: Colors.textDim, fontSize: 14, lineHeight: 20, marginTop: 8 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 14 },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: Colors.accentDim, borderWidth: 1, borderColor: Colors.borderStrong },
  metaChipText: { color: Colors.accentDeep, fontWeight: "800", fontSize: 11 },
  whyBox: { marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: Colors.bgAlt, borderWidth: 1, borderColor: Colors.border },
  whyLabel: { color: Colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginBottom: 4 },
  whyText: { color: Colors.text, fontSize: 13, lineHeight: 19 },
  sectionTitle: { color: Colors.textDim, fontWeight: "800", fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", marginTop: 18, marginBottom: 10 },
  steps: { gap: 8 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border },
  stepCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: Colors.border, alignItems: "center", justifyContent: "center", backgroundColor: "transparent" },
  stepCheckOn: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  stepNum: { color: Colors.textDim, fontSize: 11, fontWeight: "800" },
  stepLabel: { color: Colors.text, fontSize: 13, flex: 1, lineHeight: 18 },
  stepLabelOn: { color: Colors.textDim, textDecorationLine: "line-through" },
  coachToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 18,
    padding: 14,
    borderRadius: 16,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  coachIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: Colors.accentDim },
  coachTitle: { color: Colors.text, fontWeight: "800", fontSize: 14 },
  coachSub: { color: Colors.textDim, fontSize: 11, marginTop: 2 },
  chatBox: { marginTop: 10, padding: 12, borderRadius: 16, backgroundColor: Colors.bgAlt, borderWidth: 1, borderColor: Colors.border },
  chatBanner: { flexDirection: "row", alignItems: "center", gap: 6, padding: 8, borderRadius: 10, backgroundColor: Colors.accentDim, marginBottom: 10 },
  chatBannerText: { color: Colors.accentDeep, fontSize: 11, fontWeight: "700", flex: 1 },
  chatMsgs: { gap: 8 },
  msg: { padding: 10, borderRadius: 12, maxWidth: "88%" },
  msgCoach: { backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border, alignSelf: "flex-start" },
  msgUser: { backgroundColor: Colors.accentDeep, alignSelf: "flex-end" },
  msgText: { color: Colors.text, fontSize: 13, lineHeight: 18 },
  msgTextUser: { color: "#faf9f6", fontWeight: "600" },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 10 },
  input: { flex: 1, minHeight: 40, maxHeight: 120, color: Colors.text, backgroundColor: Colors.cardBg, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accentDeep, alignItems: "center", justifyContent: "center" },
  footerRow: { flexDirection: "row", gap: 10, paddingTop: 10, paddingBottom: 6 },
  skipBtn: { paddingHorizontal: 18, paddingVertical: 14, borderRadius: 999, backgroundColor: Colors.bgAlt, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  skipText: { color: Colors.textDim, fontWeight: "700", fontSize: 14 },
  completeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 999, overflow: "hidden" },
  completeText: { color: "#faf9f6", fontWeight: "800", fontSize: 15 },
});
