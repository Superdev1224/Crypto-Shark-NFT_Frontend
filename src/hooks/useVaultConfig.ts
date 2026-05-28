"use client";

import { useReadContract } from "wagmi";
import { CryptoSharksStakingVaultAbi } from "@/lib/abis/CryptoSharksStakingVault";
import { VAULT_ADDRESS } from "@/lib/contracts";

/** Reads stake lock & epoch interval from the vault (source of truth). */
export function useVaultConfig() {
  const { data: stakeLockPeriod, refetch: refetchLock } = useReadContract({
    address: VAULT_ADDRESS,
    abi: CryptoSharksStakingVaultAbi,
    functionName: "STAKE_LOCK_PERIOD",
  });

  const { data: epochMinInterval, refetch: refetchInterval } = useReadContract({
    address: VAULT_ADDRESS,
    abi: CryptoSharksStakingVaultAbi,
    functionName: "EPOCH_MIN_INTERVAL",
  });

  return {
    stakeLockPeriod: stakeLockPeriod as bigint | undefined,
    epochMinInterval: epochMinInterval as bigint | undefined,
    refetch: () => {
      refetchLock();
      refetchInterval();
    },
  };
}
