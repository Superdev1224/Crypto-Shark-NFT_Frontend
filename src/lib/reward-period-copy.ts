/**
 * User-facing copy replacing on-chain "epoch" terminology.
 *
 * Admin / settlement → Settled Periods, Completed Periods (professional)
 * Staker / rewards   → Reward Periods, Distribution Cycles (engagement)
 */

/** Admin: section title — "Settled Periods" */
export const SETTLED_PERIODS_LABEL = "Settled Periods";

/** Admin: primary action — settle the current distribution */
export const SETTLE_PERIOD_ACTION = "Settle period";

/** Admin: in-progress action */
export const SETTLING_ACTION = "Settling…";

/** Admin: next allowed settlement time */
export const NEXT_SETTLEMENT_LABEL = "Next settlement";

/** Staker: singular / plural reward period labels */
export const REWARD_PERIOD = "reward period";
export const REWARD_PERIODS = "reward periods";

/** Marketing / pool copy */
export const DISTRIBUTION_CYCLE = "distribution cycle";
export const DISTRIBUTION_CYCLES = "distribution cycles";

/** Staker hint when waiting on owner */
export const OWNER_SETTLES_REWARD_PERIOD = "settles a reward period";

/** Staker: claim window after a period is settled */
export function claimWindowHint(claimExpiryLabel: string): string {
  return `Claim within ${claimExpiryLabel} after each reward period is settled, or unclaimed USDC may be recovered by the vault owner.`;
}

export function rewardPeriodCountLabel(count: number): string {
  return count === 1 ? REWARD_PERIOD : REWARD_PERIODS;
}

/** e.g. "Claim reward periods #0–#2" */
export function claimRewardPeriodRange(finalizedCount: number): string {
  if (finalizedCount <= 0) return "";
  return `Claim reward periods #0–#${finalizedCount - 1}`;
}

/** Admin stat line — e.g. "3 (claim reward periods #0–#2)" */
export function settledPeriodsStatLine(finalizedCount: number): string {
  if (finalizedCount === 0) return "None yet";
  return `${finalizedCount} (${claimRewardPeriodRange(finalizedCount)})`;
}
