import { Platform } from "react-native";
import type {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";

let configured = false;

function getRCToken(): string | undefined {
  if (__DEV__ || Platform.OS === "web") {
    return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
  }
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    default: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY,
  });
}

export async function configurePurchases(): Promise<void> {
  if (configured) return;
  if (Platform.OS === "web") {
    configured = true;
    return;
  }
  try {
    const Purchases = require("react-native-purchases").default;
    const key = getRCToken();
    if (!key) {
      console.log("[purchases] no RC key");
      return;
    }
    Purchases.configure({ apiKey: key });
    configured = true;
    console.log("[purchases] configured");
  } catch (e) {
    console.log("[purchases] configure error", e);
  }
}

export async function getOfferings(): Promise<PurchasesOffering | null> {
  if (Platform.OS === "web") return null;
  await configurePurchases();
  try {
    const Purchases = require("react-native-purchases").default;
    const offerings = await Purchases.getOfferings();
    const current =
      offerings.all["drive_main"] ?? offerings.current ?? null;
    return current;
  } catch (e) {
    console.log("[purchases] getOfferings error", e);
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  const Purchases = require("react-native-purchases").default;
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  const Purchases = require("react-native-purchases").default;
  return Purchases.restorePurchases();
}

export function hasActiveEntitlement(
  info: CustomerInfo | null | undefined,
  key: "base" | "premium"
): boolean {
  if (!info) return false;
  const ents = info.entitlements?.active ?? {};
  if (key === "premium") return Boolean(ents.premium);
  return Boolean(ents.base || ents.premium);
}
