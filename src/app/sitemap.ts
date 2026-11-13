import type { MetadataRoute } from "next";
import { absoluteUrl, site, updated, work } from "./lib/site";
import { videosFor } from "./lib/videos";

export default function sitemap(): MetadataRoute.Sitemap {
  const home = {
    url: site.url,
    lastModified: updated["/"],
    changeFrequency: "monthly" as const,
    priority: 1,
  };

  const workPages = work.map((w) => ({
    url: absoluteUrl(`/${w.slug}`),
    lastModified: updated[`/${w.slug}`],
    changeFrequency: "monthly" as const,
    priority: 0.8,
    images: [absoluteUrl(w.poster)],
    videos: videosFor(w.slug).map((v) => ({
      title: v.title,
      description: v.description,
      thumbnail_loc: absoluteUrl(v.poster),
      content_loc: absoluteUrl(v.src),
      publication_date: v.uploadDate,
    })),
  }));

  const other = (["/cv", "/contact"] as const).map((path) => ({
    url: absoluteUrl(path),
    lastModified: updated[path],
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // The PDF is indexable on its own, so recruiters searching the name can find it
  const cvPdf = {
    url: absoluteUrl(site.cv.pdf),
    lastModified: updated["/cv"],
    changeFrequency: "monthly" as const,
    priority: 0.5,
  };

  return [home, ...workPages, ...other, cvPdf];
}
