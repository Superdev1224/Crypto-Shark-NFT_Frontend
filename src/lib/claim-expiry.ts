/** Whether a reward period's claim window has closed. */
export function isClaimExpired(
  snapshotTime: bigint | number | undefined,
  claimExpiryPeriod: bigint | number | undefined,
  nowSec: number = Math.floor(Date.now() / 1000)
): boolean {
  if (snapshotTime === undefined || claimExpiryPeriod === undefined) return false;
  return nowSec >= Number(snapshotTime) + Number(claimExpiryPeriod);
}

export function claimDeadlineTimestamp(
  snapshotTime: bigint | number | undefined,
  claimExpiryPeriod: bigint | number | undefined
): number | null {
  if (snapshotTime === undefined || claimExpiryPeriod === undefined) return null;
  return Number(snapshotTime) + Number(claimExpiryPeriod);
}
