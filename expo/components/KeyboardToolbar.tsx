import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Keyboard, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronDown } from "lucide-react-native";

import { Colors } from "@/constants/colors";

export function KeyboardToolbar() {
  const [visible, setVisible] = useState<boolean>(false);
  const [bottom, setBottom] = useState<number>(0);
  const slide = useRef(new Animated.Value(60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === "web") return;
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (e: { endCoordinates: { height: number } }) => {
      setBottom(e.endCoordinates.height);
      setVisible(true);
      Animated.parallel([
        Animated.timing(slide, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    };
    const onHide = () => {
      Animated.parallel([
        Animated.timing(slide, { toValue: 60, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start(() => {
        setVisible(false);
        setBottom(0);
      });
    };

    const subShow = Keyboard.addListener(showEvt, onShow);
    const subHide = Keyboard.addListener(hideEvt, onHide);
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, [slide, opacity]);

  if (Platform.OS === "web") return null;
  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { bottom, opacity, transform: [{ translateY: slide }] },
      ]}
    >
      <View style={styles.bar}>
        <View style={styles.indent} />
        <View style={styles.spacer} />
        <Pressable
          onPress={() => Keyboard.dismiss()}
          hitSlop={12}
          style={({ pressed }) => [styles.dismissBtn, pressed && styles.dismissBtnPressed]}
          testID="keyboard-dismiss"
        >
          <Text style={styles.dismissLabel}>Done</Text>
          <ChevronDown size={16} color={Colors.text} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    paddingHorizontal: 10,
    backgroundColor: "#f4f4f5",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#d4d4d8",
  },
  indent: {
    width: 22,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#c7c7cc",
  },
  spacer: { flex: 1 },
  dismissBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#d4d4d8",
  },
  dismissBtnPressed: {
    backgroundColor: "#e4e4e7",
  },
  dismissLabel: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
});
