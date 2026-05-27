# Crypto Sharks — Frontend

Next.js 14 + TypeScript dashboard for the **Crypto Sharks** Web3 × IRL ecosystem. Mint NFTs, stake them, track 90-day countdowns, claim USDC dividends, and monitor the live IRL kiosk network.

## Stack

| Layer | Tech |
|---|---|
| Framework | [Next.js 14](https://nextjs.org) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS (custom brand palette) + Orbitron / Inter typography |
| Web3 | [wagmi v2](https://wagmi.sh) + [viem](https://viem.sh) (custom wallet modal) |
| State | `@tanstack/react-query` |
| Icons | `lucide-react` |

## Brand palette

| Token | Hex | Use |
|---|---|---|
| `navy.600` | `#102635` | Primary background |
| `teal.500` | `#2F7C7E` | Secondary surfaces, accents |
| `cyan.400` | `#39D7E8` | Calls to action, neon glow, links |

These are extended in `tailwind.config.ts` with full 50-900 scales.

## Pages

| Route | Purpose |
|---|---|
| `/` | Hero, live pool stats, "how it works", value props |
| `/mint` | Tier display + USDC approve & mint flow |
| `/stake` | Dashboard: owned/staked sharks, 90-day countdowns, "Accumulating" / "Qualified" badges, one-click claim & unstake |
| `/kiosks` | IRL kiosk operational telemetry (live mock at `/api/kiosks`) |
| `/api/kiosks` | Mock JSON feed — swap for your real operations backend |

## Setup

```bash
cp .env.example .env.local
# (optional) set NEXT_PUBLIC_WC_PROJECT_ID from https://cloud.walletconnect.com
# only needed if you want the WalletConnect (mobile-QR) connector
npm install
npm run dev
# open http://localhost:3000
```

## Environment variables

| Var | Required | Default |
|---|---|---|
| `NEXT_PUBLIC_WC_PROJECT_ID` | no (only for WalletConnect mobile-QR pairing) | — |
| `NEXT_PUBLIC_CHAIN_ID` | no | `11155111` (Sepolia) |
| `NEXT_PUBLIC_NFT_ADDRESS` | yes | `0x5e9405099000eb1C49E50F22204cBd59c60AA02a` |
| `NEXT_PUBLIC_VAULT_ADDRESS` | yes | `0xD9D404F70A2bF4A881969c0591bd082A0bf149Cb` |
| `NEXT_PUBLIC_USDC_ADDRESS` | yes | `0xBF8821AEd892B8D693f2C0B1921810A99EAF5193` |
| `NEXT_PUBLIC_RPC_URL` | no | Falls back to public viem RPC |
| `NEXT_PUBLIC_SITE_URL` | no | `http://localhost:3000` (used for OG metadata base) |

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Run the built app |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | Next.js ESLint |

## Project layout

```
frontend/
├── public/
│   ├── logo.png         # Provided Crypto Sharks emblem
│   ├── hero-bg.png      # Generated underwater bathymetric background
│   ├── og-image.png     # Generated 1200x630 social card
│   └── empty-state.png  # Decorative shark-fin sonar illustration
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout, fonts, providers, metadata
│   │   ├── page.tsx           # Landing
│   │   ├── globals.css        # Tailwind + brand styles
│   │   ├── providers.tsx      # Wagmi + WalletModal + React Query
│   │   ├── mint/page.tsx
│   │   ├── stake/page.tsx
│   │   ├── kiosks/page.tsx
│   │   └── api/kiosks/route.ts
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── Background.tsx     # Animated layered glow + hero image
│   │   ├── PoolStats.tsx      # On-chain pool / epoch metrics
│   │   ├── MintCard.tsx       # USDC approve + mint flow
│   │   ├── StakeDashboard.tsx # Owned/staked scan + sections
│   │   ├── OwnedTokenCard.tsx # Approve vault + stake
│   │   ├── StakedTokenCard.tsx # Countdown, badges, unstake, claim
│   │   ├── CountdownTimer.tsx # Live ticking countdown
│   │   ├── KioskStatusGrid.tsx
│   │   ├── WalletModal.tsx       # Custom wagmi connect modal + context
│   │   ├── ConnectWalletButton.tsx # Header pill (connect / address / switch chain)
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Badge.tsx
│   │       └── Stat.tsx
│   └── lib/
│       ├── abis/
│       │   ├── CryptoSharksNFT.ts
│       │   ├── CryptoSharksStakingVault.ts
│       │   └── erc20.ts
│       ├── contracts.ts       # Addresses, tier prices, max supply
│       ├── format.ts          # USDC + countdown helpers
│       ├── utils.ts           # cn() tailwind merger
│       └── wagmi.ts           # wagmi connectors + transports
├── tailwind.config.ts
├── next.config.mjs
└── tsconfig.json
```

## Notes

- **Staking dashboard scan**: iterates `1..totalSupply()` and calls `ownerOf` + `stakes(tokenId)` for each. Acceptable for the 1,000-token cap; for collections of 10k+ you'd want a Subgraph or `tokensOfOwner` extension.
- **Claim flow**: `StakedTokenCard` discovers unclaimed finalized epochs by reading `qualified[epoch][tokenId]` × `claimed[epoch][tokenId]` × `epochs[epoch]` for each prior epoch. "Claim All" sends one transaction per epoch sequentially — fine for the expected 1–4 epochs/year cadence.
- **IRL kiosk feed**: `app/api/kiosks/route.ts` produces deterministic mock data per minute. Replace with your real ops endpoint (kiosk telemetry, daily revenue). The page polls every 30s.
- **Wallet UX**: the custom modal in `WalletModal.tsx` lists every wagmi connector (browser wallets via EIP-6963, Coinbase Wallet, and optionally WalletConnect when `NEXT_PUBLIC_WC_PROJECT_ID` is set). No third-party UI library required.
- **Wrong-network handling**: `ConnectWalletButton.tsx` shows a "Switch Network" CTA when the connected chain ≠ `NEXT_PUBLIC_CHAIN_ID` and calls `useSwitchChain` on click.

## Deployment

Anywhere Next.js 14 runs (Vercel, Cloudflare Pages, self-hosted). Set the env vars in your provider. The `/api/kiosks` route is server-rendered (`dynamic = "force-dynamic"`) so a serverless platform is preferred.
