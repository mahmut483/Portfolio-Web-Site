export const site = {
  name: "Mahmut Karaarslan",
  role: "Marketing artist and 2D animator",
  email: "mahmutkaraarslan2006@gmail.com",
  phone: "+90 551 541 78 85",
  phoneHref: "tel:+905515417885",
  location: "Istanbul, Turkey",
  avatar: "/cv/avatar.jpg",
  cv: {
    pdf: "/cv/mahmut_karaarslan_cv.pdf",
    // Rendered from the PDF; give each new export a new file name so caches pick it up
    image: "/cv/mahmut-karaarslan-cv-2026-11.jpg",
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

// Home grid and category page headers share this list
export const work = [
  {
    slug: "development",
    title: "Development",
    preview: "/media/previews/match3.mp4",
    poster: "/media/previews/match3.jpg",
  },
  {
    slug: "character-animations",
    title: "Character Animations",
    preview: "/media/previews/charanim.mp4",
    poster: "/media/previews/charanim.jpg",
  },
  {
    slug: "playable-ad",
    title: "Playable Ad",
    preview: "/media/previews/playablead.mp4",
    poster: "/media/previews/playablead.jpg",
  },
  {
    slug: "marketing-videos",
    title: "Marketing Videos",
    preview: "/media/previews/reels.mp4",
    poster: "/media/previews/reels.jpg",
  },
] as const;

export type WorkSlug = (typeof work)[number]["slug"];

export function getWork(slug: WorkSlug) {
  return work.find((w) => w.slug === slug)!;
}
