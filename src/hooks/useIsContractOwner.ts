"use client";

import { useMemo } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { CryptoSharksNFTAbi } from "@/lib/abis/CryptoSharksNFT";
import { CryptoSharksStakingVaultAbi } from "@/lib/abis/CryptoSharksStakingVault";
import { NFT_ADDRESS, VAULT_ADDRESS } from "@/lib/contracts";

export function useIsContractOwner() {
  const { address, isConnected } = useAccount();

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      { address: NFT_ADDRESS, abi: CryptoSharksNFTAbi, functionName: "owner" },
      { address: VAULT_ADDRESS, abi: CryptoSharksStakingVaultAbi, functionName: "owner" },
    ],
    query: { enabled: isConnected },
  });

  const nftOwner = data?.[0]?.result as `0x${string}` | undefined;
  const vaultOwner = data?.[1]?.result as `0x${string}` | undefined;

  const isNftOwner = useMemo(() => {
    if (!address || !nftOwner) return false;
    return nftOwner.toLowerCase() === address.toLowerCase();
  }, [address, nftOwner]);

  const isVaultOwner = useMemo(() => {
    if (!address || !vaultOwner) return false;
    return vaultOwner.toLowerCase() === address.toLowerCase();
  }, [address, vaultOwner]);

  /** Owner of both NFT and vault contracts */
  const isOwner = isNftOwner && isVaultOwner;

  /** Owner of at least one admin contract */
  const isAnyOwner = isNftOwner || isVaultOwner;

  return {
    isOwner,
    isNftOwner,
    isVaultOwner,
    isAnyOwner,
    isLoading: isConnected && isLoading,
    nftOwner,
    vaultOwner,
    refetch,
  };
}
