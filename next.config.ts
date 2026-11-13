import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // AVIF first (smallest), WebP for browsers without AVIF support
    formats: ["image/avif", "image/webp"],
    // 90 keeps the small text on the CV image crisp
    qualities: [75, 90],
  },
  // The Unity WebGL build ships gzip files named .unityweb. Declaring the encoding lets the
  // browser unpack them natively; the loader's JS fallback covers hosts that drop the header.
  headers() {
    return [
      {
        // Videos, posters and game files rarely change: cache for a day, then revalidate in the
        // background. After replacing a file in place, visitors may see the old one for up to a day.
        source: "/media/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        source: "/media/match3/game/Build/:file(.+\\.unityweb)",
        headers: [{ key: "Content-Encoding", value: "gzip" }],
      },
      {
        source: "/media/match3/game/Build/:file(.+\\.wasm\\.unityweb)",
        headers: [{ key: "Content-Type", value: "application/wasm" }],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/match3", destination: "/development", permanent: true },
      { source: "/charanim", destination: "/character-animations", permanent: true },
      { source: "/playablead", destination: "/playable-ad", permanent: true },
      { source: "/reels", destination: "/marketing-videos", permanent: true },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
