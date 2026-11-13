import type { WorkSlug } from "./site";

// Search-facing details for each video: VideoObject JSON-LD and the video sitemap.
// The pages keep their own layout lists; entries here are matched by `src`.
// uploadDate is when the video was first published on this site.
export type VideoInfo = {
  page: WorkSlug;
  src: string;
  poster: string;
  title: string;
  description: string;
  duration: string; // ISO 8601
  uploadDate: string;
};

export const videos: VideoInfo[] = [
  {
    page: "development",
    src: "/media/match3/match3.mp4",
    poster: "/media/match3/match3.jpg",
    title: "Pirates Match gameplay",
    description:
      "Gameplay of Pirates Match, a match-3 mobile game built in Unity C# with Spine 2D animation and an original soundtrack.",
    duration: "PT1M23S",
    uploadDate: "2026-10-20T12:00:00+03:00",
  },
  {
    page: "development",
    src: "/media/match3/match3breakdown.mp4",
    poster: "/media/match3/match3breakdown.jpg",
    title: "Pirates Match breakdown",
    description:
      "How Pirates Match was made: Unity C# game development, Spine 2D animation and music production.",
    duration: "PT21S",
    uploadDate: "2026-10-20T12:00:00+03:00",
  },
  {
    page: "development",
    src: "/media/gearbag/gearbag.mp4",
    poster: "/media/gearbag/gearbag.jpg",
    title: "Gear Bag: scripted Unity ad creative (Brew Games case)",
    description:
      "A scripted marketing creative built in Unity for the Brew Games Marketing Developer case study: scene layout, animation and final video capture.",
    duration: "PT36S",
    uploadDate: "2026-11-07T12:00:00+03:00",
  },
  {
    page: "character-animations",
    src: "/media/charanim/charanim1.mp4",
    poster: "/media/charanim/charanim1.jpg",
    title: "2D character rig demo",
    description: "A 2D character rig built and animated in Unity.",
    duration: "PT9S",
    uploadDate: "2026-10-20T12:00:00+03:00",
  },
  {
    page: "character-animations",
    src: "/media/charanim/charanim2.mp4",
    poster: "/media/charanim/charanim2.jpg",
    title: "2D character animation 1",
    description: "2D character animation in Unity for a mobile game marketing creative.",
    duration: "PT24S",
    uploadDate: "2026-10-20T12:00:00+03:00",
  },
  {
    page: "character-animations",
    src: "/media/charanim/charanim3.mp4",
    poster: "/media/charanim/charanim3.jpg",
    title: "2D character animation 2",
    description: "2D character animation in Unity for a mobile game marketing creative.",
    duration: "PT16S",
    uploadDate: "2026-10-20T12:00:00+03:00",
  },
  {
    page: "marketing-videos",
    src: "/media/reels/reels1.mp4",
    poster: "/media/reels/reels1.jpg",
    title: "Black Ledger video ad 1",
    description:
      "Mobile game video ad for Black Ledger: in-game scenes animated in Unity and edited in After Effects.",
    duration: "PT38S",
    uploadDate: "2026-10-20T12:00:00+03:00",
  },
  {
    page: "marketing-videos",
    src: "/media/reels/reels2.mp4",
    poster: "/media/reels/reels2.jpg",
    title: "Black Ledger video ad 2",
    description:
      "Mobile game video ad for Black Ledger: in-game scenes animated in Unity and edited in After Effects.",
    duration: "PT44S",
    uploadDate: "2026-10-20T12:00:00+03:00",
  },
  {
    page: "marketing-videos",
    src: "/media/reels/reels3.mp4",
    poster: "/media/reels/reels3.jpg",
    title: "Playable ad promo video",
    description: "Promotional video for an end-to-end HTML5 playable ad, edited in After Effects.",
    duration: "PT30S",
    uploadDate: "2026-10-20T12:00:00+03:00",
  },
];

export function videosFor(page: WorkSlug) {
  return videos.filter((v) => v.page === page);
}

// Name for a video file, used as the player's accessible name and as its visible title
export function videoTitle(src: string) {
  return videos.find((v) => v.src === src)?.title;
}
