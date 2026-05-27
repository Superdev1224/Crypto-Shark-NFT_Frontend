/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { webpack }) => {
    // wagmi / WalletConnect optional deps not used in the browser
    config.externals.push("pino-pretty", "lokijs", "encoding");
    // MetaMask SDK pulls a React-Native-only package we don't need on the web
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@react-native-async-storage\/async-storage$/,
      })
    );
    return config;
  },
};

export default nextConfig;
