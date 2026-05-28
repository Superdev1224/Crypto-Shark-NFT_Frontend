/** Human-readable stake lock duration from on-chain seconds. */
export function formatStakeLockPeriod(seconds: bigint | number | undefined): string {
  if (seconds === undefined) return "lock period";
  const s = Number(seconds);
  if (s >= 86400) {
    const days = Math.round(s / 86400);
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  if (s >= 3600) {
    const hours = Math.round(s / 3600);
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  const mins = Math.max(1, Math.round(s / 60));
  return `${mins} minute${mins === 1 ? "" : "s"}`;
}

export function formatEpochInterval(seconds: bigint | number | undefined): string {
  return formatStakeLockPeriod(seconds);
}
