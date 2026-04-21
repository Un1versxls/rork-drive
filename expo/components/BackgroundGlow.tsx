import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { Colors } from "@/constants/colors";

export function BackgroundGlow() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[Colors.bg, Colors.bgAlt, Colors.bg]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.blob, styles.blobTop]}>
        <LinearGradient
          colors={["rgba(201,168,124,0.22)", "rgba(201,168,124,0)"]}
          style={styles.blobFill}
        />
      </View>
      <View style={[styles.blob, styles.blobBottom]}>
        <LinearGradient
          colors={["rgba(212,175,55,0.14)", "rgba(212,175,55,0)"]}
          style={styles.blobFill}
        />
      </View>
      <View style={[styles.blob, styles.blobMid]}>
        <LinearGradient
          colors={["rgba(201,168,124,0.10)", "rgba(201,168,124,0)"]}
          style={styles.blobFill}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  blob: { position: "absolute", width: 460, height: 460, borderRadius: 999, opacity: 0.9 },
  blobFill: { flex: 1, borderRadius: 999 },
  blobTop: { top: -220, right: -140 },
  blobBottom: { bottom: -240, left: -160 },
  blobMid: { top: "45%", right: "25%", width: 300, height: 300 },
});
