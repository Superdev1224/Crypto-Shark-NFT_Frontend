"use client";

import { useMemo } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { CryptoSharksNFTAbi } from "@/lib/abis/CryptoSharksNFT";
import { CryptoSharksStakingVaultAbi } from "@/lib/abis/CryptoSharksStakingVault";
import { NFT_ADDRESS, VAULT_ADDRESS } from "@/lib/contracts";
import { claimDeadlineTimestamp, isClaimExpired } from "@/lib/claim-expiry";

export type ExpiredUnclaimedReward = {
  epochId: bigint;
  tokenId: bigint;
  amount: bigint;
  expiredAt: number;
};

const REFETCH_MS = 12_000;

type EpochTuple = readonly [bigint, bigint, bigint, bigint, boolean];

/** Admin scan: qualified sharks with expired, unclaimed rewards across all settled periods. */
export function useExpiredUnclaimedRewards(
  enabled: boolean,
  nextEpochId: bigint | undefined,
  claimExpiryPeriod: bigint | undefined
) {
  const finalizedCount = Number(nextEpochId ?? 0n);
  const nowSec = Math.floor(Date.now() / 1000);

  const { data: totalSupply } = useReadContract({
    address: NFT_ADDRESS,
    abi: CryptoSharksNFTAbi,
    functionName: "totalSupply",
    query: { enabled: enabled && finalizedCount > 0, refetchInterval: REFETCH_MS },
  });

  const minted = Number(totalSupply ?? 0n);

  const epochContracts = useMemo(() => {
    if (!enabled || finalizedCount === 0) return [];
    return Array.from({ length: finalizedCount }, (_, i) => ({
      address: VAULT_ADDRESS,
      abi: CryptoSharksStakingVaultAbi,
      functionName: "epochs" as const,
      args: [BigInt(i)] as const,
    }));
  }, [enabled, finalizedCount]);

  const {
    data: epochData,
    isLoading: epochsLoading,
    isFetching: epochsFetching,
    refetch: refetchEpochs,
  } = useReadContracts({
    contracts: epochContracts,
    query: { enabled: enabled && finalizedCount > 0, refetchInterval: REFETCH_MS },
  });

  const expiredEpochs = useMemo(() => {
    if (!epochData || claimExpiryPeriod === undefined) return [];
    const list: { epochId: bigint; rewardPerShark: bigint; expiredAt: number }[] = [];

    for (let i = 0; i < finalizedCount; i++) {
      const epoch = epochData[i]?.result as EpochTuple | undefined;
      if (!epoch?.[4]) continue;
      const snapshotTime = epoch[3];
      if (!isClaimExpired(snapshotTime, claimExpiryPeriod, nowSec)) continue;
      const expiredAt = claimDeadlineTimestamp(snapshotTime, claimExpiryPeriod);
      if (expiredAt === null) continue;
      list.push({
        epochId: BigInt(i),
        rewardPerShark: epoch[2],
        expiredAt,
      });
    }
    return list;
  }, [claimExpiryPeriod, epochData, finalizedCount, nowSec]);

  const scanContracts = useMemo(() => {
    if (minted === 0 || expiredEpochs.length === 0) return [];
    const list: {
      address: typeof VAULT_ADDRESS;
      abi: typeof CryptoSharksStakingVaultAbi;
      functionName: "qualified" | "claimed";
      args: readonly [bigint, bigint];
    }[] = [];

    for (const { epochId } of expiredEpochs) {
      for (let tokenId = 1; tokenId <= minted; tokenId++) {
        const id = BigInt(tokenId);
        list.push({
          address: VAULT_ADDRESS,
          abi: CryptoSharksStakingVaultAbi,
          functionName: "qualified",
          args: [epochId, id],
        });
        list.push({
          address: VAULT_ADDRESS,
          abi: CryptoSharksStakingVaultAbi,
          functionName: "claimed",
          args: [epochId, id],
        });
      }
    }
    return list;
  }, [expiredEpochs, minted]);

  const {
    data: scanData,
    isLoading: scanLoading,
    isFetching: scanFetching,
    refetch: refetchScan,
  } = useReadContracts({
    contracts: scanContracts,
    query: {
      enabled: enabled && scanContracts.length > 0,
      refetchInterval: REFETCH_MS,
    },
  });

  const expiredUnclaimed = useMemo(() => {
    const list: ExpiredUnclaimedReward[] = [];
    if (!scanData || expiredEpochs.length === 0 || minted === 0) return list;

    let offset = 0;
    for (const { epochId, rewardPerShark, expiredAt } of expiredEpochs) {
      for (let tokenId = 1; tokenId <= minted; tokenId++) {
        const qualified = scanData[offset]?.result as boolean | undefined;
        const claimed = scanData[offset + 1]?.result as boolean | undefined;
        offset += 2;

        if (qualified && !claimed && rewardPerShark > 0n) {
          list.push({
            epochId,
            tokenId: BigInt(tokenId),
            amount: rewardPerShark,
            expiredAt,
          });
        }
      }
    }

    return list.sort((a, b) => {
      const epochCmp = Number(a.epochId - b.epochId);
      if (epochCmp !== 0) return epochCmp;
      return Number(a.tokenId - b.tokenId);
    });
  }, [expiredEpochs, minted, scanData]);

  const totalExpiredUnclaimed = useMemo(
    () => expiredUnclaimed.reduce((acc, x) => acc + x.amount, 0n),
    [expiredUnclaimed]
  );

  const refetch = () => {
    refetchEpochs();
    refetchScan();
  };

  return {
    expiredUnclaimed,
    totalExpiredUnclaimed,
    isLoading: epochsLoading || scanLoading,
    isFetching: epochsFetching || scanFetching,
    refetch,
  };
}
