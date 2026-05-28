import { createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";
import { fallback, http } from "viem";
import { CHAIN_ID } from "./contracts";

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;
const customRpc = process.env.NEXT_PUBLIC_RPC_URL?.trim();

/** Public Sepolia RPCs (no low gas caps like some Pocket endpoints). */
const SEPOLIA_PUBLIC_RPC = "https://ethereum-sepolia-rpc.publicnode.com";
const SEPOLIA_PUBLIC_RPC_ALT = "https://rpc.sepolia.org";

const sepoliaTransport = () => {
  const urls = [SEPOLIA_PUBLIC_RPC, SEPOLIA_PUBLIC_RPC_ALT];
  if (customRpc) urls.push(customRpc);
  return fallback(urls.map((url) => http(url)));
};

const supportedChains = [sepolia, mainnet] as const;
const activeChain = supportedChains.find((c) => c.id === CHAIN_ID) ?? sepolia;

const orderedChains = [
  activeChain,
  ...supportedChains.filter((c) => c.id !== activeChain.id),
] as unknown as readonly [typeof sepolia, typeof mainnet];

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
          url:
            typeof window !== "undefined"
              ? window.location.origin
              : "https://crypto-sharks.app",
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
    [sepolia.id]: sepoliaTransport(),
    [mainnet.id]: customRpc ? http(customRpc) : http(),
  },
  ssr: true,
});
