"use client";

import { ArrowUpRight } from "./icons";

interface FullscreenVideoButtonProps {
  videoSrc: string;
  videoId?: string;
  label?: string;
}

type FullscreenVideo = HTMLVideoElement & {
  webkitRequestFullscreen?: () => void;
  // iPhone Safari only supports fullscreen on <video> through this method
  webkitEnterFullscreen?: () => void;
};

export default function FullscreenVideoButton({
  videoSrc,
  videoId,
  label = "Watch Fullscreen",
}: FullscreenVideoButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!videoId) return;
    const video = document.getElementById(videoId) as FullscreenVideo | null;
    if (!video) return;

    if (video.requestFullscreen) {
      e.preventDefault();
      video.requestFullscreen().catch(() => {});
      video.play().catch(() => {});
    } else if (video.webkitRequestFullscreen) {
      e.preventDefault();
      video.webkitRequestFullscreen();
      video.play().catch(() => {});
    } else if (
      video.webkitEnterFullscreen &&
      // iOS throws InvalidStateError before metadata has loaded (common in Low Power / Low Data mode)
      video.readyState >= HTMLMediaElement.HAVE_METADATA
    ) {
      e.preventDefault();
      video.play().catch(() => {});
      try {
        video.webkitEnterFullscreen();
      } catch {
        window.open(videoSrc, "_blank", "noopener");
      }
    }
    // Otherwise let the link open the mp4 in a new tab (iOS plays it in its native player)
  };

  return (
    <a
      href={videoSrc}
      target="_blank"
      rel="noopener"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-5 py-2.5 text-base font-medium text-mist transition-colors hover:bg-raised hover:text-ink cursor-pointer"
    >
      {label}
      <ArrowUpRight />
    </a>
  );
}
