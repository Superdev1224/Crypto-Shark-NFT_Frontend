import Link from "next/link";
import { NFT_ADDRESS, VAULT_ADDRESS, USDC_ADDRESS, CHAIN_ID } from "@/lib/contracts";
import { shortAddress } from "@/lib/format";

const explorerBase =
  CHAIN_ID === 1 ? "https://etherscan.io/address" : "https://sepolia.etherscan.io/address";

export function Footer() {
  return (
    <footer className="relative border-t border-cyan-400/10 bg-navy-900/40 backdrop-blur-sm mt-24">
      <div className="mx-auto max-w-7xl px-6 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <p className="font-display tracking-widest text-cyan-200">CRYPTO SHARKS</p>
          <p className="mt-2 text-sm text-cyan-100/60 leading-relaxed">
            Web3 × IRL utility ecosystem. 1,000 utility NFTs backed by real-world
            revenue, paying USDC dividends every 90 days.
          </p>
        </div>

        <div className="text-sm">
          <p className="font-display text-cyan-200 mb-2 tracking-wider">CONTRACTS</p>
          <ul className="space-y-1 text-cyan-100/70">
            <li className="flex justify-between gap-4">
              <span>NFT</span>
              <Link
                className="text-cyan-300 hover:text-cyan-200"
                href={`${explorerBase}/${NFT_ADDRESS}`}
                target="_blank"
              >
                {shortAddress(NFT_ADDRESS)}
              </Link>
            </li>
            <li className="flex justify-between gap-4">
              <span>Staking Vault</span>
              <Link
                className="text-cyan-300 hover:text-cyan-200"
                href={`${explorerBase}/${VAULT_ADDRESS}`}
                target="_blank"
              >
                {shortAddress(VAULT_ADDRESS)}
              </Link>
            </li>
            <li className="flex justify-between gap-4">
              <span>USDC</span>
              <Link
                className="text-cyan-300 hover:text-cyan-200"
                href={`${explorerBase}/${USDC_ADDRESS}`}
                target="_blank"
              >
                {shortAddress(USDC_ADDRESS)}
              </Link>
            </li>
          </ul>
        </div>

        <div className="text-sm">
          <p className="font-display text-cyan-200 mb-2 tracking-wider">RESOURCES</p>
          <ul className="space-y-1 text-cyan-100/70">
            <li><Link className="hover:text-cyan-200" href="/mint">Mint a Shark</Link></li>
            <li><Link className="hover:text-cyan-200" href="/stake">Stake & Claim</Link></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 pb-4 text-center">
        <p className="font-slogan uppercase tracking-[0.18em] text-xl md:text-2xl text-cyan-200/80 text-glow">
          We swim alone, but eat together
        </p>
      </div>
      <div className="text-center text-xs text-cyan-100/40 pb-6">
        © {new Date().getFullYear()} Crypto Sharks Investment & Development LLC
      </div>
    </footer>
  );
}
