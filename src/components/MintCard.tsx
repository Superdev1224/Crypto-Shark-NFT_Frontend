"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { CryptoSharksNFTAbi } from "@/lib/abis/CryptoSharksNFT";
import { erc20Abi } from "@/lib/abis/erc20";
import { NFT_ADDRESS, USDC_ADDRESS, TIERS, MAX_SUPPLY } from "@/lib/contracts";
import { formatUsdc, usdCentsToUsd } from "@/lib/format";
import { Card, CardHeader, CardTitle, CardSubtitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { useConnectModal } from "./WalletModal";
import { Loader2, Sparkles } from "lucide-react";

export function MintCard() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [quantity, setQuantity] = useState(1);

  const { data: totalSupply, refetch: refetchSupply } = useReadContract({
    address: NFT_ADDRESS,
    abi: CryptoSharksNFTAbi,
    functionName: "totalSupply",
  });

  const minted = Number(totalSupply ?? 0n);
  const remaining = MAX_SUPPLY - minted;
  const safeQty = Math.min(Math.max(1, quantity), Math.max(1, remaining));
  const startIdx = minted + 1;
  const endIdx = Math.min(minted + safeQty, MAX_SUPPLY);

  const { data: usdcRequired, refetch: refetchPrice } = useReadContract({
    address: NFT_ADDRESS,
    abi: CryptoSharksNFTAbi,
    functionName: "usdcRequiredForMintRange",
    args: [BigInt(startIdx), BigInt(endIdx)],
    query: { enabled: remaining > 0 && startIdx <= endIdx },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, NFT_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const needsApprove = useMemo(() => {
    if (!usdcRequired || allowance === undefined) return true;
    return (allowance as bigint) < (usdcRequired as bigint);
  }, [allowance, usdcRequired]);

  const insufficientBalance = useMemo(() => {
    if (!usdcRequired || usdcBalance === undefined) return false;
    return (usdcBalance as bigint) < (usdcRequired as bigint);
  }, [usdcBalance, usdcRequired]);

  const { writeContractAsync: writeApprove, isPending: approving, data: approveHash } = useWriteContract();
  const { writeContractAsync: writeMint, isPending: minting, data: mintHash } = useWriteContract();

  const { isLoading: approveConfirming, isSuccess: approveDone } = useWaitForTransactionReceipt({
    hash: approveHash,
  });
  const { isLoading: mintConfirming, isSuccess: mintDone } = useWaitForTransactionReceipt({
    hash: mintHash,
  });

  useEffect(() => {
    if (approveDone) refetchAllowance();
  }, [approveDone, refetchAllowance]);

  useEffect(() => {
    if (mintDone) {
      refetchSupply();
      refetchPrice();
      refetchAllowance();
    }
  }, [mintDone, refetchSupply, refetchPrice, refetchAllowance]);

  const tiersInRange = TIERS.filter((t) => endIdx >= t.range[0] && startIdx <= t.range[1]);

  const onApprove = async () => {
    if (!usdcRequired) return;
    await writeApprove({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: "approve",
      args: [NFT_ADDRESS, usdcRequired as bigint],
    });
  };

  const onMint = async () => {
    await writeMint({
      address: NFT_ADDRESS,
      abi: CryptoSharksNFTAbi,
      functionName: "mint",
      args: [BigInt(safeQty)],
    });
  };

  return (
    <Card className="max-w-xl w-full">
      <CardHeader>
        <div>
          <CardTitle>Mint a Crypto Shark</CardTitle>
          <CardSubtitle>
            Tiered USDC pricing · 1,000 supply · ERC-721A
          </CardSubtitle>
        </div>
        <Badge tone="cyan">
          <Sparkles className="h-3 w-3" />
          {remaining.toLocaleString()} / {MAX_SUPPLY.toLocaleString()} left
        </Badge>
      </CardHeader>

      <div className="grid grid-cols-4 gap-2 mb-5">
        {TIERS.map((t) => {
          const active = minted + 1 >= t.range[0] && minted + 1 <= t.range[1];
          return (
            <div
              key={t.label}
              className={`rounded-xl p-3 text-center transition-all ${
                active
                  ? "bg-cyan-400/10 ring-1 ring-cyan-400/50 shadow-glow"
                  : "bg-navy-700/40 ring-1 ring-cyan-400/10"
              }`}
            >
              <div className="text-[10px] uppercase tracking-widest text-cyan-100/60">
                {t.label}
              </div>
              <div className="font-display text-cyan-100 mt-1">
                ${usdCentsToUsd(t.priceCents)}
              </div>
              <div className="text-[10px] text-cyan-100/40 mt-0.5">
                #{t.range[0]}–{t.range[1]}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm text-cyan-100/70">Quantity</label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={safeQty <= 1}
            >
              −
            </Button>
            <input
              className="w-16 h-9 bg-navy-700/60 border border-cyan-400/20 rounded-lg text-center font-display text-cyan-100 outline-none focus:ring-2 focus:ring-cyan-400/40"
              type="number"
              min={1}
              max={remaining}
              value={safeQty}
              onChange={(e) => setQuantity(Number(e.target.value) || 1)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity((q) => Math.min(remaining, q + 1))}
              disabled={safeQty >= remaining}
            >
              +
            </Button>
          </div>
        </div>

        <div className="rounded-xl bg-navy-800/60 border border-cyan-400/10 p-4 space-y-2 text-sm">
          <Row label="Token IDs" value={`#${startIdx} – #${endIdx}`} />
          <Row
            label="Tiers in this mint"
            value={tiersInRange.map((t) => t.label).join(", ") || "—"}
          />
          <Row
            label="Total cost"
            value={
              <span className="font-display text-cyan-200 text-base">
                ${formatUsdc(usdcRequired as bigint | undefined)} USDC
              </span>
            }
          />
        </div>

        {!isConnected ? (
          <div className="pt-2">
            <Button onClick={openConnectModal} className="w-full" size="lg">
              Connect Wallet to Mint
            </Button>
          </div>
        ) : insufficientBalance ? (
          <Button className="w-full" size="lg" disabled>
            Insufficient USDC balance
          </Button>
        ) : needsApprove ? (
          <Button
            className="w-full"
            size="lg"
            onClick={onApprove}
            disabled={approving || approveConfirming}
          >
            {(approving || approveConfirming) && <Loader2 className="h-4 w-4 animate-spin" />}
            {approveConfirming ? "Confirming approval…" : "Approve USDC"}
          </Button>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={onMint}
            disabled={minting || mintConfirming || remaining === 0}
          >
            {(minting || mintConfirming) && <Loader2 className="h-4 w-4 animate-spin" />}
            {mintConfirming
              ? "Minting…"
              : `Mint ${safeQty} Shark${safeQty > 1 ? "s" : ""}`}
          </Button>
        )}

        {mintDone && (
          <div className="text-sm text-cyan-300 text-center">
            Minted! Head over to <a className="underline" href="/stake">Stake</a> to begin earning.
          </div>
        )}
      </div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-cyan-100/60">{label}</span>
      <span className="text-cyan-100">{value}</span>
    </div>
  );
}
