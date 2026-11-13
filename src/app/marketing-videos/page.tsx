import type { Metadata } from "next";
import WorkHeader from "../components/WorkHeader";
import VideoPlayer from "../components/VideoPlayer";

export const metadata: Metadata = {
  title: "Marketing Videos",
};

const blackLedgerNote =
  "Everything except the illustrations is mine. The 2D animations were AI-generated in Unity to my specifications. Editing done in After Effects.";

const videos = [
  {
    src: "/media/reels/reels1.mp4",
    poster: "/media/reels/reels1.jpg",
    note: blackLedgerNote,
  },
  {
    src: "/media/reels/reels2.mp4",
    poster: "/media/reels/reels2.jpg",
    note: blackLedgerNote,
  },
  {
    src: "/media/reels/reels3.mp4",
    poster: "/media/reels/reels3.jpg",
    note: "Created the promotional video for my end-to-end playable ad project using After Effects MCP.",
  },
];

export default function MarketingVideosPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-28 sm:px-8 sm:pb-32 sm:pt-36">
      <WorkHeader slug="marketing-videos" />

      {/* One video per row: note on the left, video on the right */}
      <div className="divide-y divide-line">
        {videos.map((video) => (
          <div
            key={video.src}
            className="grid items-center gap-6 py-10 first:pt-0 last:pb-0 sm:py-14 md:grid-cols-[minmax(0,1fr)_22rem] md:gap-16"
          >
            <p
              className="max-w-md text-lg leading-relaxed sm:text-xl"
            >
              {video.note}
            </p>
            <div className="w-full max-w-[22rem] mx-auto md:mx-0 rounded-2xl overflow-hidden border border-line bg-black hover:border-line-strong transition-colors">
              <VideoPlayer
                src={video.src}
                poster={video.poster}
                className="w-full aspect-[9/16] object-contain bg-black"
              />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
