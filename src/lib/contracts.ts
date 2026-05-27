import type { Address } from "viem";

const requireAddress = (key: string, fallback: string): Address => {
  const v = process.env[key] ?? fallback;
  if (!/^0x[a-fA-F0-9]{40}$/.test(v)) {
    throw new Error(`Invalid address for ${key}: ${v}`);
  }
  return v as Address;
};

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 11155111);

export const NFT_ADDRESS = requireAddress(
  "NEXT_PUBLIC_NFT_ADDRESS",
  "0x61594E6CA83A29332581Ac71F2e8140Fb91dd363"
);

export const VAULT_ADDRESS = requireAddress(
  "NEXT_PUBLIC_VAULT_ADDRESS",
  "0x9F7697aCf2e240E687b743Eb5631d36C12Fc105f"
);

export const USDC_ADDRESS = requireAddress(
  "NEXT_PUBLIC_USDC_ADDRESS",
  "0xBF8821AEd892B8D693f2C0B1921810A99EAF5193"
);

export const MAX_SUPPLY = 1000;
export const STAKE_LOCK_SECONDS = 0.01 * 24 * 60 * 60;

export const TIERS = [
  { range: [1, 250] as const, priceCents: 25_000, label: "Tier I" },
  { range: [251, 500] as const, priceCents: 50_000, label: "Tier II" },
  { range: [501, 750] as const, priceCents: 75_000, label: "Tier III" },
  { range: [751, 1000] as const, priceCents: 100_000, label: "Tier IV" },
] as const;

export const USDC_DECIMALS = 18;
