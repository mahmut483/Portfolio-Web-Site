import type { Metadata } from "next";
import WorkHeader from "../components/WorkHeader";
import PlayableFrame from "../components/PlayableFrame";
import { ArrowUpRight } from "../components/icons";

export const metadata: Metadata = {
  title: "Playable Ad",
};

const GAME = "/media/playablead/playablead.html";

export default function PlayableAdPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-28 sm:px-8 sm:pb-32 sm:pt-36">
      {/* ── Top section: Description (left) + Game (right) ── */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
        {/* Left: Header + Description */}
        <div>
          <WorkHeader slug="playable-ad" />
          <div className="flex flex-col justify-center">
            <p className="text-lg leading-relaxed text-mist sm:text-xl">
              An end-to-end Playable Ad I built from scratch. The 3D models
              were created using Blender MCP.
            </p>

            <div className="mt-8">
              <h3 className="mb-4 text-base font-semibold uppercase tracking-widest text-mist">
                Tools Used
              </h3>
              <ul className="space-y-3 text-base sm:text-lg">
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink/40" />
                  <span>
                    <span className="font-medium text-ink">Development:</span>{" "}
                    <span className="text-mist">HTML5 & Three.js</span>
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <a
                href={GAME}
                target="_blank"
                rel="noopener"
                className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-line-strong px-5 py-2.5 text-base font-medium text-mist transition-colors hover:bg-raised hover:text-ink"
              >
                Play Fullscreen
                <ArrowUpRight />
              </a>
            </div>
          </div>
        </div>

        {/* Right: Playable Frame */}
        <div className="flex flex-col items-center lg:items-end">
          <PlayableFrame
            src={GAME}
            cover="/media/previews/playablead.jpg"
            title="Playable Ad Demo"
            className="w-[min(100%,calc(78svh*9/16))] aspect-[9/16]"
            sizes="(min-width: 1024px) 440px, 100vw"
          />
        </div>
      </div>
    </main>
  );
}
