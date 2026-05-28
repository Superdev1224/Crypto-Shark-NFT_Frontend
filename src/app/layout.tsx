import type { Metadata } from "next";
import { Bebas_Neue, Inter, Orbitron } from "next/font/google";
import { SloganBanner } from "@/components/SloganBanner";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Background } from "@/components/Background";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-slogan",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Crypto Sharks — Web3 × IRL Yield",
  description:
    "1,000 utility NFTs anchored to real-world operating revenue. Stake your shark for 90 days and receive a pro-rata USDC share of every epoch.",
  openGraph: {
    title: "Crypto Sharks — Web3 × IRL Yield",
    description:
      "1,000 utility NFTs anchored to real-world operating revenue. Stake your shark for 90 days and receive a pro-rata USDC share of every epoch.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable} ${bebasNeue.variable}`}>
      <body className="relative min-h-screen text-cyan-50">
        <Background />
        <div className="relative z-10 flex min-h-screen flex-col">
          <Providers>
            <Navbar />
            <SloganBanner />
            <main className="flex-1">{children}</main>
            <Footer />
          </Providers>
        </div>
      </body>
    </html>
  );
}
