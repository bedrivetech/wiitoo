// Fusion Platform — brand identity tokens

export const fusionBrand = {
  primary: "#7C3AED",
  primaryHover: "#6D28D9",
  secondary: "#06B6D4",
  accent: "#F59E0B",
  success: "#10B981",
  danger: "#EF4444",
} as const;

export const darkTokens = {
  bg: "#0B0D15",
  surface: "#151724",
  sidebar: "#0F1119",
  text: "#E8E8F0",
  textSecondary: "#9CA3AF",
  border: "#1E2030",
} as const;

export const lightTokens = {
  bg: "#F5F6FA",
  surface: "#FFFFFF",
  sidebar: "#1A1B2E",
  text: "#1A1A2E",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
} as const;

export type FusionTheme = "dark" | "light";