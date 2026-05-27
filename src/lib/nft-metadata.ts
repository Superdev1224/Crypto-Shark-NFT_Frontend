/** Convert ipfs:// URIs to a public HTTP gateway for browsers and wallets. */
export function ipfsToHttp(uri: string): string {
  if (uri.startsWith("ipfs://ipfs/")) {
    return `https://ipfs.io/${uri.slice("ipfs://".length)}`;
  }
  if (uri.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${uri.slice(7)}`;
  }
  return uri;
}

export type NftMetadataJson = {
  name?: string;
  description?: string;
  image?: string;
  external_url?: string;
};

export async function fetchNftMetadata(tokenURI: string): Promise<NftMetadataJson | null> {
  if (!tokenURI || tokenURI.length === 0) return null;
  try {
    const res = await fetch(ipfsToHttp(tokenURI));
    if (!res.ok) return null;
    return (await res.json()) as NftMetadataJson;
  } catch {
    return null;
  }
}

export async function resolveNftImageUrl(tokenURI: string): Promise<string | null> {
  const meta = await fetchNftMetadata(tokenURI);
  if (!meta?.image || typeof meta.image !== "string") return null;
  return ipfsToHttp(meta.image);
}

export function buildMetadataApiBaseURI(origin: string): string {
  return `${origin.replace(/\/$/, "")}/api/metadata/`;
}
