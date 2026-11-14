export const site = {
  name: "Mahmut Karaarslan",
  // Matches the CV headline; used in page titles, JSON-LD and share images
  role: "Game - Marketing Developer & 2D Animator",
  url: "https://mahmut-karaarslan.vercel.app",
  description:
    "Mahmut Karaarslan, game and marketing developer in Istanbul: Unity C# gameplay, playable ads, video ad creatives and 2D character animation for mobile games.",
  // One-line pitch shown under the name on the home page
  intro:
    "I build gameplay scenes, video ads and playable ads for mobile games, and animate the characters in them.",
  email: "mahmutkaraarslan2006@gmail.com",
  phone: "+90 551 541 78 85",
  phoneHref: "tel:+905515417885",
  location: "Istanbul, Turkey",
  avatar: "/cv/avatar.jpg",
  skills: [
    "Unity C#",
    "Spine 2D",
    "Playable ads",
    "Video ad creatives",
    "2D character animation",
    "Three.js",
    "Pixi.js",
    "Adobe After Effects",
    "Adobe Photoshop",
    "Meta Ads",
    "Google Ads",
    "Next.js",
    "Firebase",
  ],
  cv: {
    pdf: "/cv/mahmut_karaarslan_cv.pdf",
    // Rendered from the PDF; give each new export a new file name so caches pick it up
    image: "/cv/mahmut-karaarslan-cv-2026-11-14.jpg",
    width: 2480,
    height: 3507,
  },
  socials: [
    {
      label: "LinkedIn",
      display: "linkedin.com/in/mahmut-karaarslan",
      href: "https://www.linkedin.com/in/mahmut-karaarslan-822560336/",
    },
    {
      label: "GitHub",
      display: "github.com/mahmut483",
      href: "https://github.com/mahmut483",
    },
    {
      label: "ArtStation",
      display: "artstation.com/mahmutkaraarslan",
      href: "https://www.artstation.com/mahmutkaraarslan",
    },
  ],
};

// Home grid, category page headers, page metadata, share images and the sitemap share this list
export const work = [
  {
    slug: "development",
    title: "Development",
    description:
      "Pirates Match, a Unity C# match-3 game with Spine 2D animation you can play in the browser, plus a scripted Unity marketing creative for Brew Games.",
    preview: "/media/previews/match3.mp4",
    poster: "/media/previews/match3.jpg",
  },
  {
    slug: "character-animations",
    title: "Character Animations",
    description:
      "2D character rigging and animation in Unity for game marketing creatives and gameplay, by Mahmut Karaarslan.",
    preview: "/media/previews/charanim.mp4",
    poster: "/media/previews/charanim.jpg",
  },
  {
    slug: "playable-ad",
    title: "Playable Ad",
    description:
      "An end-to-end HTML5 playable ad built with Three.js by Mahmut Karaarslan. Play it right in the browser.",
    preview: "/media/previews/playablead.mp4",
    poster: "/media/previews/playablead.jpg",
  },
  {
    slug: "marketing-videos",
    title: "Marketing Videos",
    description:
      "Video ad creatives for games, with 2D animation in Unity and editing in After Effects by Mahmut Karaarslan.",
    preview: "/media/previews/reels.mp4",
    poster: "/media/previews/reels.jpg",
  },
] as const;

export type WorkSlug = (typeof work)[number]["slug"];

export function getWork(slug: WorkSlug) {
  return work.find((w) => w.slug === slug)!;
}

export const pages = {
  cv: {
    title: "CV",
    description: `CV of ${site.name}, ${site.role}: mobile game marketing and development experience, skills and education. PDF download.`,
  },
  contact: {
    title: "Contact",
    description: `Contact ${site.name}: email, phone, LinkedIn, GitHub and ArtStation.`,
  },
};

// Last real content change per route, for the sitemap. Update when a page's content changes.
export const updated: Record<string, string> = {
  "/": "2026-11-14",
  "/development": "2026-11-14",
  "/character-animations": "2026-11-14",
  "/playable-ad": "2026-11-14",
  "/marketing-videos": "2026-11-14",
  "/cv": "2026-11-14",
  "/contact": "2026-11-07",
};

export function absoluteUrl(path: string) {
  return new URL(path, site.url).toString();
}
