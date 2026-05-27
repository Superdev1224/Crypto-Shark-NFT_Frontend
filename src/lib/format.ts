import { formatUnits, parseUnits, type Address } from "viem";
import { USDC_DECIMALS } from "./contracts";

export const parseUsdcInput = (value: string): bigint => {
  const trimmed = value.trim();
  if (!trimmed || Number.isNaN(Number(trimmed))) return 0n;
  return parseUnits(trimmed, USDC_DECIMALS);
};

export const formatUsdc = (raw: bigint | undefined, fractionDigits = 2): string => {
  if (raw === undefined) return "—";
  const formatted = formatUnits(raw, USDC_DECIMALS);
  const num = Number(formatted);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};

export const usdCentsToUsd = (cents: bigint | number): string => {
  const n = typeof cents === "bigint" ? Number(cents) : cents;
  return (n / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

export const shortAddress = (addr?: Address | string): string => {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
};

export const formatCountdown = (secondsLeft: number | bigint): string => {
  const s = Number(secondsLeft);
  if (s <= 0) return "Ready";
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  return `${days}d ${hours.toString().padStart(2, "0")}h ${mins.toString().padStart(2, "0")}m`;
};

export const splitCountdown = (secondsLeft: number | bigint) => {
  const s = Math.max(0, Number(secondsLeft));
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    isReady: s === 0,
  };
};
