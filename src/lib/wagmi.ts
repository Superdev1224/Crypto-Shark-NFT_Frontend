import { createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";
import { http } from "viem";
import { CHAIN_ID } from "./contracts";

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;
const customRpc = process.env.NEXT_PUBLIC_RPC_URL;

const supportedChains = [sepolia, mainnet] as const;
const activeChain = supportedChains.find((c) => c.id === CHAIN_ID) ?? sepolia;

// Put the active chain first so wagmi defaults to it on first connect.
const orderedChains = [
  activeChain,
  ...supportedChains.filter((c) => c.id !== activeChain.id),
] as unknown as readonly [typeof sepolia, typeof mainnet];

// WalletConnect is opt-in: enabled only if a project ID is provided.
// All other connectors (browser wallets via EIP-6963, MetaMask, Coinbase) work
// without any external service registration.
const connectors = [
  injected({ shimDisconnect: true }),
  coinbaseWallet({ appName: "Crypto Sharks", preference: "all" }),
  ...(projectId
    ? [
        walletConnect({
          projectId,
          showQrModal: true,
          metadata: {
            name: "Crypto Sharks",
            description: "NFT staking & USDC dividends on Crypto Sharks.",
            url: typeof window !== "undefined" ? window.location.origin : "https://crypto-sharks.app",
            icons: ["/logo.png"],
          },
        }),
      ]
    : []),
];

export const wagmiConfig = createConfig({
  chains: orderedChains,
  connectors,
  transports: {
    [sepolia.id]: customRpc && CHAIN_ID === sepolia.id ? http(customRpc) : http(),
    [mainnet.id]: customRpc && CHAIN_ID === mainnet.id ? http(customRpc) : http(),
  },
  ssr: true,
});
