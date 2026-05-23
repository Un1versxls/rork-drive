import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Animated, FlatList, Platform, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import * as Haptics from "expo-haptics";

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
            if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
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

  return (
    <View style={[styles.wrap, { height: containerHeight }]} testID={testID}>
      {/* Center selection band */}
      <View pointerEvents="none" style={[styles.band, { top: padding, height: itemHeight }]} />

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
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumEnd}
        onScrollEndDrag={onScrollEnd}
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
});
