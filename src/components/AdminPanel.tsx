"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { isAddress, zeroAddress, type Address } from "viem";
import { CryptoSharksNFTAbi } from "@/lib/abis/CryptoSharksNFT";
import { CryptoSharksStakingVaultAbi } from "@/lib/abis/CryptoSharksStakingVault";
import { erc20Abi } from "@/lib/abis/erc20";
import { NFT_ADDRESS, USDC_ADDRESS, VAULT_ADDRESS, MAX_SUPPLY } from "@/lib/contracts";
import { formatUsdc, parseUsdcInput, shortAddress } from "@/lib/format";
import {
  NEXT_SETTLEMENT_LABEL,
  SETTLE_PERIOD_ACTION,
  SETTLED_PERIODS_LABEL,
  SETTLING_ACTION,
  settledPeriodsStatLine,
} from "@/lib/reward-period-copy";
import { useIsContractOwner } from "@/hooks/useIsContractOwner";
import { useExpiredUnclaimedRewards } from "@/hooks/useExpiredUnclaimedRewards";
import { useQualifiedSharkCount } from "@/hooks/useQualifiedSharkCount";
import { useSharkSupplyStats } from "@/hooks/useSharkSupplyStats";
import { useVaultConfig } from "@/hooks/useVaultConfig";
import { formatStakeLockPeriod } from "@/lib/stake-lock";
import { useConnectModal } from "./WalletModal";
import { Card, CardHeader, CardTitle, CardSubtitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Stat } from "./ui/Stat";
import { ConnectWalletButton } from "./ConnectWalletButton";
import { buildMetadataApiBaseURI } from "@/lib/nft-metadata";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Anchor,
  Lock,
  Shield,
  Wallet,
  Coins,
  ImageIcon,
  UserCog,
} from "lucide-react";

type PendingAction =
  | "withdraw"
  | "approve"
  | "finalize"
  | "reclaim"
  | "setBaseURI"
  | "lockBaseURI"
  | "transferNftOwner"
  | "transferVaultOwner"
  | null;

function OwnerOnlyOverlay({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-navy-900/80 backdrop-blur-sm border border-cyan-400/10 p-4">
      <p className="text-sm text-center text-cyan-100/70 max-w-xs">
        <Lock className="h-4 w-4 inline-block mr-1.5 -mt-0.5 text-rose-300" />
        {message}
      </p>
    </div>
  );
}

/** finalizeEpoch scans MAX_SUPPLY; Sepolia block gas ~30M — use a safe ceiling if estimate fails. */
const FINALIZE_EPOCH_GAS_FALLBACK = 12_000_000n;

export function AdminPanel() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { openConnectModal } = useConnectModal();
  const {
    isNftOwner,
    isVaultOwner,
    isAnyOwner,
    isLoading: ownerLoading,
    nftOwner,
    vaultOwner,
    refetch: refetchOwners,
  } = useIsContractOwner();

  const [epochDeposit, setEpochDeposit] = useState("1000");
  const [reclaimEpochId, setReclaimEpochId] = useState("0");
  const [reclaimTokenId, setReclaimTokenId] = useState("1");
  const [baseUriInput, setBaseUriInput] = useState("");
  const [nftNewOwner, setNftNewOwner] = useState("");
  const [vaultNewOwner, setVaultNewOwner] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && !baseUriInput) {
      setBaseUriInput(buildMetadataApiBaseURI(window.location.origin));
    }
  }, [baseUriInput]);

  const { data: baseUriLocked } = useReadContract({
    address: NFT_ADDRESS,
    abi: CryptoSharksNFTAbi,
    functionName: "baseURILocked",
    query: { enabled: isNftOwner },
  });

  const { data: nftTotalSupply } = useReadContract({
    address: NFT_ADDRESS,
    abi: CryptoSharksNFTAbi,
    functionName: "totalSupply",
    query: { enabled: isNftOwner },
  });

  const { data: sampleTokenURI, refetch: refetchTokenUri } = useReadContract({
    address: NFT_ADDRESS,
    abi: CryptoSharksNFTAbi,
    functionName: "tokenURI",
    args: [1n],
    query: { enabled: isNftOwner && Number(nftTotalSupply ?? 0n) > 0 },
  });

  const { data: nftUsdcBalance, refetch: refetchNftBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [NFT_ADDRESS],
    query: { enabled: isNftOwner },
  });

  const { stakeLockPeriod, epochMinInterval, claimExpiryPeriod } = useVaultConfig();
  const { qualifiedCount: qualifiedSharksNow, minted: mintedSharks } =
    useQualifiedSharkCount(isVaultOwner);
  const {
    minted: supplyMinted,
    staked: stakedSharks,
    unstaked: unstakedSharks,
    isLoadingSupply,
    isLoadingStakeSplit,
    refetch: refetchSupplyStats,
  } = useSharkSupplyStats(isAnyOwner);

  const { data: vaultData, refetch: refetchVault } = useReadContracts({
    contracts: [
      { address: VAULT_ADDRESS, abi: CryptoSharksStakingVaultAbi, functionName: "currentEpochId" },
      { address: VAULT_ADDRESS, abi: CryptoSharksStakingVaultAbi, functionName: "lastFinalizeTime" },
      {
        address: VAULT_ADDRESS,
        abi: CryptoSharksStakingVaultAbi,
        functionName: "nextFinalizeEligibleTime",
      },
      { address: VAULT_ADDRESS, abi: CryptoSharksStakingVaultAbi, functionName: "carryForwardUsdc" },
    ],
    query: { enabled: isVaultOwner, refetchInterval: 12_000 },
  });

  const depositAmount = useMemo(() => parseUsdcInput(epochDeposit), [epochDeposit]);

  const { data: ownerUsdcBalance, refetch: refetchOwnerBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && isVaultOwner },
  });

  const { data: vaultAllowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, VAULT_ADDRESS] : undefined,
    query: { enabled: !!address && isVaultOwner },
  });

  const nextEpochId = vaultData?.[0]?.result as bigint | undefined;
  const lastFinalizeTime = vaultData?.[1]?.result as bigint | undefined;
  const nextEligible = vaultData?.[2]?.result as bigint | undefined;
  const carryForward = vaultData?.[3]?.result as bigint | undefined;
  const finalizedEpochCount = Number(nextEpochId ?? 0n);

  const {
    expiredUnclaimed,
    totalExpiredUnclaimed,
    isLoading: expiredLoading,
    refetch: refetchExpired,
  } = useExpiredUnclaimedRewards(isVaultOwner, nextEpochId, claimExpiryPeriod);

  const depositOnlyCarryForward =
    (carryForward ?? 0n) > 0n && finalizedEpochCount === 0;

  const now = Math.floor(Date.now() / 1000);
  const canFinalize =
    depositAmount > 0n &&
    (lastFinalizeTime === 0n || lastFinalizeTime === undefined || Number(nextEligible ?? 0) <= now);

  const needsApprove = useMemo(() => {
    if (!vaultAllowance || depositAmount === 0n) return depositAmount > 0n;
    return (vaultAllowance as bigint) < depositAmount;
  }, [vaultAllowance, depositAmount]);

  const parseOwnerAddress = (value: string): Address | null => {
    const trimmed = value.trim();
    if (!isAddress(trimmed) || trimmed.toLowerCase() === zeroAddress) return null;
    return trimmed;
  };

  const nftTransferTarget = useMemo(() => parseOwnerAddress(nftNewOwner), [nftNewOwner]);
  const vaultTransferTarget = useMemo(
    () => parseOwnerAddress(vaultNewOwner),
    [vaultNewOwner]
  );

  const { writeContractAsync, isPending } = useWriteContract();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: confirming, isSuccess: txSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (!txSuccess) return;
    refetchNftBalance();
    refetchVault();
    refetchOwnerBalance();
    refetchAllowance();
    refetchOwners();
    refetchTokenUri();
    refetchSupplyStats();
    refetchExpired();
    setPendingAction(null);
    setTxHash(undefined);
  }, [
    txSuccess,
    refetchNftBalance,
    refetchVault,
    refetchOwnerBalance,
    refetchAllowance,
    refetchOwners,
    refetchTokenUri,
    refetchSupplyStats,
    refetchExpired,
  ]);

  const onSetBaseURI = useCallback(async () => {
    if (!isNftOwner || !baseUriInput.trim()) return;
    setPendingAction("setBaseURI");
    const hash = await writeContractAsync({
      address: NFT_ADDRESS,
      abi: CryptoSharksNFTAbi,
      functionName: "setBaseURI",
      args: [baseUriInput.trim()],
    });
    setTxHash(hash);
  }, [isNftOwner, baseUriInput, writeContractAsync]);

  const onLockBaseURI = useCallback(async () => {
    if (!isNftOwner) return;
    setPendingAction("lockBaseURI");
    const hash = await writeContractAsync({
      address: NFT_ADDRESS,
      abi: CryptoSharksNFTAbi,
      functionName: "lockBaseURI",
    });
    setTxHash(hash);
  }, [isNftOwner, writeContractAsync]);

  const onWithdraw = useCallback(async () => {
    if (!isNftOwner) return;
    setPendingAction("withdraw");
    const hash = await writeContractAsync({
      address: NFT_ADDRESS,
      abi: CryptoSharksNFTAbi,
      functionName: "withdrawUSDC",
    });
    setTxHash(hash);
  }, [isNftOwner, writeContractAsync]);

  const onApprove = useCallback(async () => {
    if (!isVaultOwner) return;
    setPendingAction("approve");
    const hash = await writeContractAsync({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: "approve",
      args: [VAULT_ADDRESS, depositAmount],
    });
    setTxHash(hash);
  }, [isVaultOwner, depositAmount, writeContractAsync]);

  const onFinalize = useCallback(async () => {
    if (!isVaultOwner || !address) return;
    setPendingAction("finalize");

    let gas = FINALIZE_EPOCH_GAS_FALLBACK;
    if (publicClient) {
      try {
        const estimated = await publicClient.estimateContractGas({
          account: address,
          address: VAULT_ADDRESS,
          abi: CryptoSharksStakingVaultAbi,
          functionName: "finalizeEpoch",
          args: [depositAmount],
        });
        gas = estimated + estimated / 5n;
      } catch {
        // RPC may reject heavy estimate; fallback gas still works on most nodes
      }
    }

    const hash = await writeContractAsync({
      address: VAULT_ADDRESS,
      abi: CryptoSharksStakingVaultAbi,
      functionName: "finalizeEpoch",
      args: [depositAmount],
      gas,
    });
    setTxHash(hash);
  }, [isVaultOwner, address, depositAmount, publicClient, writeContractAsync]);

  const reclaimEpoch = useMemo(() => {
    const parsed = reclaimEpochId.trim();
    if (!/^\d+$/.test(parsed)) return null;
    return BigInt(parsed);
  }, [reclaimEpochId]);

  const reclaimToken = useMemo(() => {
    const parsed = reclaimTokenId.trim();
    if (!/^\d+$/.test(parsed)) return null;
    const id = BigInt(parsed);
    if (id < 1n || id > BigInt(MAX_SUPPLY)) return null;
    return id;
  }, [reclaimTokenId]);

  const onReclaimExpired = useCallback(async () => {
    if (!isVaultOwner || reclaimEpoch === null || reclaimToken === null) return;
    setPendingAction("reclaim");
    const hash = await writeContractAsync({
      address: VAULT_ADDRESS,
      abi: CryptoSharksStakingVaultAbi,
      functionName: "reclaimExpiredReward",
      args: [reclaimEpoch, reclaimToken],
    });
    setTxHash(hash);
  }, [isVaultOwner, reclaimEpoch, reclaimToken, writeContractAsync]);

  const onSelectExpiredReward = useCallback((epochId: bigint, tokenId: bigint) => {
    setReclaimEpochId(epochId.toString());
    setReclaimTokenId(tokenId.toString());
  }, []);

  const onTransferNftOwnership = useCallback(async () => {
    if (!isNftOwner || !nftTransferTarget) return;
    setPendingAction("transferNftOwner");
    const hash = await writeContractAsync({
      address: NFT_ADDRESS,
      abi: CryptoSharksNFTAbi,
      functionName: "transferOwnership",
      args: [nftTransferTarget],
    });
    setTxHash(hash);
  }, [isNftOwner, nftTransferTarget, writeContractAsync]);

  const onTransferVaultOwnership = useCallback(async () => {
    if (!isVaultOwner || !vaultTransferTarget) return;
    setPendingAction("transferVaultOwner");
    const hash = await writeContractAsync({
      address: VAULT_ADDRESS,
      abi: CryptoSharksStakingVaultAbi,
      functionName: "transferOwnership",
      args: [vaultTransferTarget],
    });
    setTxHash(hash);
  }, [isVaultOwner, vaultTransferTarget, writeContractAsync]);

  const busy = isPending || confirming;

  if (!isConnected) {
    return (
      <Card className="max-w-lg mx-auto text-center">
        <Shield className="h-10 w-10 mx-auto text-cyan-300" />
        <CardTitle className="mt-4">Contract admin</CardTitle>
        <CardSubtitle className="mb-6">
          Connect the owner wallet to access admin controls.
        </CardSubtitle>
        <Button size="lg" onClick={openConnectModal}>
          Connect Wallet
        </Button>
      </Card>
    );
  }

  if (ownerLoading) {
    return (
      <Card className="max-w-lg mx-auto text-center py-12">
        <Loader2 className="h-8 w-8 mx-auto animate-spin text-cyan-300" />
        <p className="mt-4 text-cyan-100/60">Verifying contract ownership…</p>
      </Card>
    );
  }

  if (!isAnyOwner) {
    return (
      <Card className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="h-8 w-8 text-rose-300" />
          <div>
            <CardTitle>Access denied</CardTitle>
            <CardSubtitle>
              Only the NFT or vault contract owner can use admin controls.
            </CardSubtitle>
          </div>
        </div>
        <dl className="text-sm space-y-2 text-cyan-100/70">
          <div className="flex justify-between gap-4">
            <dt>Your wallet</dt>
            <dd className="font-mono text-cyan-200">{shortAddress(address)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>NFT owner</dt>
            <dd className="font-mono text-cyan-200">{shortAddress(nftOwner)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Vault owner</dt>
            <dd className="font-mono text-cyan-200">{shortAddress(vaultOwner)}</dd>
          </div>
        </dl>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            {isNftOwner && (
              <Badge tone="cyan">
                <Shield className="h-3 w-3" />
                NFT owner
              </Badge>
            )}
            {isVaultOwner && (
              <Badge tone="teal">
                <Shield className="h-3 w-3" />
                Vault owner
              </Badge>
            )}
          </div>
          <h1 className="font-display text-4xl tracking-tight text-cyan-100">
            Admin Console
          </h1>
          <p className="text-cyan-100/60 mt-2 max-w-2xl">
            Owner-only actions on the NFT and staking vault contracts. Each section
            requires ownership of that specific contract.
          </p>
        </div>
        <ConnectWalletButton />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat
          label="Total Minted"
          icon={<Anchor className="h-4 w-4" />}
          value={isLoadingSupply ? "…" : supplyMinted}
          hint={`${supplyMinted.toLocaleString()} / ${MAX_SUPPLY.toLocaleString()} supply`}
        />
        <Stat
          label="Staked NFTs"
          icon={<Lock className="h-4 w-4" />}
          value={isLoadingStakeSplit ? "…" : stakedSharks}
          hint="Locked in the staking vault"
        />
        <Stat
          label="Unstaked NFTs"
          icon={<Wallet className="h-4 w-4" />}
          value={isLoadingStakeSplit ? "…" : unstakedSharks}
          hint="Held in wallets outside the vault"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="relative overflow-hidden">
          {!isNftOwner && (
            <OwnerOnlyOverlay message="Connect the NFT contract owner wallet to withdraw mint revenue." />
          )}
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-cyan-300" />
                Withdraw mint USDC
              </CardTitle>
              {/* <CardSubtitle>
                Calls <code className="text-cyan-200">withdrawUSDC()</code> on the NFT
                contract. Sends all USDC held by the NFT contract to the owner wallet.
              </CardSubtitle> */}
            </div>
          </CardHeader>
          <div className="rounded-xl bg-navy-800/60 border border-cyan-400/10 p-4 mb-4">
            <div className="text-xs uppercase tracking-widest text-cyan-100/50">
              NFT contract balance
            </div>
            <div className="font-display text-2xl text-cyan-200 mt-1">
              ${formatUsdc(nftUsdcBalance as bigint | undefined)} USDC
            </div>
          </div>
          <Button
            className="w-full"
            onClick={onWithdraw}
            disabled={
              !isNftOwner || busy || (nftUsdcBalance as bigint | undefined) === 0n
            }
          >
            {pendingAction === "withdraw" && busy && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {pendingAction === "withdraw" && confirming
              ? "Withdrawing…"
              : "Withdraw USDC from NFT"}
          </Button>
        </Card>

        <Card className="relative overflow-hidden">
          {!isVaultOwner && (
            <OwnerOnlyOverlay message="Connect the vault contract owner wallet to settle reward periods." />
          )}
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-cyan-300" />
                {SETTLE_PERIOD_ACTION}
              </CardTitle>
              {/* <CardSubtitle>
                Deposits USDC and snapshots sharks that have completed the{" "}
                {formatStakeLockPeriod(stakeLockPeriod)} stake lock. If zero sharks
                qualify, USDC is carried forward and the settled period count does not increase.
              </CardSubtitle> */}
            </div>
          </CardHeader>

          {depositOnlyCarryForward && (
            <div className="mb-4 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100/90">
              USDC was deposited but <strong>no sharks were qualified</strong> at snapshot,
              so the settled period count is still 0 and stakers cannot claim yet. Wait until sharks
              finish the stake lock ({qualifiedSharksNow} of {mintedSharks} qualified now),
              then settle again.
            </div>
          )}

          <dl className="text-sm grid grid-cols-2 gap-3 mb-4 text-cyan-100/70">
            <div>
              <dt className="text-xs uppercase tracking-widest text-cyan-100/50">
                {SETTLED_PERIODS_LABEL}
              </dt>
              <dd className="font-display text-cyan-100 mt-0.5">
                {settledPeriodsStatLine(finalizedEpochCount)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-cyan-100/50">
                Qualified sharks now
              </dt>
              <dd className="font-display text-cyan-100 mt-0.5">
                {qualifiedSharksNow}
                {mintedSharks > 0 ? ` / ${mintedSharks} minted` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-cyan-100/50">
                Carry forward pool
              </dt>
              <dd className="font-display text-cyan-100 mt-0.5">
                ${formatUsdc(carryForward)} USDC
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-cyan-100/50">
                {NEXT_SETTLEMENT_LABEL}
              </dt>
              <dd className="font-mono text-cyan-200 mt-0.5 text-xs">
                {lastFinalizeTime === 0n || lastFinalizeTime === undefined
                  ? "Now"
                  : canFinalize
                    ? "Now"
                    : nextEligible
                      ? new Date(Number(nextEligible) * 1000).toLocaleString()
                      : "—"}
              </dd>
            </div>
          </dl>

          <label className="block text-sm text-cyan-100/70 mb-2">
            USDC deposit amount
          </label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={epochDeposit}
            onChange={(e) => setEpochDeposit(e.target.value)}
            disabled={!isVaultOwner}
            className="w-full h-10 px-3 mb-2 bg-navy-700/60 border border-cyan-400/20 rounded-lg text-cyan-100 outline-none focus:ring-2 focus:ring-cyan-400/40 disabled:opacity-50"
          />
          <p className="text-xs text-cyan-100/50 mb-4">
            Your wallet: ${formatUsdc(ownerUsdcBalance as bigint | undefined)} USDC
            {needsApprove && depositAmount > 0n ? " · approval required before settlement" : ""}
          </p>

          <div className="flex flex-col gap-2">
            {needsApprove && depositAmount > 0n && (
              <Button
                variant="outline"
                onClick={onApprove}
                disabled={!isVaultOwner || busy || !canFinalize}
              >
                {pendingAction === "approve" && busy && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Approve USDC for vault
              </Button>
            )}
            <Button
              onClick={onFinalize}
              disabled={!isVaultOwner || busy || !canFinalize || depositAmount === 0n}
            >
              {pendingAction === "finalize" && busy && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {pendingAction === "finalize" && confirming ? SETTLING_ACTION : SETTLE_PERIOD_ACTION}
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-cyan-400/10">
            <h3 className="text-sm font-medium text-cyan-100 mb-1">Reclaim expired rewards</h3>
            <p className="text-xs text-cyan-100/50 mb-4 leading-relaxed">
              If a qualified shark does not claim within{" "}
              {formatStakeLockPeriod(claimExpiryPeriod)} of settlement, recover its USDC share to
              the vault owner wallet.
            </p>

            <div className="rounded-xl bg-navy-800/60 border border-cyan-400/10 p-4 mb-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="text-xs uppercase tracking-widest text-cyan-100/50">
                  Expired & unclaimed
                </span>
                {expiredLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
                ) : (
                  <span className="text-xs text-cyan-100/60">
                    {expiredUnclaimed.length} slot{expiredUnclaimed.length === 1 ? "" : "s"} · $
                    {formatUsdc(totalExpiredUnclaimed)} USDC
                  </span>
                )}
              </div>

              {expiredLoading ? (
                <p className="text-xs text-cyan-100/50">Scanning settled periods…</p>
              ) : expiredUnclaimed.length === 0 ? (
                <p className="text-xs text-cyan-100/50">
                  No expired unclaimed rewards found across {finalizedEpochCount} settled period
                  {finalizedEpochCount === 1 ? "" : "s"}.
                </p>
              ) : (
                <ul className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {expiredUnclaimed.map(({ epochId, tokenId, amount, expiredAt }) => (
                    <li key={`${epochId}-${tokenId}`}>
                      <button
                        type="button"
                        onClick={() => onSelectExpiredReward(epochId, tokenId)}
                        disabled={!isVaultOwner}
                        className={cn(
                          "w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition",
                          "hover:bg-cyan-400/10 disabled:opacity-50 disabled:pointer-events-none",
                          reclaimEpoch === epochId && reclaimToken === tokenId
                            ? "bg-cyan-400/15 ring-1 ring-cyan-400/30"
                            : "bg-navy-900/40"
                        )}
                      >
                        <span className="text-cyan-100 min-w-0">
                          <span className="block">
                            Shark #{tokenId.toString()}
                            <span className="text-cyan-100/50 mx-1.5">·</span>
                            Period #{epochId.toString()}
                          </span>
                          <span className="block text-[10px] text-cyan-100/45 mt-0.5">
                            Expired {new Date(expiredAt * 1000).toLocaleDateString()}
                          </span>
                        </span>
                        <span className="shrink-0 font-mono text-cyan-200">
                          ${formatUsdc(amount)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs text-cyan-100/60 mb-1">Reward period #</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={reclaimEpochId}
                  onChange={(e) => setReclaimEpochId(e.target.value)}
                  disabled={!isVaultOwner}
                  className="w-full h-10 px-3 bg-navy-700/60 border border-cyan-400/20 rounded-lg text-cyan-100 outline-none focus:ring-2 focus:ring-cyan-400/40 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs text-cyan-100/60 mb-1">Shark token ID</label>
                <input
                  type="number"
                  min={1}
                  max={MAX_SUPPLY}
                  step={1}
                  value={reclaimTokenId}
                  onChange={(e) => setReclaimTokenId(e.target.value)}
                  disabled={!isVaultOwner}
                  className="w-full h-10 px-3 bg-navy-700/60 border border-cyan-400/20 rounded-lg text-cyan-100 outline-none focus:ring-2 focus:ring-cyan-400/40 disabled:opacity-50"
                />
              </div>
            </div> */}
            <Button
              variant="outline"
              className="w-full"
              onClick={onReclaimExpired}
              disabled={!isVaultOwner || busy || reclaimEpoch === null || reclaimToken === null}
            >
              {pendingAction === "reclaim" && busy && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {pendingAction === "reclaim" && confirming
                ? "Reclaiming…"
                : "Reclaim expired reward"}
            </Button>
          </div>
        </Card>
      </div>

      <Card className="relative overflow-hidden">
        {!isNftOwner && (
          <OwnerOnlyOverlay message="Connect the NFT contract owner wallet to manage metadata." />
        )}
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-cyan-300" />
              NFT metadata (images)
            </CardTitle>
            <CardSubtitle>
              Wallets and OpenSea load <code className="text-cyan-200">tokenURI</code> → JSON
              metadata → <code className="text-cyan-200">image</code>. Set{" "}
              <code className="text-cyan-200">baseURI</code> once so each token resolves to{" "}
              <code className="text-cyan-200">{"{baseURI}{tokenId}"}</code>.
            </CardSubtitle>
          </div>
          {/* {baseUriLocked ? (
            <Badge tone="amber">Base URI locked</Badge>
          ) : (
            <Badge tone="teal">Base URI editable</Badge>
          )} */}
        </CardHeader>

        <div className="rounded-xl bg-navy-800/60 border border-cyan-400/10 p-4 mb-4 space-y-2 text-sm">
          <div>
            <span className="text-cyan-100/50 text-xs uppercase tracking-widest">
              Sample tokenURI (#1)
            </span>
            <p className="font-mono text-xs text-cyan-200 mt-1 break-all">
              {(sampleTokenURI as string | undefined) ||
                "— (mint token #1 first, or base URI not set)"}
            </p>
          </div>
          <p className="text-cyan-100/60 text-xs leading-relaxed">
            Suggested for this site (must be publicly reachable, not localhost, for MetaMask /
            OpenSea): use your deployed URL +{" "}
            <code className="text-cyan-200">/api/metadata/</code> — e.g.{" "}
            <code className="text-cyan-200 break-all">
              {baseUriInput || "https://your-domain.com/api/metadata/"}
            </code>
          </p>
        </div>

        <label className="block text-sm text-cyan-100/70 mb-2">
          baseURI (trailing slash required)
        </label>
        <input
          type="url"
          value={baseUriInput}
          onChange={(e) => setBaseUriInput(e.target.value)}
          disabled={!isNftOwner || !!baseUriLocked}
          placeholder="https://your-domain.com/api/metadata/"
          className="w-full h-10 px-3 mb-4 bg-navy-700/60 border border-cyan-400/20 rounded-lg text-cyan-100 text-sm outline-none focus:ring-2 focus:ring-cyan-400/40 disabled:opacity-50"
        />

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={onSetBaseURI}
            disabled={!isNftOwner || busy || !!baseUriLocked || !baseUriInput.trim()}
          >
            {pendingAction === "setBaseURI" && busy && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {pendingAction === "setBaseURI" && confirming ? "Setting…" : "Set base URI"}
          </Button>
          <Button
            variant="outline"
            onClick={onLockBaseURI}
            disabled={!isNftOwner || busy || !!baseUriLocked}
          >
            {pendingAction === "lockBaseURI" && busy && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Lock base URI permanently
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="relative overflow-hidden">
          {!isNftOwner && (
            <OwnerOnlyOverlay message="Connect the NFT contract owner wallet to transfer ownership." />
          )}
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-cyan-300" />
                Transfer NFT ownership
              </CardTitle>
              <CardSubtitle>
                Current owner:{" "}
                <span className="font-mono text-cyan-200">{shortAddress(nftOwner)}</span>
              </CardSubtitle>
            </div>
          </CardHeader>
          <label className="block text-sm text-cyan-100/70 mb-2">New owner address</label>
          <input
            type="text"
            value={nftNewOwner}
            onChange={(e) => setNftNewOwner(e.target.value)}
            disabled={!isNftOwner}
            placeholder="0x…"
            spellCheck={false}
            className={cn(
              "w-full h-10 px-3 mb-2 font-mono text-sm bg-navy-700/60 border rounded-lg text-cyan-100 outline-none focus:ring-2 disabled:opacity-50",
              nftNewOwner && !nftTransferTarget
                ? "border-rose-400/40 focus:ring-rose-400/30"
                : "border-cyan-400/20 focus:ring-cyan-400/40"
            )}
          />
          {nftNewOwner && !nftTransferTarget && (
            <p className="text-xs text-rose-300/90 mb-3">Enter a valid non-zero address.</p>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={onTransferNftOwnership}
            disabled={!isNftOwner || busy || !nftTransferTarget}
          >
            {pendingAction === "transferNftOwner" && busy && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {pendingAction === "transferNftOwner" && confirming
              ? "Transferring…"
              : "Transfer NFT ownership"}
          </Button>
        </Card>

        <Card className="relative overflow-hidden">
          {!isVaultOwner && (
            <OwnerOnlyOverlay message="Connect the vault contract owner wallet to transfer ownership." />
          )}
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-cyan-300" />
                Transfer vault ownership
              </CardTitle>
              <CardSubtitle>
                Current owner:{" "}
                <span className="font-mono text-cyan-200">{shortAddress(vaultOwner)}</span>
              </CardSubtitle>
            </div>
          </CardHeader>
          <label className="block text-sm text-cyan-100/70 mb-2">New owner address</label>
          <input
            type="text"
            value={vaultNewOwner}
            onChange={(e) => setVaultNewOwner(e.target.value)}
            disabled={!isVaultOwner}
            placeholder="0x…"
            spellCheck={false}
            className={cn(
              "w-full h-10 px-3 mb-2 font-mono text-sm bg-navy-700/60 border rounded-lg text-cyan-100 outline-none focus:ring-2 disabled:opacity-50",
              vaultNewOwner && !vaultTransferTarget
                ? "border-rose-400/40 focus:ring-rose-400/30"
                : "border-cyan-400/20 focus:ring-cyan-400/40"
            )}
          />
          {vaultNewOwner && !vaultTransferTarget && (
            <p className="text-xs text-rose-300/90 mb-3">Enter a valid non-zero address.</p>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={onTransferVaultOwnership}
            disabled={!isVaultOwner || busy || !vaultTransferTarget}
          >
            {pendingAction === "transferVaultOwner" && busy && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {pendingAction === "transferVaultOwner" && confirming
              ? "Transferring…"
              : "Transfer vault ownership"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
