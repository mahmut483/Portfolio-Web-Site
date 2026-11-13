import type { Metadata } from "next";
import { absoluteUrl, getWork, site, type WorkSlug } from "./site";
import { videosFor } from "./videos";

// A page-level `openGraph` replaces the layout's object instead of merging with it,
// so every page builds the full set here.
export function pageMetadata({
  path,
  title,
  description,
}: {
  path: string;
  title?: string;
  description: string;
}): Metadata {
  const fullTitle = title ? `${title} · ${site.name}` : `${site.name} · ${site.role}`;
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      siteName: site.name,
      locale: "en_US",
      title: fullTitle,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}

const personId = `${site.url}/#person`;

export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personId,
        name: site.name,
        jobTitle: site.role,
        description: site.description,
        url: site.url,
        image: absoluteUrl(site.avatar),
        email: `mailto:${site.email}`,
        address: { "@type": "PostalAddress", addressLocality: "Istanbul", addressCountry: "TR" },
        knowsAbout: site.skills,
        sameAs: site.socials.map((s) => s.href),
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        name: site.name,
        url: site.url,
        inLanguage: "en",
        author: { "@id": personId },
      },
    ],
  };
}

// Ties the Person (from the root layout) to the home page, Google's ProfilePage pattern
export function profilePageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${site.url}/#profilepage`,
    url: site.url,
    name: `${site.name} · ${site.role}`,
    mainEntity: { "@id": personId },
    isPartOf: { "@id": `${site.url}/#website` },
  };
}

export function videosJsonLd(page: WorkSlug) {
  return {
    "@context": "https://schema.org",
    "@graph": videosFor(page).map((v) => ({
      "@type": "VideoObject",
      name: v.title,
      description: v.description,
      thumbnailUrl: absoluteUrl(v.poster),
      contentUrl: absoluteUrl(v.src),
      uploadDate: v.uploadDate,
      duration: v.duration,
      creator: { "@id": personId },
    })),
  };
}

export function playableJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: "Playable ad",
    description: getWork("playable-ad").description,
    url: absoluteUrl("/playable-ad"),
    image: absoluteUrl(getWork("playable-ad").poster),
    genre: "Playable ad",
    keywords: ["playable ad", "HTML5", "Three.js", "mobile game marketing"],
    creator: { "@id": personId },
  };
}

export function gameJsonLd() {
  return {
    "@context": "https://schema.org",
    // CreativeWork, not VideoGame: Google treats VideoGame as a SoftwareApplication rich result
    // that needs offers and ratings, so it would only show up as an error in Search Console.
    "@type": "CreativeWork",
    name: "Pirates Match",
    description:
      "A match-3 mobile game built in Unity C# with Spine 2D animation and an original soundtrack, playable in the browser (WebGL).",
    url: absoluteUrl("/development"),
    image: absoluteUrl("/media/match3/game-cover.jpg"),
    genre: "Match-3 puzzle",
    keywords: ["match-3", "Unity", "C#", "Spine 2D", "WebGL"],
    sameAs: "https://github.com/mahmut483/Pirates-Match",
    author: { "@id": personId },
  };
}
