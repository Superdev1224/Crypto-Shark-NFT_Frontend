import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const siteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001").replace(/\/$/, "");

/** ERC-721 metadata for token `tokenId` (served at /api/metadata/{id}). */
export async function GET(
  _request: Request,
  { params }: { params: { tokenId: string } }
) {
  const { tokenId } = params;
  if (!/^\d+$/.test(tokenId) || Number(tokenId) < 1) {
    return NextResponse.json({ error: "Invalid token id" }, { status: 400 });
  }

  const base = siteUrl();

  return NextResponse.json({
    name: `Crypto Shark #${tokenId}`,
    description:
      "Crypto Sharks utility NFT — stake for 90 days to qualify for pro-rata USDC dividends from real-world lottery-kiosk revenue.",
    image: `${base}/og-image.png`,
    external_url: `${base}/stake`,
  });
}
