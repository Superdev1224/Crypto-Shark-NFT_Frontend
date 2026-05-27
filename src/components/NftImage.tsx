"use client";

import { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import { AnchorIcon, Loader2 } from "lucide-react";
import { CryptoSharksNFTAbi } from "@/lib/abis/CryptoSharksNFT";
import { NFT_ADDRESS } from "@/lib/contracts";
import { resolveNftImageUrl } from "@/lib/nft-metadata";
import { cn } from "@/lib/utils";

type Props = {
  tokenId: bigint;
  className?: string;
  iconClassName?: string;
};

export function NftImage({ tokenId, className, iconClassName }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  const { data: tokenURI } = useReadContract({
    address: NFT_ADDRESS,
    abi: CryptoSharksNFTAbi,
    functionName: "tokenURI",
    args: [tokenId],
  });

  useEffect(() => {
    setLoading(true);
    setFailed(false);
    setImageUrl(null);

    const uri = tokenURI as string | undefined;
    if (!uri) {
      setLoading(false);
      setFailed(true);
      return;
    }

    resolveNftImageUrl(uri)
      .then((url) => {
        if (url) setImageUrl(url);
        else setFailed(true);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [tokenURI]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-cyan-400/10 ring-1 ring-cyan-400/25 shrink-0",
        className ?? "h-16 w-16"
      )}
    >
      {loading && (
        <div className="absolute inset-0 grid place-items-center">
          <Loader2 className={cn("animate-spin text-cyan-300/70", iconClassName ?? "h-5 w-5")} />
        </div>
      )}
      {!loading && imageUrl && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      )}
      {!loading && (failed || !imageUrl) && (
        <div className="absolute inset-0 grid place-items-center">
          <AnchorIcon className={cn("text-cyan-300/80", iconClassName ?? "h-6 w-6")} />
        </div>
      )}
    </div>
  );
}
