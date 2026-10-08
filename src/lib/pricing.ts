// Regional credit pack pricing. Same pack everywhere; price depends on region.
export type Region = "africa" | "international";

export const CREDIT_PACK = 1000; // credits per pack

export const PLANS: Record<Region, { label: string; usd: number; currency: "NGN" | "USD"; amountMinor: number; display: string }> = {
  africa: { label: "Africa", usd: 10, currency: "NGN", amountMinor: 15000 * 100, display: "$10 (≈ ₦15,000)" },
  international: { label: "USA · UK · Europe", usd: 20, currency: "USD", amountMinor: 20 * 100, display: "$20" },
};

const AFRICA_TZ = /^Africa\//;

export function detectRegion(): Region {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    return AFRICA_TZ.test(tz) ? "africa" : "international";
  } catch {
    return "international";
  }
}
