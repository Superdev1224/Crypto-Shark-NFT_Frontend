"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { erc20Abi } from "@/lib/abis/erc20";
import { CryptoSharksStakingVaultAbi } from "@/lib/abis/CryptoSharksStakingVault";
import { CryptoSharksNFTAbi } from "@/lib/abis/CryptoSharksNFT";
import {
  VAULT_ADDRESS,
  USDC_ADDRESS,
  NFT_ADDRESS,
} from "@/lib/contracts";
import { formatUsdc } from "@/lib/format";
import { Stat } from "./ui/Stat";
import { Coins, Anchor, Calendar, Users } from "lucide-react";
import { CountdownTimer } from "./CountdownTimer";

export function PoolStats() {
  const { data: poolBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [VAULT_ADDRESS],
  });

  const { data: vaultData } = useReadContracts({
    contracts: [
      { address: VAULT_ADDRESS, abi: CryptoSharksStakingVaultAbi, functionName: "currentEpochId" },
      { address: VAULT_ADDRESS, abi: CryptoSharksStakingVaultAbi, functionName: "lastFinalizeTime" },
      { address: VAULT_ADDRESS, abi: CryptoSharksStakingVaultAbi, functionName: "nextFinalizeEligibleTime" },
      { address: VAULT_ADDRESS, abi: CryptoSharksStakingVaultAbi, functionName: "carryForwardUsdc" },
      { address: NFT_ADDRESS, abi: CryptoSharksNFTAbi, functionName: "totalSupply" },
    ],
  });

  const currentEpochId = vaultData?.[0]?.result as bigint | undefined;
  const nextEligible = vaultData?.[2]?.result as bigint | undefined;
  const carryForward = vaultData?.[3]?.result as bigint | undefined;
  const totalSupply = vaultData?.[4]?.result as bigint | undefined;

  const nextEpochUnix = nextEligible ? Number(nextEligible) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Stat
        label="Live Pool"
        icon={<Coins className="h-4 w-4" />}
        value={`$${formatUsdc(poolBalance as bigint | undefined)}`}
        hint="USDC held by the staking vault"
      />
      <Stat
        label="Sharks Minted"
        icon={<Anchor className="h-4 w-4" />}
        value={totalSupply !== undefined ? `${totalSupply.toString()} / 1,000` : "—"}
        hint="ERC-721A minted so far"
      />
      <Stat
        label="Epochs Finalized"
        icon={<Users className="h-4 w-4" />}
        value={currentEpochId !== undefined ? currentEpochId.toString() : "—"}
        hint={carryForward !== undefined ? `Carry-forward: $${formatUsdc(carryForward)}` : ""}
      />
      <Stat
        label="Next Epoch Window"
        icon={<Calendar className="h-4 w-4" />}
        value={
          nextEpochUnix === 0 ? (
            "Anytime"
          ) : (
            <CountdownTimer targetUnix={nextEpochUnix} compact />
          )
        }
        hint="Min. 90 days between epochs"
      />
    </div>
  );
}
