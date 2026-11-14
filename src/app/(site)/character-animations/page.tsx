import type { Metadata } from "next";
import WorkHeader from "../../components/WorkHeader";
import JsonLd from "../../components/JsonLd";
import { getWork } from "../../lib/site";
import { pageMetadata, videosJsonLd } from "../../lib/seo";
import VideoPlayer from "../../components/VideoPlayer";

const item = getWork("character-animations");

export const metadata: Metadata = pageMetadata({
  path: "/character-animations",
  title: item.title,
  description: item.description,
});

const rigVideo = {
  src: "/media/charanim/charanim1.mp4",
  poster: "/media/charanim/charanim1.jpg",
  aspect: "aspect-[1164/1386]",
};

const animationVideos = [
  {
    src: "/media/charanim/charanim2.mp4",
    poster: "/media/charanim/charanim2.jpg",
    aspect: "aspect-[16/9]",
  },
  {
    src: "/media/charanim/charanim3.mp4",
    poster: "/media/charanim/charanim3.jpg",
    aspect: "aspect-[16/9]",
  },
];

export default function CharacterAnimationsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-28 sm:px-8 sm:pb-32 sm:pt-36">
      <JsonLd data={videosJsonLd("character-animations")} />
      {/* ── Top section: Description (left) + Rig Demo Video (right) ── */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
        {/* Left: Header + Description */}
        <div>
          <WorkHeader slug="character-animations" />
          <div className="flex flex-col justify-center">
            <p className="text-lg leading-relaxed text-mist sm:text-xl">
              Except for the illustrations, all work is mine. Handled character
              rigging and animations in Unity, assisted by AI tools throughout
              the production process.
            </p>

            <div className="mt-8">
              <h3 className="mb-4 text-base font-semibold uppercase tracking-widest text-mist">
                Tools Used
              </h3>
              <ul className="space-y-3 text-base sm:text-lg">
                {[
                  { label: "Animation", value: "Unity 2D Animation" },
                  { label: "Rigging", value: "Unity Bone Rigging & 2D IK" },
                ].map((item) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink/40" />
                    <span>
                      <span className="font-medium text-ink">
                        {item.label}:
                      </span>{" "}
                      <span className="text-mist">{item.value}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right: Rigging Video */}
        <div className="flex flex-col items-center lg:items-end">
          <div className="w-full rounded-2xl overflow-hidden border border-line bg-black hover:border-line-strong transition-colors">
            <VideoPlayer
              src={rigVideo.src}
              poster={rigVideo.poster}
              className={`w-full ${rigVideo.aspect} object-contain bg-black`}
            />
          </div>
        </div>
      </div>

      {/* ── Bottom section: Animation Videos ── */}
      <div id="other-animations" data-section className="mt-16 scroll-mt-28 sm:mt-20">
        <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight text-center sm:text-left sm:text-3xl">
          Other Animations
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {animationVideos.map((video) => (
            <div
              key={video.src}
              className="rounded-2xl overflow-hidden border border-line bg-black hover:border-line-strong transition-colors"
            >
              <VideoPlayer
                src={video.src}
                poster={video.poster}
                className={`w-full ${video.aspect} object-contain bg-black`}
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
