"use client";

import { useMemo } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { CryptoSharksNFTAbi } from "@/lib/abis/CryptoSharksNFT";
import { CryptoSharksStakingVaultAbi } from "@/lib/abis/CryptoSharksStakingVault";
import { NFT_ADDRESS, VAULT_ADDRESS } from "@/lib/contracts";

const REFETCH_MS = 12_000;

/** How many minted sharks are currently qualified in the vault (for admin finalize preview). */
export function useQualifiedSharkCount(enabled: boolean) {
  const { data: totalSupply } = useReadContract({
    address: NFT_ADDRESS,
    abi: CryptoSharksNFTAbi,
    functionName: "totalSupply",
    query: { enabled, refetchInterval: REFETCH_MS },
  });

  const minted = Number(totalSupply ?? 0n);

  const contracts = useMemo(() => {
    if (minted === 0) return [];
    return Array.from({ length: minted }, (_, i) => ({
      address: VAULT_ADDRESS,
      abi: CryptoSharksStakingVaultAbi,
      functionName: "isCurrentlyQualified" as const,
      args: [BigInt(i + 1)] as const,
    }));
  }, [minted]);

  const { data, isLoading, refetch } = useReadContracts({
    contracts,
    query: { enabled: enabled && minted > 0, refetchInterval: REFETCH_MS },
  });

  const qualifiedCount = useMemo(() => {
    if (!data) return 0;
    return data.filter((r) => r.result === true).length;
  }, [data]);

  return { qualifiedCount, minted, isLoading, refetch };
}
