"use client";

import { useEffect } from "react";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { CryptoSharksStakingVaultAbi } from "@/lib/abis/CryptoSharksStakingVault";
import { VAULT_ADDRESS } from "@/lib/contracts";
import { useClaimableEpochs } from "@/hooks/useClaimableEpochs";
import { useVaultConfig } from "@/hooks/useVaultConfig";
import { formatStakeLockPeriod } from "@/lib/stake-lock";
import { formatUsdc } from "@/lib/format";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { ClaimRewardsButton } from "./ClaimRewardsButton";
import { CountdownTimer } from "./CountdownTimer";
import { NftImage } from "./NftImage";
import { Loader2 } from "lucide-react";

interface Props {
  tokenId: bigint;
  isStakedInVault: boolean;
  nextEpochId: bigint;
  onChange?: () => void;
}

export function StakedTokenCard({ tokenId, isStakedInVault, nextEpochId, onChange }: Props) {
  const { address } = useAccount();
  const { stakeLockPeriod } = useVaultConfig();
  const lockLabel = formatStakeLockPeriod(stakeLockPeriod);

  const { data: isQualifiedOnChain, refetch: refetchQualified } = useReadContract({
    address: VAULT_ADDRESS,
    abi: CryptoSharksStakingVaultAbi,
    functionName: "isCurrentlyQualified",
    args: [tokenId],
    query: { enabled: isStakedInVault, refetchInterval: 12_000 },
  });

  const { data: secondsUntilQualified, refetch: refetchTimer } = useReadContract({
    address: VAULT_ADDRESS,
    abi: CryptoSharksStakingVaultAbi,
    functionName: "timeUntilQualified",
    args: [tokenId],
    query: { enabled: isStakedInVault, refetchInterval: 12_000 },
  });

  const { claimable, totalClaimable, finalizedCount, refetch: refetchRewards } =
    useClaimableEpochs(tokenId, nextEpochId, address);

  const qualifyUnix =
    secondsUntilQualified !== undefined
      ? Math.floor(Date.now() / 1000) + Number(secondsUntilQualified)
      : 0;

  const { writeContractAsync: writeUnstake, isPending: unstaking, data: unstakeHash } =
    useWriteContract();
  const { isLoading: unstakeConfirming, isSuccess: unstakeDone } = useWaitForTransactionReceipt({
    hash: unstakeHash,
  });

  const refresh = () => {
    refetchQualified();
    refetchTimer();
    refetchRewards();
    onChange?.();
  };

  useEffect(() => {
    if (unstakeDone) refresh();
  }, [unstakeDone]);

  const onUnstake = async () => {
    await writeUnstake({
      address: VAULT_ADDRESS,
      abi: CryptoSharksStakingVaultAbi,
      functionName: "unstake",
      args: [tokenId],
    });
  };

  const isQualified = isQualifiedOnChain === true;

  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-4 hover:ring-1 hover:ring-cyan-400/30 transition">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <NftImage tokenId={tokenId} className="h-14 w-14" />
          <div>
            <div className="font-display text-lg text-cyan-100">Shark #{tokenId.toString()}</div>
            <div className="text-xs text-cyan-100/50">In vault</div>
          </div>
        </div>
        {isQualified ? (
          <Badge tone="cyan">Qualified</Badge>
        ) : (
          <Badge tone="amber">Accumulating</Badge>
        )}
      </div>

      {isStakedInVault && !isQualified && secondsUntilQualified !== undefined && (
        <div className="rounded-xl bg-navy-800/60 border border-cyan-400/10 p-4">
          <div className="text-[10px] uppercase tracking-widest text-cyan-100/50 mb-2">
            Time until {lockLabel} threshold
          </div>
          <CountdownTimer targetUnix={qualifyUnix} />
        </div>
      )}

      {finalizedCount === 0 && isQualified && (
        <p className="text-xs text-amber-200/80 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
          You are qualified, but no epoch has been finalized yet. The owner must run{" "}
          <strong>Finalize epoch</strong> with at least one qualified shark staked.
        </p>
      )}

      {totalClaimable > 0n && (
        <div className="rounded-xl bg-cyan-400/8 border border-cyan-400/30 p-4">
          <div className="text-xs text-cyan-100/60 uppercase tracking-widest mb-1">
            Claimable USDC
          </div>
          <div className="font-display text-xl text-cyan-200 text-glow">
            ${formatUsdc(totalClaimable)}
          </div>
          <p className="text-xs text-cyan-100/50 mt-2">
            {claimable.length} epoch{claimable.length > 1 ? "s" : ""} ready to claim
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <ClaimRewardsButton
          tokenId={tokenId}
          claimable={claimable}
          totalClaimable={totalClaimable}
          className="flex-1"
          onSuccess={refresh}
        />
        <Button
          variant="outline"
          className={totalClaimable > 0n ? "" : "flex-1"}
          onClick={onUnstake}
          disabled={unstaking || unstakeConfirming}
        >
          {(unstaking || unstakeConfirming) && <Loader2 className="h-4 w-4 animate-spin" />}
          Unstake
        </Button>
      </div>

      {!isQualified && (
        <p className="text-xs text-cyan-100/50 leading-relaxed">
          Unstaking before the {lockLabel} threshold returns your NFT but resets the
          qualification clock.
        </p>
      )}
    </div>
  );
}
