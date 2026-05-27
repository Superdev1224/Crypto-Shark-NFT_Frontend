"use client";

import { useEffect, useMemo } from "react";
import {
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { CryptoSharksStakingVaultAbi } from "@/lib/abis/CryptoSharksStakingVault";
import { VAULT_ADDRESS, STAKE_LOCK_SECONDS } from "@/lib/contracts";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { CountdownTimer } from "./CountdownTimer";
import { formatUsdc } from "@/lib/format";
import { NftImage } from "./NftImage";
import { Loader2, Coins } from "lucide-react";

interface Props {
  tokenId: bigint;
  isStakedInVault: boolean;
  currentEpochId: bigint;
  onChange?: () => void;
}

export function StakedTokenCard({ tokenId, isStakedInVault, currentEpochId, onChange }: Props) {
  const { data: stakeInfo, refetch: refetchStake } = useReadContract({
    address: VAULT_ADDRESS,
    abi: CryptoSharksStakingVaultAbi,
    functionName: "stakes",
    args: [tokenId],
    query: { enabled: isStakedInVault },
  });

  const stakeStartTime = (stakeInfo as readonly [bigint, `0x${string}`] | undefined)?.[0] ?? 0n;
  const qualifyUnix = Number(stakeStartTime) + STAKE_LOCK_SECONDS;
  const now = Math.floor(Date.now() / 1000);
  const isQualified = isStakedInVault && stakeStartTime > 0n && now >= qualifyUnix;

  // Build list of (epochId, claimable) for unclaimed finalized epochs
  const epochCount = Number(currentEpochId);
  const epochQueries = useMemo(() => {
    const arr = [] as {
      address: typeof VAULT_ADDRESS;
      abi: typeof CryptoSharksStakingVaultAbi;
      functionName: "qualified" | "claimed" | "epochs";
      args: readonly bigint[];
    }[];
    for (let i = 0; i < epochCount; i++) {
      const id = BigInt(i);
      arr.push({
        address: VAULT_ADDRESS,
        abi: CryptoSharksStakingVaultAbi,
        functionName: "qualified",
        args: [id, tokenId] as const,
      });
      arr.push({
        address: VAULT_ADDRESS,
        abi: CryptoSharksStakingVaultAbi,
        functionName: "claimed",
        args: [id, tokenId] as const,
      });
      arr.push({
        address: VAULT_ADDRESS,
        abi: CryptoSharksStakingVaultAbi,
        functionName: "epochs",
        args: [id] as const,
      });
    }
    return arr;
  }, [epochCount, tokenId]);

  const { data: epochResults, refetch: refetchEpochs } = useReadContracts({
    contracts: epochQueries,
    query: { enabled: epochCount > 0 },
  });

  const claimable: { epochId: bigint; amount: bigint }[] = [];
  if (epochResults) {
    for (let i = 0; i < epochCount; i++) {
      const q = epochResults[i * 3]?.result as boolean | undefined;
      const c = epochResults[i * 3 + 1]?.result as boolean | undefined;
      const epoch = epochResults[i * 3 + 2]?.result as
        | readonly [bigint, bigint, bigint, bigint, boolean]
        | undefined;
      if (q && !c && epoch && epoch[4]) {
        claimable.push({ epochId: BigInt(i), amount: epoch[2] });
      }
    }
  }

  const totalClaimable = claimable.reduce((acc, x) => acc + x.amount, 0n);

  const { writeContractAsync: writeUnstake, isPending: unstaking, data: unstakeHash } = useWriteContract();
  const { writeContractAsync: writeClaim, isPending: claiming, data: claimHash } = useWriteContract();
  const { isLoading: unstakeConfirming, isSuccess: unstakeDone } = useWaitForTransactionReceipt({ hash: unstakeHash });
  const { isLoading: claimConfirming, isSuccess: claimDone } = useWaitForTransactionReceipt({ hash: claimHash });

  useEffect(() => {
    if (unstakeDone || claimDone) {
      refetchStake();
      refetchEpochs();
      onChange?.();
    }
  }, [unstakeDone, claimDone, refetchStake, refetchEpochs, onChange]);

  const onUnstake = async () => {
    await writeUnstake({
      address: VAULT_ADDRESS,
      abi: CryptoSharksStakingVaultAbi,
      functionName: "unstake",
      args: [tokenId],
    });
  };

  const onClaimAll = async () => {
    // Claim each epoch sequentially. Frontend keeps the call simple; users can claim per epoch.
    for (const { epochId } of claimable) {
      await writeClaim({
        address: VAULT_ADDRESS,
        abi: CryptoSharksStakingVaultAbi,
        functionName: "claim",
        args: [epochId, tokenId],
      });
    }
  };

  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-4 hover:ring-1 hover:ring-cyan-400/30 transition">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <NftImage tokenId={tokenId} className="h-14 w-14" />
          <div>
            <div className="font-display text-lg text-cyan-100">Shark #{tokenId.toString()}</div>
            <div className="text-xs text-cyan-100/50">
              {isStakedInVault ? "In vault" : "In your wallet"}
            </div>
          </div>
        </div>
        {isStakedInVault ? (
          isQualified ? (
            <Badge tone="cyan">Qualified for Upcoming Payout</Badge>
          ) : (
            <Badge tone="amber">Accumulating</Badge>
          )
        ) : (
          <Badge tone="muted">Unstaked</Badge>
        )}
      </div>

      {isStakedInVault && (
        <div className="rounded-xl bg-navy-800/60 border border-cyan-400/10 p-4">
          <div className="text-[10px] uppercase tracking-widest text-cyan-100/50 mb-2">
            Time to 90-day threshold
          </div>
          <CountdownTimer targetUnix={qualifyUnix} />
        </div>
      )}

      {totalClaimable > 0n && (
        <div className="rounded-xl bg-cyan-400/8 border border-cyan-400/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-cyan-300" />
            <div>
              <div className="text-xs text-cyan-100/60 uppercase tracking-widest">
                Claimable USDC
              </div>
              <div className="font-display text-xl text-cyan-200 text-glow">
                ${formatUsdc(totalClaimable)}
              </div>
            </div>
          </div>
          <span className="text-xs text-cyan-100/50">
            {claimable.length} epoch{claimable.length > 1 ? "s" : ""}
          </span>
        </div>
      )}

      <div className="flex gap-2">
        {totalClaimable > 0n && (
          <Button
            className="flex-1"
            onClick={onClaimAll}
            disabled={claiming || claimConfirming}
          >
            {(claiming || claimConfirming) && <Loader2 className="h-4 w-4 animate-spin" />}
            {claimConfirming ? "Claiming…" : `Claim $${formatUsdc(totalClaimable)}`}
          </Button>
        )}
        {isStakedInVault && (
          <Button
            variant="outline"
            className={totalClaimable > 0n ? "" : "flex-1"}
            onClick={onUnstake}
            disabled={unstaking || unstakeConfirming}
          >
            {(unstaking || unstakeConfirming) && <Loader2 className="h-4 w-4 animate-spin" />}
            Unstake
          </Button>
        )}
      </div>

      {isStakedInVault && !isQualified && (
        <p className="text-xs text-cyan-100/50 leading-relaxed">
          Unstaking before the 90-day threshold returns your NFT immediately but
          resets the qualification clock and forfeits the current epoch.
        </p>
      )}
    </div>
  );
}
