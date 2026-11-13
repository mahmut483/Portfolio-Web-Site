import type { MetadataRoute } from "next";

const BASE_URL = "https://mahmut-karaarslan.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/cv",
    "/contact",
    "/development",
    "/character-animations",
    "/playable-ad",
    "/marketing-videos",
  ];

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8,
  }));
}
