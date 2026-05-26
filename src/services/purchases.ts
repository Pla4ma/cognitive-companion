// ══════════════════════════════════════════════════════════════
// INTENT — RevenueCat Purchases Service
// Pro subscription management via react-native-purchases
// ══════════════════════════════════════════════════════════════

import { Platform } from 'react-native'
import Purchases, { PurchasesPackage, CustomerInfo } from 'react-native-purchases'

// ── Entitlement Identifier ─────────────────────────────────
const PRO_ENTITLEMENT_ID = 'pro'

// ── Result Types ───────────────────────────────────────────

export type PurchaseResult =
  | { success: true; customerInfo: CustomerInfo }
  | { success: false; error: string; userCancelled?: boolean }

export type OfferingResult =
  | { success: true; packages: PurchasesPackage[] }
  | { success: false; error: string }

export type ProStatusResult = {
  isPro: boolean
  customerInfo: CustomerInfo | null
}

// ── Configuration ──────────────────────────────────────────

/**
 * Configure RevenueCat with platform-specific API key.
 * Call once on app startup before any other purchases methods.
 */
export async function initPurchases(userId: string): Promise<void> {
  try {
    const apiKey = Platform.select({
      ios: process.env.EXPO_PUBLIC_RC_KEY_IOS,
      android: process.env.EXPO_PUBLIC_RC_KEY_ANDROID,
    })

    if (!apiKey) {
      console.warn('[Purchases] Missing RevenueCat API key for platform:', Platform.OS)
      return
    }

    Purchases.setLogLevel(__DEV__ ? Purchases.LOG_LEVEL.DEBUG : Purchases.LOG_LEVEL.WARN)

    await Purchases.configure({ apiKey })

    // Attach user ID for cross-device sync
    await Purchases.logIn(userId)
  } catch (err) {
    console.error('[Purchases] init failed:', err)
  }
}

// ── Offerings ──────────────────────────────────────────────

/**
 * Fetch available subscription packages from RevenueCat.
 */
export async function getOfferings(): Promise<OfferingResult> {
  try {
    const offerings = await Purchases.getOfferings()
    const current = offerings.current

    if (!current || !current.availablePackages.length) {
      return { success: false, error: 'No offerings available' }
    }

    return { success: true, packages: current.availablePackages }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load offerings'
    console.error('[Purchases] getOfferings error:', err)
    return { success: false, error: message }
  }
}

// ── Purchase ───────────────────────────────────────────────

/**
 * Purchase a package and check if the user unlocked PRO.
 */
export async function purchasePro(pkg: PurchasesPackage): Promise<PurchaseResult> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg)

    if (isProActive(customerInfo)) {
      return { success: true, customerInfo }
    }

    return { success: false, error: 'Purchase completed but PRO not activated' }
  } catch (err: any) {
    // User cancelled the purchase flow
    if (err.userCancelled) {
      return { success: false, error: 'Purchase cancelled', userCancelled: true }
    }

    const message = err instanceof Error ? err.message : 'Purchase failed'
    console.error('[Purchases] purchasePro error:', err)
    return { success: false, error: message }
  }
}

// ── Restore ────────────────────────────────────────────────

/**
 * Restore previous purchases and check PRO status.
 */
export async function restorePurchases(): Promise<PurchaseResult> {
  try {
    const customerInfo = await Purchases.restorePurchases()

    if (isProActive(customerInfo)) {
      return { success: true, customerInfo }
    }

    return { success: false, error: 'No previous PRO purchases found' }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Restore failed'
    console.error('[Purchases] restorePurchases error:', err)
    return { success: false, error: message }
  }
}

// ── Status Check ───────────────────────────────────────────

/**
 * Check current PRO entitlement status from cache or server.
 */
export async function checkProStatus(): Promise<ProStatusResult> {
  try {
    const customerInfo = await Purchases.getCustomerInfo()
    return { isPro: isProActive(customerInfo), customerInfo }
  } catch (err) {
    console.error('[Purchases] checkProStatus error:', err)
    return { isPro: false, customerInfo: null }
  }
}

// ── Helpers ────────────────────────────────────────────────

/**
 * Check if the pro entitlement is active in customer info.
 */
function isProActive(customerInfo: CustomerInfo): boolean {
  return customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined
}
