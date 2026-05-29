"use client";

import { useMemo } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { CryptoSharksNFTAbi } from "@/lib/abis/CryptoSharksNFT";
import { NFT_ADDRESS, VAULT_ADDRESS } from "@/lib/contracts";

const REFETCH_MS = 12_000;

/** Minted, staked (in vault), and unstaked shark counts for admin overview. */
export function useSharkSupplyStats(enabled: boolean) {
  const { data: totalSupply, isLoading: isLoadingSupply, refetch: refetchSupply } = useReadContract({
    address: NFT_ADDRESS,
    abi: CryptoSharksNFTAbi,
    functionName: "totalSupply",
    query: { enabled, refetchInterval: REFETCH_MS },
  });

  const minted = Number(totalSupply ?? 0n);

  const ownerQueries = useMemo(() => {
    if (minted === 0) return [];
    return Array.from({ length: minted }, (_, i) => ({
      address: NFT_ADDRESS,
      abi: CryptoSharksNFTAbi,
      functionName: "ownerOf" as const,
      args: [BigInt(i + 1)] as const,
    }));
  }, [minted]);

  const { data: ownerData, isLoading: isLoadingOwners, refetch: refetchOwners } = useReadContracts({
    contracts: ownerQueries,
    query: { enabled: enabled && minted > 0, refetchInterval: REFETCH_MS },
  });

  const { staked, unstaked } = useMemo(() => {
    if (minted === 0) return { staked: 0, unstaked: 0 };
    if (!ownerData) return { staked: 0, unstaked: minted };

    const vault = VAULT_ADDRESS.toLowerCase();
    let stakedCount = 0;
    for (const row of ownerData) {
      const owner = row.result as string | undefined;
      if (owner?.toLowerCase() === vault) stakedCount++;
    }
    return { staked: stakedCount, unstaked: minted - stakedCount };
  }, [minted, ownerData]);

  const refetch = () => {
    refetchSupply();
    refetchOwners();
  };

  return {
    minted,
    staked,
    unstaked,
    isLoadingSupply,
    isLoadingStakeSplit: minted > 0 && isLoadingOwners,
    refetch,
  };
}
