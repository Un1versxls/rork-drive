export const Colors = {
  bg: "#faf9f6",
  bgAlt: "#f5f4f0",
  cardBg: "#ffffff",
  glass: "rgba(255,255,255,0.7)",

  text: "#1a1a1a",
  textDim: "#6b6b6b",
  textMuted: "#9a9a9a",

  accent: "#c9a87c",
  accentGold: "#d4af37",
  accentDark: "#b8956a",
  accentDeep: "#8b7355",
  accentSoft: "#e8d5b7",
  accentDim: "rgba(201,168,124,0.12)",
  accentDim2: "rgba(201,168,124,0.22)",

  border: "rgba(0,0,0,0.08)",
  borderStrong: "rgba(201,168,124,0.45)",

  shadow: "rgba(0,0,0,0.06)",
  shadowLg: "rgba(0,0,0,0.10)",

  danger: "#c44545",
  warning: "#d4af37",
  success: "#6b8e4e",

  // aliases kept for back-compat in existing components
  primary: "#c9a87c",
  primaryDark: "#b8956a",
  primarySoft: "rgba(201,168,124,0.14)",
  surface: "#ffffff",
  surfaceStrong: "#f5f4f0",
  gold: "#d4af37",
} as const;

export default {
  light: {
    text: Colors.text,
    background: Colors.bg,
    tint: Colors.accent,
    tabIconDefault: Colors.textMuted,
    tabIconSelected: Colors.accent,
  },
};
