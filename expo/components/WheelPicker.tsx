import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, FlatList, Platform, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import * as Haptics from "expo-haptics";
import { ChevronsUpDown } from "lucide-react-native";

import { Colors } from "@/constants/colors";

interface Props {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  itemHeight?: number;
  visibleCount?: number;
  testID?: string;
}

/**
 * Vertical drum / wheel picker (iOS date-picker style).
 * The centered item renders largest; items above/below scale & fade out.
 * Scrolling up moves to larger values; scrolling down to smaller values.
 */
export function WheelPicker({
  values,
  value,
  onChange,
  format,
  itemHeight = 56,
  visibleCount = 5,
  testID,
}: Props) {
  const listRef = useRef<FlatList<number>>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastIndex = useRef<number>(values.indexOf(value));
  if (lastIndex.current < 0) lastIndex.current = 0;

  const [demoActive, setDemoActive] = useState<boolean>(true);
  const hintFade = useRef(new Animated.Value(0)).current;
  const hintPulse = useRef(new Animated.Value(0)).current;
  // Separate JS-driven pulse for shadowOpacity (which is NOT supported by
  // the native driver). Mixing it with the native-driven hintPulse on the
  // same Animated.Value triggers a "JS animation on native node" crash.
  const hintPulseJS = useRef(new Animated.Value(0)).current;
  const lastHapticAt = useRef<number>(0);

  const containerHeight = itemHeight * visibleCount;
  const padding = (containerHeight - itemHeight) / 2;

  // Sync external value -> scroll position (only on prop change, not on every render).
  useEffect(() => {
    const idx = values.indexOf(value);
    if (idx >= 0 && idx !== lastIndex.current) {
      lastIndex.current = idx;
      listRef.current?.scrollToOffset({ offset: idx * itemHeight, animated: true });
    }
  }, [value, values, itemHeight]);

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
        listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
          const y = e.nativeEvent.contentOffset.y;
          const idx = Math.max(0, Math.min(values.length - 1, Math.round(y / itemHeight)));
          if (idx !== lastIndex.current) {
            lastIndex.current = idx;
            // Throttle haptics so fast drags don't choke the JS thread and make the wheel feel laggy.
            const now = Date.now();
            if (Platform.OS !== "web" && now - lastHapticAt.current > 55) {
              lastHapticAt.current = now;
              Haptics.selectionAsync().catch(() => {});
            }
          }
          if (demoActive) {
            setDemoActive(false);
          }
        },
      }),
    [scrollY, values.length, itemHeight]
  );

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const idx = Math.max(0, Math.min(values.length - 1, Math.round(y / itemHeight)));
      // Snap should land us exactly on a value; emit it.
      if (values[idx] !== value) onChange(values[idx]);
    },
    [values, itemHeight, onChange, value]
  );

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => onMomentumEnd(e),
    [onMomentumEnd]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: number; index: number }) => {
      const inputRange = [
        (index - 2) * itemHeight,
        (index - 1) * itemHeight,
        index * itemHeight,
        (index + 1) * itemHeight,
        (index + 2) * itemHeight,
      ];
      const scale = scrollY.interpolate({
        inputRange,
        outputRange: [0.55, 0.78, 1.05, 0.78, 0.55],
        extrapolate: "clamp",
      });
      const opacity = scrollY.interpolate({
        inputRange,
        outputRange: [0.15, 0.5, 1, 0.5, 0.15],
        extrapolate: "clamp",
      });
      return (
        <Animated.View style={[styles.row, { height: itemHeight, opacity, transform: [{ scale }] }]}>
          <Text style={styles.label}>{format ? format(item) : String(item)}</Text>
        </Animated.View>
      );
    },
    [scrollY, itemHeight, format]
  );

  // Auto demo: nudge the list a tiny bit so the user sees it's spinnable; pulse a gold band.
  useEffect(() => {
    if (!demoActive) return;
    let cancelled = false;
    Animated.timing(hintFade, { toValue: 1, duration: 320, useNativeDriver: true }).start();
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(hintPulse, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(hintPulse, { toValue: 0, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    );
    pulse.start();
    const pulseShadow = Animated.loop(
      Animated.sequence([
        Animated.timing(hintPulseJS, { toValue: 1, duration: 900, useNativeDriver: false, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(hintPulseJS, { toValue: 0, duration: 900, useNativeDriver: false, easing: Easing.inOut(Easing.ease) }),
      ])
    );
    pulseShadow.start();
    const baseIdx = Math.max(0, values.indexOf(value));
    const nudge = () => {
      if (cancelled) return;
      listRef.current?.scrollToOffset({ offset: baseIdx * itemHeight + 18, animated: true });
      setTimeout(() => {
        if (cancelled) return;
        listRef.current?.scrollToOffset({ offset: Math.max(0, baseIdx * itemHeight - 18), animated: true });
        setTimeout(() => {
          if (cancelled) return;
          listRef.current?.scrollToOffset({ offset: baseIdx * itemHeight, animated: true });
        }, 700);
      }, 700);
    };
    const startTimer = setTimeout(nudge, 600);
    const loopTimer = setInterval(nudge, 2800);
    return () => {
      cancelled = true;
      clearTimeout(startTimer);
      clearInterval(loopTimer);
      pulse.stop();
      pulseShadow.stop();
      Animated.timing(hintFade, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    };
  }, [demoActive, hintFade, hintPulse, hintPulseJS, itemHeight, value, values]);

  return (
    <View style={[styles.wrap, { height: containerHeight }]} testID={testID}>
      {/* Center selection band */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.band,
          { top: padding, height: itemHeight },
          demoActive && {
            borderColor: "#d4af37",
            backgroundColor: "#fffdf3",
            shadowColor: "#d4af37",
            shadowOpacity: hintPulseJS.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.65] }),
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.hintPill,
          {
            opacity: hintFade,
            transform: [{ translateY: hintPulse.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }],
          },
        ]}
      >
        <ChevronsUpDown size={12} color="#7a5a00" />
        <Text style={styles.hintText}>Spin me</Text>
      </Animated.View>

      {/* Top + bottom fade overlays */}
      <View pointerEvents="none" style={[styles.fadeTop, { height: padding }]} />
      <View pointerEvents="none" style={[styles.fadeBottom, { height: padding }]} />

      <Animated.FlatList
        ref={listRef as unknown as React.RefObject<Animated.FlatList<number>>}
        data={values}
        keyExtractor={(it) => String(it)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        bounces={false}
        onScroll={onScroll}
        scrollEventThrottle={1}
        disableIntervalMomentum={true}
        onMomentumScrollEnd={onMomentumEnd}
        onScrollEndDrag={onScrollEnd}
        onScrollBeginDrag={() => {
          if (demoActive) setDemoActive(false);
        }}
        contentContainerStyle={{ paddingTop: padding, paddingBottom: padding }}
        getItemLayout={(_, i) => ({ length: itemHeight, offset: itemHeight * i, index: i })}
        initialScrollIndex={Math.max(0, values.indexOf(value))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    overflow: "hidden",
  },
  row: { alignItems: "center", justifyContent: "center" },
  label: {
    color: Colors.text,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.2,
  },
  band: {
    position: "absolute",
    left: 16,
    right: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eeeeee",
    backgroundColor: "#fafafa",
    borderRadius: 14,
  },
  fadeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255,255,255,0.85)",
    zIndex: 1,
  },
  fadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255,255,255,0.85)",
    zIndex: 1,
  },
  hintPill: {
    position: "absolute",
    top: 4,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#fff6d6",
    borderWidth: 1,
    borderColor: "#d4af37",
    zIndex: 5,
    shadowColor: "#d4af37",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    left: "50%",
    marginLeft: -45,
  },
  hintText: { color: "#7a5a00", fontSize: 11, fontWeight: "900", letterSpacing: 0.4 },
});
