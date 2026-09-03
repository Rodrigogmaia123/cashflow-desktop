/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.DESKTOP_MODE === "true" ? "standalone" : undefined,
  distDir: process.env.DESKTOP_MODE === "true" ? ".next-desktop" : ".next",
  serverExternalPackages: ["@prisma/client", "prisma"],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
    unoptimized: true,
    qualities: [75, 90],
  },
};

export default nextConfig;
