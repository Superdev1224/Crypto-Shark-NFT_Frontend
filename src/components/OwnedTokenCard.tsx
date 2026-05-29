"use client";

import { useEffect } from "react";
import {
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
  useAccount,
} from "wagmi";
import { CryptoSharksNFTAbi } from "@/lib/abis/CryptoSharksNFT";
import { CryptoSharksStakingVaultAbi } from "@/lib/abis/CryptoSharksStakingVault";
import { NFT_ADDRESS, VAULT_ADDRESS } from "@/lib/contracts";
import { useClaimableEpochs } from "@/hooks/useClaimableEpochs";
import { useVaultConfig } from "@/hooks/useVaultConfig";
import { formatStakeLockPeriod } from "@/lib/stake-lock";
import { claimWindowHint, OWNER_SETTLES_REWARD_PERIOD } from "@/lib/reward-period-copy";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { ClaimRewardsButton } from "./ClaimRewardsButton";
import { NftImage } from "./NftImage";
import { formatUsdc } from "@/lib/format";
import { Loader2 } from "lucide-react";

interface Props {
  tokenId: bigint;
  nextEpochId: bigint;
  onChange?: () => void;
}

export function OwnedTokenCard({ tokenId, nextEpochId, onChange }: Props) {
  const { address } = useAccount();
  const { claimExpiryPeriod } = useVaultConfig();
  const claimExpiryLabel = formatStakeLockPeriod(claimExpiryPeriod);
  const { claimable, totalClaimable, refetch: refetchRewards } = useClaimableEpochs(
    tokenId,
    nextEpochId,
    address,
    claimExpiryPeriod
  );

  const { data: isApprovedForAll, refetch: refetchApproval } = useReadContract({
    address: NFT_ADDRESS,
    abi: CryptoSharksNFTAbi,
    functionName: "isApprovedForAll",
    args: address ? [address, VAULT_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  const { writeContractAsync: writeApprove, isPending: approving, data: approveHash } =
    useWriteContract();
  const { writeContractAsync: writeStake, isPending: staking, data: stakeHash } =
    useWriteContract();
  const { isLoading: approveConfirming, isSuccess: approveDone } =
    useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: stakeConfirming, isSuccess: stakeDone } = useWaitForTransactionReceipt({
    hash: stakeHash,
  });

  useEffect(() => {
    if (approveDone) refetchApproval();
  }, [approveDone, refetchApproval]);

  useEffect(() => {
    if (stakeDone) onChange?.();
  }, [stakeDone, onChange]);

  const onApprove = async () => {
    await writeApprove({
      address: NFT_ADDRESS,
      abi: CryptoSharksNFTAbi,
      functionName: "setApprovalForAll",
      args: [VAULT_ADDRESS, true],
    });
  };

  const onStake = async () => {
    await writeStake({
      address: VAULT_ADDRESS,
      abi: CryptoSharksStakingVaultAbi,
      functionName: "stake",
      args: [tokenId],
    });
  };

  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-4 hover:ring-1 hover:ring-cyan-400/30 transition">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <NftImage tokenId={tokenId} className="h-14 w-14" />
          <div>
            <div className="font-display text-lg text-cyan-100">Shark #{tokenId.toString()}</div>
            <div className="text-xs text-cyan-100/50">In your wallet</div>
          </div>
        </div>
        <Badge tone="teal">In Wallet</Badge>
      </div>

      {totalClaimable > 0n && (
        <div className="rounded-xl bg-cyan-400/8 border border-cyan-400/30 p-4">
          <div className="text-xs text-cyan-100/60 uppercase tracking-widest mb-1">
            Unclaimed rewards
          </div>
          <div className="font-display text-xl text-cyan-200">${formatUsdc(totalClaimable)} USDC</div>
        </div>
      )}

      {totalClaimable > 0n && (
        <ClaimRewardsButton
          tokenId={tokenId}
          claimable={claimable}
          totalClaimable={totalClaimable}
          className="w-full"
          onSuccess={() => {
            refetchRewards();
            onChange?.();
          }}
        />
      )}

      <p className="text-xs text-cyan-100/60 leading-relaxed">
        Stake to start the qualification clock. After the owner {OWNER_SETTLES_REWARD_PERIOD} with
        your shark qualified, you can claim USDC here or while still staked.{" "}
        {claimWindowHint(claimExpiryLabel)}
      </p>

      {!isApprovedForAll ? (
        <Button onClick={onApprove} disabled={approving || approveConfirming}>
          {(approving || approveConfirming) && <Loader2 className="h-4 w-4 animate-spin" />}
          {approveConfirming ? "Approving…" : "Approve Vault"}
        </Button>
      ) : (
        <Button onClick={onStake} disabled={staking || stakeConfirming}>
          {(staking || stakeConfirming) && <Loader2 className="h-4 w-4 animate-spin" />}
          {stakeConfirming ? "Staking…" : "Stake Shark"}
        </Button>
      )}
    </div>
  );
}
