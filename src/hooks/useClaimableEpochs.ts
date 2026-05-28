"use client";

import { useMemo } from "react";
import type { Address } from "viem";
import { useReadContracts } from "wagmi";
import { CryptoSharksStakingVaultAbi } from "@/lib/abis/CryptoSharksStakingVault";
import { VAULT_ADDRESS } from "@/lib/contracts";

export type ClaimableEpoch = { epochId: bigint; amount: bigint };

const REFETCH_MS = 12_000;

/**
 * @param nextEpochId `currentEpochId` from the vault — number of finalized epochs.
 * Claimable epoch ids are `0 .. nextEpochId - 1`.
 */
export function useClaimableEpochs(
  tokenId: bigint,
  nextEpochId: bigint | undefined,
  account?: Address
) {
  const finalizedCount = Number(nextEpochId ?? 0n);

  const contracts = useMemo(() => {
    if (!account || finalizedCount === 0) return [];
    const list: {
      address: typeof VAULT_ADDRESS;
      abi: typeof CryptoSharksStakingVaultAbi;
      functionName: "pendingReward" | "qualified" | "claimed" | "epochs";
      args: readonly bigint[];
      account?: Address;
    }[] = [];

    for (let i = 0; i < finalizedCount; i++) {
      const epochId = BigInt(i);
      list.push({
        address: VAULT_ADDRESS,
        abi: CryptoSharksStakingVaultAbi,
        functionName: "pendingReward",
        args: [epochId, tokenId],
        account,
      });
      list.push({
        address: VAULT_ADDRESS,
        abi: CryptoSharksStakingVaultAbi,
        functionName: "qualified",
        args: [epochId, tokenId],
      });
      list.push({
        address: VAULT_ADDRESS,
        abi: CryptoSharksStakingVaultAbi,
        functionName: "claimed",
        args: [epochId, tokenId],
      });
      list.push({
        address: VAULT_ADDRESS,
        abi: CryptoSharksStakingVaultAbi,
        functionName: "epochs",
        args: [epochId],
      });
    }
    return list;
  }, [account, finalizedCount, tokenId]);

  const { data, refetch, isLoading, isFetching } = useReadContracts({
    contracts,
    query: {
      enabled: !!account && finalizedCount > 0,
      refetchInterval: REFETCH_MS,
    },
  });

  const claimable = useMemo(() => {
    const list: ClaimableEpoch[] = [];
    if (!data || finalizedCount === 0) return list;

    for (let i = 0; i < finalizedCount; i++) {
      const base = i * 4;
      const pending = data[base]?.result as bigint | undefined;
      const qualified = data[base + 1]?.result as boolean | undefined;
      const claimed = data[base + 2]?.result as boolean | undefined;
      const epoch = data[base + 3]?.result as
        | readonly [bigint, bigint, bigint, bigint, boolean]
        | undefined;

      if (claimed) continue;
      if (!epoch?.[4]) continue;

      if (pending !== undefined && pending > 0n) {
        list.push({ epochId: BigInt(i), amount: pending });
      } else if (qualified && epoch[2] > 0n) {
        list.push({ epochId: BigInt(i), amount: epoch[2] });
      }
    }
    return list;
  }, [data, finalizedCount]);

  const totalClaimable = useMemo(
    () => claimable.reduce((acc, x) => acc + x.amount, 0n),
    [claimable]
  );

  return {
    claimable,
    totalClaimable,
    finalizedCount,
    refetch,
    isLoading: isLoading || isFetching,
  };
}
