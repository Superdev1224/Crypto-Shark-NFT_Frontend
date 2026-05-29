"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { CryptoSharksNFTAbi } from "@/lib/abis/CryptoSharksNFT";
import { CryptoSharksStakingVaultAbi } from "@/lib/abis/CryptoSharksStakingVault";
import { NFT_ADDRESS, VAULT_ADDRESS } from "@/lib/contracts";
import { Stat } from "./ui/Stat";
import { OwnedTokenCard } from "./OwnedTokenCard";
import { StakedTokenCard } from "./StakedTokenCard";
import { Anchor, Lock, Sparkles, Wallet } from "lucide-react";
import { claimRewardPeriodRange } from "@/lib/reward-period-copy";
import { useConnectModal } from "./WalletModal";
import { Button } from "./ui/Button";

const REFETCH_MS = 12_000;

export function StakeDashboard() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [scanKey, setScanKey] = useState(0);
  const triggerRescan = useCallback(() => setScanKey((k) => k + 1), []);

  const { data: totalSupply, refetch: refetchSupply } = useReadContract({
    address: NFT_ADDRESS,
    abi: CryptoSharksNFTAbi,
    functionName: "totalSupply",
    query: { refetchInterval: REFETCH_MS },
  });

  const { data: nextEpochId, refetch: refetchEpoch } = useReadContract({
    address: VAULT_ADDRESS,
    abi: CryptoSharksStakingVaultAbi,
    functionName: "currentEpochId",
    query: { refetchInterval: REFETCH_MS },
  });

  const minted = Number(totalSupply ?? 0n);
  const finalizedEpochs = Number(nextEpochId ?? 0n);

  const queries = useMemo(() => {
    const arr: {
      address: typeof NFT_ADDRESS | typeof VAULT_ADDRESS;
      abi: typeof CryptoSharksNFTAbi | typeof CryptoSharksStakingVaultAbi;
      functionName: "ownerOf" | "stakes";
      args: readonly bigint[];
    }[] = [];
    for (let i = 1; i <= minted; i++) {
      arr.push({
        address: NFT_ADDRESS,
        abi: CryptoSharksNFTAbi,
        functionName: "ownerOf",
        args: [BigInt(i)] as const,
      });
      arr.push({
        address: VAULT_ADDRESS,
        abi: CryptoSharksStakingVaultAbi,
        functionName: "stakes",
        args: [BigInt(i)] as const,
      });
    }
    return arr;
  }, [minted]);

  const { data: scanData, refetch: refetchScan } = useReadContracts({
    contracts: queries,
    query: { enabled: minted > 0 && !!address, refetchInterval: REFETCH_MS },
  });

  useEffect(() => {
    if (address) refetchScan();
  }, [address, scanKey, refetchScan]);

  const refreshAll = useCallback(() => {
    triggerRescan();
    refetchSupply();
    refetchEpoch();
    refetchScan();
  }, [triggerRescan, refetchSupply, refetchEpoch, refetchScan]);

  const owned: bigint[] = [];
  const staked: bigint[] = [];
  if (address && scanData) {
    for (let i = 0; i < minted; i++) {
      const tokenId = BigInt(i + 1);
      const owner = scanData[i * 2]?.result as `0x${string}` | undefined;
      const stakeInfo = scanData[i * 2 + 1]?.result as
        | readonly [bigint, `0x${string}`]
        | undefined;
      if (owner?.toLowerCase() === address.toLowerCase()) {
        owned.push(tokenId);
      } else if (
        owner?.toLowerCase() === VAULT_ADDRESS.toLowerCase() &&
        stakeInfo?.[1].toLowerCase() === address.toLowerCase()
      ) {
        staked.push(tokenId);
      }
    }
  }

  if (!isConnected) {
    return (
      <div className="glass rounded-2xl p-10 text-center max-w-xl mx-auto">
        <Wallet className="h-10 w-10 mx-auto text-cyan-300" />
        <h2 className="font-display text-2xl mt-4 text-cyan-100">Connect to view your dashboard</h2>
        <p className="text-cyan-100/60 mt-2 mb-6">
          Track your sharks, stake them into the vault, watch the qualification countdown,
          and claim USDC dividends — all in one place.
        </p>
        <Button size="lg" onClick={openConnectModal}>
          Connect Wallet
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat
          label="Sharks Owned"
          icon={<Anchor className="h-4 w-4" />}
          value={owned.length + staked.length}
          hint="Across your wallet and the vault"
        />
        <Stat
          label="Currently Staked"
          icon={<Lock className="h-4 w-4" />}
          value={staked.length}
          hint="In the staking vault"
        />
        <Stat
          label="Rewards Distributed"
          icon={<Sparkles className="h-4 w-4" />}
          value={finalizedEpochs}
          hint={
            finalizedEpochs === 0
              ? "Owner must settle with qualified sharks"
              : claimRewardPeriodRange(finalizedEpochs)
          }
        />
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-xl tracking-wider text-cyan-100">
            Staked Sharks
          </h3>
          <span className="text-sm text-cyan-100/50">{staked.length} active</span>
        </div>
        {staked.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-cyan-100/60">
            No sharks staked yet. Stake one below to start the qualification clock.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staked.map((tokenId) => (
              <StakedTokenCard
                key={tokenId.toString()}
                tokenId={tokenId}
                isStakedInVault
                nextEpochId={(nextEpochId as bigint) ?? 0n}
                onChange={refreshAll}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-xl tracking-wider text-cyan-100">
            Available to Stake
          </h3>
          <span className="text-sm text-cyan-100/50">{owned.length} in wallet</span>
        </div>
        {owned.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-cyan-100/60">
            Nothing to stake right now.{" "}
            <a href="/mint" className="text-cyan-300 underline">
              Mint a Crypto Shark
            </a>{" "}
            to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {owned.map((tokenId) => (
              <OwnedTokenCard
                key={tokenId.toString()}
                tokenId={tokenId}
                nextEpochId={(nextEpochId as bigint) ?? 0n}
                onChange={refreshAll}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
