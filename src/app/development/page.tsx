import type { Metadata } from "next";
import WorkHeader from "../components/WorkHeader";
import JsonLd from "../components/JsonLd";
import { getWork } from "../lib/site";
import { pageMetadata, videosJsonLd, gameJsonLd } from "../lib/seo";
import VideoPlayer from "../components/VideoPlayer";
import PlayableFrame from "../components/PlayableFrame";
import FullscreenVideoButton from "../components/FullscreenVideoButton";
import { ArrowUpRight } from "../components/icons";

const item = getWork("development");

export const metadata: Metadata = pageMetadata({
  path: "/development",
  title: item.title,
  description: item.description,
});

// WebGL build of Pirates Match: game board only, endless demo rounds
const GAME = "/media/match3/game/index.html";

const piratesVideos = [
  { src: "/media/match3/match3.mp4", poster: "/media/match3/match3.jpg" },
  {
    src: "/media/match3/match3breakdown.mp4",
    poster: "/media/match3/match3breakdown.jpg",
  },
];

export default function DevelopmentPage() {
  return (
    <main className="w-full flex-1 pb-24 pt-28 sm:pb-32 sm:pt-36">
      <JsonLd data={videosJsonLd("development")} />
      <JsonLd data={gameJsonLd()} />
      {/* ── Project 1: Pirates Match ── */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
          {/* Left: Header + Description */}
          <div>
            <WorkHeader slug="development" />
            <h2 className="mb-4 font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl text-ink">
              Pirates Match
            </h2>
            <p className="text-lg leading-relaxed text-mist sm:text-xl">
              I independently handled the game development, animation, and music
              production for this project.
            </p>

            <div className="mt-8">
              <h3 className="mb-4 text-base font-semibold uppercase tracking-widest text-mist">
                Tools Used
              </h3>
              <ul className="space-y-3 text-base sm:text-lg">
                {[
                  { label: "Development", value: "Unity C#" },
                  { label: "Animation", value: "Unity & Spine 2D" },
                  { label: "Music Production", value: "GarageBand" },
                  { label: "Backend Service", value: "Firebase" },
                ].map((item) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink/40" />
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

            <p className="mt-8 text-base leading-relaxed text-mist">
              Leveraged AI tools to assist with coding and visual asset creation.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="https://github.com/mahmut483/Pirates-Match"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-5 py-2.5 text-base font-medium text-mist transition-colors hover:bg-raised hover:text-ink"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.11.82-.26.82-.58v-2.16c-3.34.73-4.04-1.61-4.04-1.61a3.18 3.18 0 0 0-1.34-1.76c-1.08-.74.08-.73.08-.73a2.52 2.52 0 0 1 1.84 1.24 2.56 2.56 0 0 0 3.5 1 2.56 2.56 0 0 1 .76-1.6c-2.67-.3-5.47-1.33-5.47-5.93a4.64 4.64 0 0 1 1.24-3.22 4.3 4.3 0 0 1 .12-3.18s1-.32 3.3 1.23a11.38 11.38 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23a4.3 4.3 0 0 1 .12 3.18 4.64 4.64 0 0 1 1.23 3.22c0 4.61-2.81 5.63-5.48 5.92a2.87 2.87 0 0 1 .82 2.23v3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .3" />
                </svg>
                Source Code
                <ArrowUpRight />
              </a>

              <a
                href={GAME}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-5 py-2.5 text-base font-medium text-mist transition-colors hover:bg-raised hover:text-ink"
              >
                Play Fullscreen
                <ArrowUpRight />
              </a>
            </div>
          </div>

          {/* Right: Game */}
          <div className="flex flex-col items-center lg:items-end w-full">
            <PlayableFrame
              src={GAME}
              cover="/media/match3/game-cover.jpg"
              title="Pirates Match demo"
              className="w-[min(100%,23.5rem,calc(80svh*9/19.5))] aspect-[9/19.5]"
              sizes="(min-width: 1024px) 380px, 100vw"
            />
          </div>
        </div>

        {/* Pirates Match Videos */}
        <div className="mt-12 sm:mt-16">
          <h3 className="mb-6 font-display text-2xl font-semibold tracking-tight text-left sm:text-3xl">
            Pirates Match Videos
          </h3>
          {/* One video per row on phones so the player controls stay usable */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-14 lg:gap-20 max-w-[min(20rem,calc(75svh*9/19.5))] sm:max-w-3xl w-full mx-auto">
            {piratesVideos.map((video) => (
              <div
                key={video.src}
                className="rounded-2xl overflow-hidden border border-line bg-transparent hover:border-line-strong transition-colors"
              >
                <VideoPlayer
                  src={video.src}
                  poster={video.poster}
                  className="w-full aspect-[9/19.5] object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Full Width Divider ── */}
      <hr className="w-full border-0 border-t border-line-strong my-20 sm:my-28" />

      {/* ── Project 2: Brew Games Case ── */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
          {/* Left: Description */}
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl text-ink">
              Brew Games Marketing Developer Case
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-mist sm:text-xl">
              Developed a scripted marketing creative in Unity for the Brew
              Games Marketing Developer case study. Orchestrated the scene
              layout, crafted animations using the provided assets, and produced
              the final video capture.
            </p>

            <div className="mt-8">
              <h3 className="mb-4 text-base font-semibold uppercase tracking-widest text-mist">
                Tools Used
              </h3>
              <ul className="space-y-3 text-base sm:text-lg">
                {[{ label: "Development", value: "Unity C#" }].map((item) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink/40" />
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

            <p className="mt-8 text-base leading-relaxed text-mist">
              Utilized AI tools to assist with coding, animation sequences, and
              scene choreography.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <FullscreenVideoButton
                videoSrc="/media/gearbag/gearbag.mp4"
                videoId="gearbag-video"
                label="Watch Fullscreen"
              />
            </div>
          </div>

          {/* Right: Gear Bag Video */}
          <div className="flex flex-col items-center lg:items-end w-full">
            <div className="w-full max-w-[21rem] rounded-2xl overflow-hidden border border-line bg-transparent hover:border-line-strong transition-colors">
              <VideoPlayer
                id="gearbag-video"
                src="/media/gearbag/gearbag.mp4"
                poster="/media/gearbag/gearbag.jpg"
                // Loaded up front so "Watch Fullscreen" can enter fullscreen on iPhone
                preload="metadata"
                className="w-full aspect-[9/16] object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
