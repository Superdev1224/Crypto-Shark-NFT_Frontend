"use client";

import { useState } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { CryptoSharksStakingVaultAbi } from "@/lib/abis/CryptoSharksStakingVault";
import { VAULT_ADDRESS } from "@/lib/contracts";
import { formatUsdc } from "@/lib/format";
import type { ClaimableEpoch } from "@/hooks/useClaimableEpochs";
import { Button } from "./ui/Button";
import { Loader2 } from "lucide-react";

interface Props {
  tokenId: bigint;
  claimable: ClaimableEpoch[];
  totalClaimable: bigint;
  className?: string;
  onSuccess?: () => void;
}

export function ClaimRewardsButton({
  tokenId,
  claimable,
  totalClaimable,
  className,
  onSuccess,
}: Props) {
  const { writeContractAsync, isPending } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const busy = isPending || confirming;

  if (totalClaimable === 0n) return null;

  const onClaimAll = async () => {
    for (const { epochId } of claimable) {
      const hash = await writeContractAsync({
        address: VAULT_ADDRESS,
        abi: CryptoSharksStakingVaultAbi,
        functionName: "claim",
        args: [epochId, tokenId],
      });
      setTxHash(hash);
    }
    onSuccess?.();
  };

  return (
    <Button className={className} onClick={onClaimAll} disabled={busy}>
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {confirming ? "Claiming…" : `Claim $${formatUsdc(totalClaimable)}`}
    </Button>
  );
}
