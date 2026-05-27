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
  "0xD341843212948Bac40dAE9bd2992081309478F23"
);

export const VAULT_ADDRESS = requireAddress(
  "NEXT_PUBLIC_VAULT_ADDRESS",
  "0xD1dA053FDEF663919307b135bbd33A92D2ccF596"
);

export const USDC_ADDRESS = requireAddress(
  "NEXT_PUBLIC_USDC_ADDRESS",
  "0x3eFB0d0838f7e51a64B7722e2260F13c930C8684"
);

export const MAX_SUPPLY = 1000;
export const STAKE_LOCK_SECONDS = 0.01 * 24 * 60 * 60;

export const TIERS = [
  { range: [1, 250] as const, priceCents: 25_000, label: "Tier I" },
  { range: [251, 500] as const, priceCents: 50_000, label: "Tier II" },
  { range: [501, 750] as const, priceCents: 75_000, label: "Tier III" },
  { range: [751, 1000] as const, priceCents: 100_000, label: "Tier IV" },
] as const;

/** MockUSDC / vault USDC use 6 decimals (must match on-chain ERC20). */
export const USDC_DECIMALS = 6;
