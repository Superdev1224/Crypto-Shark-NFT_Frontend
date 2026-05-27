"use client";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi";
import { WalletModalProvider } from "@/components/WalletModal";
import { useState, type PropsWithChildren } from "react";

export function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
